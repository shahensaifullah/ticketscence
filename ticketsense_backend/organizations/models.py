from autoslug import AutoSlugField
from django.db import models
from django.db.models import Q

from accounts.choices import WorkspaceRole
from accounts.models import User
from shared_app.models import BaseModel


# Create your models here.
class Workspace(BaseModel):
    name = models.CharField(max_length=255)
    slug = AutoSlugField(populate_from='name', unique=True)

    is_active = models.BooleanField(default=True)

    members = models.ManyToManyField(User, through="WorkspaceMember")

    def __str__(self):
        return self.name


class WorkspaceMember(BaseModel):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    role = models.CharField(
        max_length=30,
        choices=WorkspaceRole.choices,
        default=WorkspaceRole.MEMBER,
    )

    is_active = models.BooleanField(default=True)
    is_current = models.BooleanField(default=False, db_index=True)

    class Meta:
        unique_together = ("workspace", "user")
        constraints = [
            models.UniqueConstraint(
                fields=("user",),
                condition=Q(is_current=True, deleted_at__isnull=True),
                name="one_current_workspace_per_user",
            ),
            models.UniqueConstraint(
                fields=("workspace",),
                condition=Q(
                    role=WorkspaceRole.OWNER,
                    deleted_at__isnull=True,
                ),
                name="one_owner_per_workspace",
            ),
        ]
