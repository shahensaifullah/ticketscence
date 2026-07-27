from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.choices import WorkspaceRole
from organizations.models import WorkspaceMember
from projects.models import Project
from tickets.models import Ticket, TicketExternalLink, TicketTimeEntry
from tickets.serializers import (
    TicketCreateSerializer,
    TicketDeleteSerializer,
    TicketDetailSerializer,
    TicketExternalLinkCreateSerializer,
    TicketExternalLinkSerializer,
    TicketSummarySerializer,
    TicketUpdateSerializer,
)
from tickets.services import (
    create_ticket,
    heartbeat_ticket_timer,
    start_ticket_timer,
    stop_ticket_timer,
    update_ticket,
)
from topics.models import Topic


TICKET_CREATOR_ROLES = {
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
}
TICKET_DELETE_ROLES = {
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
}


def get_membership(user, workspace_slug):
    return get_object_or_404(
        WorkspaceMember.objects.select_related("workspace"),
        user=user,
        workspace__slug=workspace_slug,
        workspace__is_active=True,
        is_active=True,
    )


def resolve_ticket(organization, reference):
    normalized = reference.upper()
    if normalized.startswith("TS-") and normalized[3:].isdigit():
        return get_object_or_404(
            Ticket.objects.select_related(
                "organization",
                "project",
                "origin_topic",
                "assignee",
            ).prefetch_related("external_links", "time_entries__user"),
            organization=organization,
            number=int(normalized[3:]),
        )
    return get_object_or_404(
        Ticket.objects.select_related(
            "organization",
            "project",
            "origin_topic",
            "assignee",
        ).prefetch_related("external_links", "time_entries__user"),
        organization=organization,
        uid=reference,
    )


class TicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        tickets = Ticket.objects.filter(
            organization=membership.workspace
        ).select_related(
            "organization",
            "project",
            "assignee",
        ).prefetch_related("time_entries__user")
        project_filter = request.query_params.get("project")
        if project_filter:
            tickets = tickets.filter(
                models.Q(project__uid=project_filter)
                | models.Q(project__key__iexact=project_filter)
            )
        return Response(TicketSummarySerializer(tickets, many=True).data)

    def post(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in TICKET_CREATOR_ROLES:
            raise PermissionDenied("Guests cannot create tickets.")
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        project = get_object_or_404(
            Project.objects,
            uid=data["project_uid"],
            organization=membership.workspace,
            is_active=True,
        )
        origin_topic = None
        if data.get("origin_topic_uid"):
            origin_topic = get_object_or_404(
                Topic.objects,
                uid=data["origin_topic_uid"],
                organization=membership.workspace,
            )
        try:
            ticket = create_ticket(
                organization=membership.workspace,
                created_by=request.user,
                title=data["title"],
                description=data["description"],
                priority=data.get("priority"),
                project=project,
                origin_topic=origin_topic,
                estimated_minutes=data.get("estimated_minutes", 0),
                due_date=data.get("due_date"),
            )
        except ValueError as error:
            raise ValidationError({"ticket": str(error)}) from error
        return Response(
            TicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        ticket = resolve_ticket(membership.workspace, reference)
        return Response(TicketDetailSerializer(ticket).data)

    def patch(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        if membership.role == WorkspaceRole.GUEST:
            raise PermissionDenied("Guests cannot update tickets.")
        ticket = resolve_ticket(membership.workspace, reference)
        serializer = TicketUpdateSerializer(
            ticket,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        validated_data = dict(serializer.validated_data)
        if "project_uid" in validated_data:
            project_uid = validated_data.pop("project_uid")
            validated_data["project"] = get_object_or_404(
                Project.objects,
                uid=project_uid,
                organization=membership.workspace,
                is_active=True,
            )
        if "assignee_uid" in validated_data:
            assignee_uid = validated_data.pop("assignee_uid")
            assignee = None
            if assignee_uid:
                assignee_membership = get_object_or_404(
                    WorkspaceMember.objects.select_related("user"),
                    workspace=membership.workspace,
                    user__uid=assignee_uid,
                    user__is_active=True,
                    is_active=True,
                    role__in=(
                        WorkspaceRole.OWNER,
                        WorkspaceRole.ADMIN,
                        WorkspaceRole.MEMBER,
                    ),
                )
                assignee = assignee_membership.user
            validated_data["assignee"] = assignee
        try:
            update_ticket(
                ticket=ticket,
                actor=request.user,
                validated_data=validated_data,
            )
        except ValueError as error:
            raise ValidationError({"ticket": str(error)}) from error
        return Response(TicketDetailSerializer(ticket).data)

    def delete(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in TICKET_DELETE_ROLES:
            raise PermissionDenied(
                "Only Owners and Admins can delete tickets."
            )
        ticket = resolve_ticket(membership.workspace, reference)
        serializer = TicketDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expected = (
            ticket.origin_topic.title
            if ticket.origin_topic
            else ticket.reference
        )
        if serializer.validated_data["confirmation"] != expected:
            raise ValidationError(
                {
                    "confirmation": (
                        "Confirmation does not exactly match "
                        f'"{expected}".'
                    )
                }
            )
        ticket.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TicketExternalLinkCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        if membership.role == WorkspaceRole.GUEST:
            raise PermissionDenied("Guests cannot add ticket links.")
        ticket = resolve_ticket(membership.workspace, reference)
        serializer = TicketExternalLinkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        link = serializer.save(ticket=ticket, added_by=request.user)
        return Response(
            TicketExternalLinkSerializer(link).data,
            status=status.HTTP_201_CREATED,
        )


class TicketTimerStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        if membership.role == WorkspaceRole.GUEST:
            raise PermissionDenied("Guests cannot track Ticket time.")
        ticket = resolve_ticket(membership.workspace, reference)
        try:
            start_ticket_timer(ticket=ticket, user=request.user)
        except ValueError as error:
            raise ValidationError({"timer": str(error)}) from error
        ticket = resolve_ticket(membership.workspace, reference)
        return Response(TicketSummarySerializer(ticket).data)


class ActiveTicketTimerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        entry = (
            TicketTimeEntry.objects.filter(
                user=request.user,
                status=TicketTimeEntry.Status.PROGRESSING,
            )
            .select_related("ticket__organization")
            .first()
        )
        if not entry:
            return Response(None)
        ticket = resolve_ticket(
            entry.ticket.organization,
            entry.ticket.reference,
        )
        return Response(TicketSummarySerializer(ticket).data)


class TicketTimerStopView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        if membership.role == WorkspaceRole.GUEST:
            raise PermissionDenied("Guests cannot track Ticket time.")
        ticket = resolve_ticket(membership.workspace, reference)
        entry = get_object_or_404(
            TicketTimeEntry.objects.select_related("user"),
            ticket=ticket,
            status=TicketTimeEntry.Status.PROGRESSING,
        )
        if (
            entry.user_id != request.user.id
            and membership.role not in TICKET_DELETE_ROLES
        ):
            raise PermissionDenied(
                "Only the timer owner, an Owner, or an Admin can stop it."
            )
        stop_ticket_timer(entry=entry)
        ticket = resolve_ticket(membership.workspace, reference)
        return Response(TicketSummarySerializer(ticket).data)


class TicketTimerHeartbeatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug, reference):
        membership = get_membership(request.user, workspace_slug)
        if membership.role == WorkspaceRole.GUEST:
            raise PermissionDenied("Guests cannot track Ticket time.")
        ticket = resolve_ticket(membership.workspace, reference)
        entry = get_object_or_404(
            TicketTimeEntry.objects,
            ticket=ticket,
            user=request.user,
            status=TicketTimeEntry.Status.PROGRESSING,
        )
        heartbeat_ticket_timer(entry=entry)
        ticket = resolve_ticket(membership.workspace, reference)
        return Response(TicketSummarySerializer(ticket).data)
