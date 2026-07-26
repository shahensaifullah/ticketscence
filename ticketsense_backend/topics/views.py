from django.conf import settings
from django.db import transaction
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.choices import WorkspaceRole
from organizations.models import WorkspaceMember
from projects.models import Project
from tickets.models import Ticket
from tickets.serializers import TicketDetailSerializer
from tickets.services import create_ticket
from topics.models import (
    Topic,
    TopicActivity,
    TopicAttachment,
    TopicComment,
    TopicMention,
)
from topics.serializers import (
    TopicAttachmentCreateSerializer,
    TopicAttachmentSerializer,
    TopicCommentCreateSerializer,
    TopicCommentSerializer,
    TopicCreateSerializer,
    TopicDeleteSerializer,
    TopicDetailSerializer,
    TopicSerializer,
    TopicSuggestionQuerySerializer,
    TopicSuggestionSerializer,
    TopicTicketCreateSerializer,
    TopicUpdateSerializer,
)
from topics.services import (
    create_topic_comment,
    find_similar_topics,
    LocalEmbeddingUnavailable,
    record_topic_activity,
)


COLLABORATOR_ROLES = {
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
}
MANAGEMENT_ROLES = {
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
}


class TopicEmbeddingUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = (
        "Local semantic Topic matching is temporarily unavailable."
    )
    default_code = "topic_embedding_unavailable"


def get_membership(user, workspace_slug):
    return get_object_or_404(
        WorkspaceMember.objects.select_related("workspace"),
        user=user,
        workspace__slug=workspace_slug,
        workspace__is_active=True,
        is_active=True,
    )


def get_topic(organization, topic_uid):
    return get_object_or_404(
        Topic.objects.select_related(
            "organization",
            "project",
            "created_by",
        ),
        uid=topic_uid,
        organization=organization,
    )


def resolve_project(organization, project_uid):
    if not project_uid:
        return None
    return get_object_or_404(
        Project.objects,
        uid=project_uid,
        organization=organization,
        is_active=True,
    )


class TopicListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        topics = (
            Topic.objects.filter(organization=membership.workspace)
            .select_related("project", "created_by")
            .annotate(
                comment_count=Count("comments", distinct=True),
                ticket_count=Count("tickets", distinct=True),
            )
            .order_by("-is_pinned", "-last_activity_at")
        )
        return Response(TopicSerializer(topics, many=True).data)

    def post(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in COLLABORATOR_ROLES:
            raise PermissionDenied("Guests cannot create Topics.")
        serializer = TopicCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = resolve_project(
            membership.workspace,
            serializer.validated_data.pop("project_uid", None),
        )
        topic = serializer.save(
            organization=membership.workspace,
            project=project,
            created_by=request.user,
        )
        record_topic_activity(
            topic,
            request.user,
            TopicActivity.Event.CREATED,
            "Created the Topic.",
        )
        topic.comment_count = 0
        topic.ticket_count = 0
        return Response(
            TopicSerializer(topic).data,
            status=status.HTTP_201_CREATED,
        )


class TopicSuggestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug):
        membership = get_membership(request.user, workspace_slug)
        serializer = TopicSuggestionQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not settings.TOPIC_EMBEDDING_ENABLED:
            raise TopicEmbeddingUnavailable()
        try:
            suggestions = find_similar_topics(
                organization=membership.workspace,
                **serializer.validated_data,
            )
        except LocalEmbeddingUnavailable as error:
            raise TopicEmbeddingUnavailable() from error
        return Response(
            TopicSuggestionSerializer(suggestions, many=True).data
        )


class TopicDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_slug, topic_uid):
        membership = get_membership(request.user, workspace_slug)
        topic = get_object_or_404(
            Topic.objects.select_related(
                "organization",
                "project",
                "created_by",
                "solution_ticket",
                "solution_ticket__project",
                "solution_ticket__assignee",
            ).prefetch_related(
                Prefetch(
                    "comments",
                    queryset=TopicComment.objects.select_related(
                        "author",
                        "parent",
                    ).prefetch_related(
                        Prefetch(
                            "mentions",
                            queryset=TopicMention.objects.select_related(
                                "mentioned_user"
                            ),
                        ),
                        "attachments",
                    ).order_by("created_at"),
                ),
                "attachments",
                "tickets__project",
                Prefetch(
                    "activities",
                    queryset=TopicActivity.objects.select_related(
                        "actor"
                    ).order_by("-created_at"),
                ),
            ),
            uid=topic_uid,
            organization=membership.workspace,
        )
        topic.comment_count = len(topic.comments.all())
        topic.ticket_count = len(topic.tickets.all())
        return Response(TopicDetailSerializer(topic).data)

    def patch(self, request, workspace_slug, topic_uid):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied(
                "Only Owners and Admins can update Topic controls."
            )
        topic = get_topic(membership.workspace, topic_uid)
        previous_status = topic.status
        serializer = TopicUpdateSerializer(
            topic,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        solution_fields = {
            "solution",
            "solution_url",
            "solution_ticket_uid",
        }
        solution_changed = bool(solution_fields & set(request.data))
        save_kwargs = {}
        if "solution_ticket_uid" in serializer.validated_data:
            solution_ticket_uid = serializer.validated_data.pop(
                "solution_ticket_uid"
            )
            solution_ticket = None
            if solution_ticket_uid:
                solution_ticket = get_object_or_404(
                    Ticket.objects,
                    uid=solution_ticket_uid,
                    organization=membership.workspace,
                    origin_topic=topic,
                )
            save_kwargs["solution_ticket"] = solution_ticket
        serializer.save(**save_kwargs)
        if {"title", "description"} & set(request.data):
            Topic.objects.filter(pk=topic.pk).update(
                embedding=None,
                embedding_model="",
                embedding_source_hash="",
                embedding_updated_at=None,
            )
        if topic.status != previous_status:
            event = TopicActivity.Event.STATUS_CHANGED
        elif solution_changed:
            event = TopicActivity.Event.SOLUTION_UPDATED
        else:
            event = TopicActivity.Event.UPDATED
        record_topic_activity(
            topic,
            request.user,
            event,
            (
                f"Changed status from {previous_status} to {topic.status}."
                if event == TopicActivity.Event.STATUS_CHANGED
                else (
                    "Updated the Topic solution."
                    if event == TopicActivity.Event.SOLUTION_UPDATED
                    else "Updated the Topic."
                )
            ),
        )
        topic.comment_count = TopicComment.objects.filter(topic=topic).count()
        topic.ticket_count = topic.tickets.count()
        return Response(TopicSerializer(topic).data)

    def delete(self, request, workspace_slug, topic_uid):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied(
                "Only Owners and Admins can delete Topics."
            )
        topic = get_topic(membership.workspace, topic_uid)
        serializer = TopicDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["confirmation"] != topic.title:
            raise ValidationError(
                {
                    "confirmation": (
                        "Confirmation does not exactly match "
                        f'"{topic.title}".'
                    )
                }
            )
        topic.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TopicCommentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug, topic_uid):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in COLLABORATOR_ROLES:
            raise PermissionDenied("Guests cannot comment on Topics.")
        topic = get_topic(membership.workspace, topic_uid)
        if topic.is_locked and membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied("This Topic is locked.")
        serializer = TopicCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parent = None
        if serializer.validated_data.get("parent_uid"):
            parent = get_object_or_404(
                TopicComment.objects,
                uid=serializer.validated_data["parent_uid"],
                topic=topic,
            )
        try:
            comment = create_topic_comment(
                topic=topic,
                author=request.user,
                body=serializer.validated_data["body"],
                parent=parent,
                mention_user_uids=serializer.validated_data[
                    "mention_user_uids"
                ],
            )
        except ValueError as error:
            raise ValidationError({"comment": str(error)}) from error
        comment = TopicComment.objects.select_related(
            "author",
            "parent",
        ).prefetch_related("mentions__mentioned_user", "attachments").get(
            pk=comment.pk
        )
        return Response(
            TopicCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )


class TopicAttachmentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_slug, topic_uid):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in COLLABORATOR_ROLES:
            raise PermissionDenied("Guests cannot add attachments.")
        topic = get_topic(membership.workspace, topic_uid)
        if topic.is_locked and membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied("This Topic is locked.")
        serializer = TopicAttachmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = None
        if serializer.validated_data.get("comment_uid"):
            comment = get_object_or_404(
                TopicComment.objects,
                uid=serializer.validated_data["comment_uid"],
                topic=topic,
            )
        uploaded_file = serializer.validated_data["file"]
        attachment = TopicAttachment.objects.create(
            topic=topic,
            comment=comment,
            uploaded_by=request.user,
            file=uploaded_file,
            original_name=uploaded_file.name,
            content_type=getattr(uploaded_file, "content_type", ""),
            size=uploaded_file.size,
        )
        record_topic_activity(
            topic,
            request.user,
            TopicActivity.Event.ATTACHMENT_ADDED,
            f"Attached {attachment.original_name}.",
        )
        return Response(
            TopicAttachmentSerializer(
                attachment,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class TopicTicketCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, workspace_slug, topic_uid):
        membership = get_membership(request.user, workspace_slug)
        if membership.role not in MANAGEMENT_ROLES:
            raise PermissionDenied(
                "Only Owners and Admins can create Tickets from Topics."
            )
        topic = get_topic(membership.workspace, topic_uid)
        if topic.status == Topic.Status.CLOSED:
            raise ValidationError(
                {"topic": "A closed Topic cannot create new Tickets."}
            )
        serializer = TopicTicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        project = resolve_project(
            membership.workspace,
            data.get("project_uid"),
        )
        if project is None:
            project = topic.project
        try:
            ticket = create_ticket(
                organization=membership.workspace,
                created_by=request.user,
                title=data["title"],
                description=data["description"],
                priority=data["priority"],
                project=project,
                origin_topic=topic,
            )
        except ValueError as error:
            raise ValidationError({"ticket": str(error)}) from error
        return Response(
            TicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )
