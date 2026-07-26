from django.db import models

from organizations.models import Workspace
from shared_app.models import BaseModel


class Project(BaseModel):
    organization = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    key = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "key"),
                name="unique_project_key_per_organization",
            ),
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.key}: {self.name}"

