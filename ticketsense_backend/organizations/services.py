from django.db import transaction

from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import Workspace, WorkspaceMember


PERSONAL_WORKSPACE_NAME = "Personal Workspace"


@transaction.atomic
def set_current_membership(membership):
    """Make one enabled membership the user's current workspace."""
    if (
        membership.is_deleted
        or not membership.is_active
        or membership.workspace.is_deleted
        or not membership.workspace.is_active
    ):
        raise ValueError("Only an active workspace membership can be selected.")

    User.objects.select_for_update().get(pk=membership.user_id)
    WorkspaceMember.all_objects.filter(
        user_id=membership.user_id,
        is_current=True,
    ).exclude(pk=membership.pk).update(is_current=False)

    if not membership.is_current:
        membership.is_current = True
        membership.save(update_fields=["is_current", "updated_at"])

    return membership


@transaction.atomic
def ensure_user_workspace(user, workspace_name=None):
    """Return the user's current membership, creating a workspace if needed."""
    User.objects.select_for_update().get(pk=user.pk)
    memberships = WorkspaceMember.objects.filter(
        user=user,
        is_active=True,
        workspace__is_active=True,
    ).select_related("workspace")

    current = memberships.filter(is_current=True).first()
    if current:
        return current

    membership = memberships.order_by("created_at", "pk").first()
    if membership is None:
        workspace = Workspace.objects.create(
            name=(workspace_name or "").strip() or PERSONAL_WORKSPACE_NAME,
            is_active=True,
        )
        membership = WorkspaceMember.objects.create(
            workspace=workspace,
            user=user,
            role=WorkspaceRole.OWNER,
            is_active=True,
        )

    return set_current_membership(membership)
