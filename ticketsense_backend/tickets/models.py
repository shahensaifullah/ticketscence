from django.db import models
from django.utils import timezone

from accounts.models import User
from organizations.models import Workspace
from projects.models import Project
from shared_app.models import BaseModel


class Ticket(BaseModel):
    class Status(models.TextChoices):
        BACKLOG = "backlog", "Backlog"
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        IN_REVIEW = "in_review", "In review"
        COMPLETED = "completed", "Completed"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    organization = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="tickets",
    )
    origin_topic = models.ForeignKey(
        "topics.Topic",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BACKLOG,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        null=True,
        blank=True,
    )
    estimated_minutes = models.PositiveIntegerField(default=0)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_tickets",
    )
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "number"),
                name="unique_ticket_number_per_organization",
            ),
        ]
        ordering = ["-created_at"]

    @property
    def reference(self):
        return f"TS-{self.number}"

    def __str__(self):
        return f"{self.reference}: {self.title}"


class TicketExternalLink(BaseModel):
    class Provider(models.TextChoices):
        GITHUB = "github", "GitHub"
        GITHUB_PR = "github_pr", "GitHub pull request"
        GITLAB = "gitlab", "GitLab"
        BITBUCKET = "bitbucket", "Bitbucket"
        JIRA = "jira", "Jira"
        LINEAR = "linear", "Linear"
        OTHER = "other", "Other"

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="external_links",
    )
    provider = models.CharField(max_length=30, choices=Provider.choices)
    url = models.URLField(max_length=1000)
    label = models.CharField(max_length=255, blank=True)
    added_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="ticket_external_links",
    )


class TicketTimeEntry(BaseModel):
    class Status(models.TextChoices):
        PROGRESSING = "progressing", "Progressing"
        COMPLETED = "completed", "Completed"

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="time_entries",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="ticket_time_entries",
    )
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    stopped_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_heartbeat_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PROGRESSING,
        db_index=True,
    )
    progress_seconds = models.PositiveBigIntegerField(default=0)
    duration_seconds = models.PositiveBigIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("ticket",),
                condition=models.Q(
                    status="progressing",
                    deleted_at__isnull=True,
                ),
                name="one_active_timer_per_ticket",
            ),
            models.UniqueConstraint(
                fields=("user",),
                condition=models.Q(
                    status="progressing",
                    deleted_at__isnull=True,
                ),
                name="one_active_timer_per_user",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(stopped_at__isnull=True)
                    | models.Q(stopped_at__gte=models.F("started_at"))
                ),
                name="ticket_timer_stop_not_before_start",
            ),
        ]
        ordering = ["-started_at"]

    @property
    def elapsed_seconds(self):
        if self.status == self.Status.COMPLETED:
            return self.duration_seconds
        return max(
            self.progress_seconds,
            int((timezone.now() - self.started_at).total_seconds()),
        )
