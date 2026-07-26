from django.db import models
from django.utils import timezone
from pgvector.django import HnswIndex, VectorField

from accounts.models import User
from organizations.models import Workspace
from projects.models import Project
from shared_app.models import BaseModel


class Topic(BaseModel):
    class Type(models.TextChoices):
        BUG = "bug", "Bug or problem"
        FEATURE = "feature", "Feature request"
        IMPROVEMENT = "improvement", "Improvement"
        QUESTION = "question", "Technical question"
        FEEDBACK = "feedback", "Customer feedback"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        UNDER_REVIEW = "under_review", "Under review"
        ACTION_REQUIRED = "action_required", "Action required"
        PLANNED = "planned", "Planned"
        CONVERTED_TO_TICKET = "converted_to_ticket", "Converted to ticket"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    organization = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="topics",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="topics",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    topic_type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_topics",
    )
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    solution = models.TextField(blank=True)
    solution_url = models.URLField(max_length=1000, blank=True)
    solution_ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="solution_for_topics",
    )
    embedding = VectorField(dimensions=384, null=True, blank=True)
    embedding_model = models.CharField(max_length=100, blank=True)
    embedding_source_hash = models.CharField(max_length=64, blank=True)
    embedding_updated_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            HnswIndex(
                name="topic_embedding_cosine_idx",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ]

    def __str__(self):
        return self.title


class TopicComment(BaseModel):
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="topic_comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    body = models.TextField()


class TopicMention(BaseModel):
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="mentions",
    )
    comment = models.ForeignKey(
        TopicComment,
        on_delete=models.CASCADE,
        related_name="mentions",
    )
    mentioned_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="topic_mentions",
    )
    mentioned_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_topic_mentions",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("comment", "mentioned_user"),
                name="unique_user_mention_per_topic_comment",
            ),
        ]
        ordering = ["-created_at"]


class TopicAttachment(BaseModel):
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    comment = models.ForeignKey(
        TopicComment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attachments",
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="topic_attachments",
    )
    file = models.FileField(upload_to="topics/attachments/%Y/%m/")
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=150, blank=True)
    size = models.PositiveBigIntegerField(default=0)


class TopicActivity(BaseModel):
    class Event(models.TextChoices):
        CREATED = "created", "Topic created"
        COMMENTED = "commented", "Comment added"
        ATTACHMENT_ADDED = "attachment_added", "Attachment added"
        TICKET_CREATED = "ticket_created", "Ticket created"
        STATUS_CHANGED = "status_changed", "Status changed"
        SOLUTION_UPDATED = "solution_updated", "Solution updated"
        UPDATED = "updated", "Topic updated"

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="topic_activities",
    )
    event = models.CharField(max_length=30, choices=Event.choices)
    description = models.CharField(max_length=500)
