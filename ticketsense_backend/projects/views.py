from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.choices import WorkspaceRole
from organizations.models import WorkspaceMember
from projects.models import Project
from projects.serializers import (
    ProjectDetailSerializer,
    ProjectSerializer,
    ProjectWriteSerializer,
)
from projects.services import (
    create_project,
    eligible_project_users,
    update_project_members,
)


MANAGEMENT_ROLES = {WorkspaceRole.OWNER, WorkspaceRole.ADMIN}


def get_membership(user, workspace_slug):
    return get_object_or_404(
        WorkspaceMember.objects.select_related("workspace"),
        user=user,
        workspace__slug=workspace_slug,
        workspace__is_active=True,
        is_active=True,
    )


def get_project(organization, project_key):
    return get_object_or_404(
        Project.objects.select_related(
            "organization",
            "lead",
            "created_by",
        ).prefetch_related(
            "memberships__user",
            "tickets__project",
            "tickets__assignee",
            "tickets__time_entries__user",
        ),
        organization=organization,
        key=project_key.upper(),
    )


def resolve_users(organization, data):
    member_uids = list(data.get("member_user_uids", []))
    lead = None
    if data.get("lead_uid"):
        member_uids.append(data["lead_uid"])
    users = eligible_project_users(organization, member_uids)
    if data.get("lead_uid"):
        lead = next(
            user for user in users if user.uid == data["lead_uid"]
        )
    return users, lead


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        projects = Project.objects.filter(
            organization=membership.workspace,
        ).select_related("lead", "created_by")
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied(
                "Only Owners and Admins can create projects."
            )
        serializer = ProjectWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        try:
            users, lead = resolve_users(membership.workspace, data)
            data.pop("member_user_uids", None)
            data.pop("lead_uid", None)
            project = create_project(
                organization=membership.workspace,
                created_by=request.user,
                lead=lead,
                member_users=users,
                **data,
            )
        except ValueError as error:
            raise ValidationError({"members": str(error)}) from error
        except IntegrityError as error:
            raise ValidationError(
                {"key": "This project key already exists in the workspace."}
            ) from error
        return Response(
            ProjectSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug, project_key):
        membership = get_membership(request.user, workspace_slug)
        project = get_project(membership.workspace, project_key)
        return Response(ProjectDetailSerializer(project).data)

    @transaction.atomic
    def patch(self, request, workspace_slug, project_key):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied(
                "Only Owners and Admins can update projects."
            )
        project = get_project(membership.workspace, project_key)
        serializer = ProjectWriteSerializer(
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        users = None
        lead = project.lead
        if "member_user_uids" in data or "lead_uid" in data:
            merged = {
                "member_user_uids": data.get(
                    "member_user_uids",
                    list(
                        project.memberships.values_list(
                            "user__uid",
                            flat=True,
                        )
                    ),
                ),
                "lead_uid": data.get(
                    "lead_uid",
                    project.lead.uid if project.lead else None,
                ),
            }
            users, lead = resolve_users(membership.workspace, merged)
        data.pop("member_user_uids", None)
        data.pop("lead_uid", None)
        for field, value in data.items():
            setattr(project, field, value)
        project.lead = lead
        try:
            project.save()
        except IntegrityError as error:
            raise ValidationError(
                {"key": "This project key already exists in the workspace."}
            ) from error
        if users is not None:
            update_project_members(
                project=project,
                actor=request.user,
                member_users=users,
            )
        project = get_project(membership.workspace, project.key)
        return Response(ProjectDetailSerializer(project).data)

