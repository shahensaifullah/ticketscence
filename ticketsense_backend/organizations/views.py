import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.choices import WorkspaceRole
from organizations.models import WorkspaceMember
from organizations.serializers import (
    MemberCreateSerializer,
    WorkspaceCreateSerializer,
    WorkspaceUpdateSerializer,
)
from organizations.services import (
    ensure_user_workspace,
    set_current_membership,
)


logger = logging.getLogger(__name__)
MANAGEMENT_ROLES = {
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MANAGER,
}


def user_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.email


def member_data(membership):
    user = membership.user
    return {
        "uid": str(membership.uid),
        "user_uid": str(user.uid),
        "name": user_name(user),
        "email": user.email,
        "role": membership.role,
        "role_label": membership.get_role_display(),
    }


def workspace_data(membership):
    workspace = membership.workspace
    return {
        "uid": str(workspace.uid),
        "name": workspace.name,
        "slug": workspace.slug,
        "role": membership.role,
        "role_label": membership.get_role_display(),
        "is_current": membership.is_current,
        "member_count": getattr(membership, "member_count", None)
        or WorkspaceMember.objects.filter(
            workspace=workspace,
            is_active=True,
        ).count(),
    }


def get_user_workspace_membership(user, workspace_slug):
    return get_object_or_404(
        WorkspaceMember.objects.select_related("workspace", "user"),
        user=user,
        workspace__slug=workspace_slug,
        workspace__is_active=True,
        is_active=True,
    )


class WorkspaceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_user_workspace(request.user)
        memberships = list(
            WorkspaceMember.objects.filter(
                user=request.user,
                workspace__is_active=True,
                is_active=True,
            )
            .select_related("workspace")
            .order_by("workspace__name")
        )

        return Response(
            {
                "user": {
                    "uid": str(request.user.uid),
                    "name": user_name(request.user),
                    "email": request.user.email,
                    "workspace_count": len(memberships),
                },
                "workspaces": [
                    workspace_data(membership)
                    for membership in memberships
                ],
            }
        )

    def post(self, request):
        serializer = WorkspaceCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        workspace = serializer.save()
        membership = WorkspaceMember.objects.select_related(
            "workspace"
        ).get(workspace=workspace, user=request.user)
        return Response(
            workspace_data(membership),
            status=status.HTTP_201_CREATED,
        )


class CurrentWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug):
        membership = get_user_workspace_membership(request.user, workspace_slug)
        set_current_membership(membership)
        return Response(workspace_data(membership))


class WorkspaceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def get_owner_membership(request, workspace_slug):
        membership = get_user_workspace_membership(
            request.user,
            workspace_slug,
        )
        if membership.role != WorkspaceRole.OWNER:
            raise PermissionDenied(
                "Only the workspace Owner can update or delete the workspace."
            )
        return membership

    def patch(self, request, workspace_slug):
        membership = self.get_owner_membership(request, workspace_slug)
        serializer = WorkspaceUpdateSerializer(
            membership.workspace,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        membership.refresh_from_db()
        return Response(workspace_data(membership))

    @transaction.atomic
    def delete(self, request, workspace_slug):
        membership = self.get_owner_membership(request, workspace_slug)
        workspace = membership.workspace
        workspace.is_active = False
        workspace.save(update_fields=["is_active", "updated_at"])
        workspace.soft_delete()
        ensure_user_workspace(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug):
        membership = get_user_workspace_membership(request.user, workspace_slug)
        memberships = (
            WorkspaceMember.objects.filter(
                workspace=membership.workspace,
                is_active=True,
                user__is_active=True,
            )
            .select_related("user")
            .order_by("user__first_name", "user__last_name", "user__email")
        )
        workspace_count = WorkspaceMember.objects.filter(
            user=request.user,
            workspace__is_active=True,
            is_active=True,
        ).count()

        return Response(
            {
                "user": {
                    "uid": str(request.user.uid),
                    "name": user_name(request.user),
                    "email": request.user.email,
                    "workspace_count": workspace_count,
                },
                "workspace": {
                    **workspace_data(membership),
                    "can_manage_members": membership.role in MANAGEMENT_ROLES,
                    "can_manage_workspace_settings": (
                        membership.role == WorkspaceRole.OWNER
                    ),
                },
                "members": [member_data(item) for item in memberships],
                "available_roles": [
                    {"value": value, "label": label}
                    for value, label in WorkspaceRole.choices
                    if value != WorkspaceRole.OWNER
                ],
            }
        )


class WorkspaceMemberCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug):
        actor_membership = get_user_workspace_membership(
            request.user,
            workspace_slug,
        )
        if actor_membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied(
                "Only Owners, Admins, and Managers can add workspace members."
            )

        serializer = MemberCreateSerializer(
            data=request.data,
            context={
                "workspace": actor_membership.workspace,
                "actor_role": actor_membership.role,
            },
        )
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        email_sent = self.send_membership_email(membership)

        return Response(
            {
                "member": member_data(membership),
                "created_user": membership.created_user,
                "email_sent": email_sent,
            },
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def send_membership_email(membership):
        user = membership.user
        workspace = membership.workspace
        login_url = f"{settings.FRONTEND_URL.rstrip('/')}/login"
        credential_text = (
            f"\nEmail: {user.email}"
            f"\nTemporary password: {membership.supplied_password}"
            if membership.created_user
            else "\nUse your existing TicketSense password."
        )
        message = (
            f"Hello {user_name(user)},\n\n"
            f"You have been added to {workspace.name} as "
            f"{membership.get_role_display()}."
            f"{credential_text}\n\n"
            f"Sign in: {login_url}\n"
        )

        try:
            send_mail(
                subject=f"You were added to {workspace.name}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return True
        except Exception:
            logger.exception(
                "Could not send workspace membership email to %s",
                user.email,
            )
            return False


class MyWorkspaceListView(ListAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkspaceMember.objects.filter()
