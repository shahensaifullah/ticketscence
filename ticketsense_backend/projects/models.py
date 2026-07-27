from django.db import models

from accounts.models import User
from organizations.models import Workspace
from shared_app.models import BaseModel


class Project(BaseModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In progress"
        ON_HOLD = "on_hold", "On hold"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    organization = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    key = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        null=True,
        blank=True,
    )
    lead = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="led_projects",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_projects",
    )
    members = models.ManyToManyField(
        User,
        through="ProjectMember",
        through_fields=("project", "user"),
        related_name="projects",
    )
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    color = models.CharField(max_length=7, default="#6750A4")
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "key"),
                name="unique_project_key_per_organization",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(start_date__isnull=True)
                    | models.Q(target_date__isnull=True)
                    | models.Q(target_date__gte=models.F("start_date"))
                ),
                name="project_target_not_before_start",
            ),
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.key}: {self.name}"


class ProjectMember(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="added_project_memberships",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("project", "user"),
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_project_member",
            ),
        ]

    def __str__(self):
        return f"{self.project.key}: {self.user.email}"
