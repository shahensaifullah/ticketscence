from django.db import transaction
from django.db.models import Count, Q, Sum

from accounts.choices import WorkspaceRole
from organizations.models import WorkspaceMember
from projects.models import Project, ProjectMember
from tickets.models import Ticket, TicketTimeEntry


TERMINAL_TICKET_STATUSES = {
    Ticket.Status.COMPLETED,
    Ticket.Status.CLOSED,
}


def project_metrics(project):
    ticket_metrics = Ticket.objects.filter(project=project).aggregate(
        ticket_count=Count("id"),
        open_ticket_count=Count(
            "id",
            filter=~Q(status__in=TERMINAL_TICKET_STATUSES),
        ),
        completed_ticket_count=Count(
            "id",
            filter=Q(status__in=TERMINAL_TICKET_STATUSES),
        ),
        total_estimated_minutes=Sum("estimated_minutes"),
        remaining_estimated_minutes=Sum(
            "estimated_minutes",
            filter=~Q(status__in=TERMINAL_TICKET_STATUSES),
        ),
    )
    entries = TicketTimeEntry.objects.filter(
        ticket__project=project,
    ).only("started_at", "stopped_at", "duration_seconds")
    tracked_seconds = sum(
        (
            entry.duration_seconds
            if entry.stopped_at
            else entry.elapsed_seconds
        )
        for entry in entries
    )
    ticket_count = ticket_metrics["ticket_count"] or 0
    completed_count = ticket_metrics["completed_ticket_count"] or 0
    return {
        **ticket_metrics,
        "ticket_count": ticket_count,
        "open_ticket_count": ticket_metrics["open_ticket_count"] or 0,
        "completed_ticket_count": completed_count,
        "member_count": ProjectMember.objects.filter(
            project=project,
        ).count(),
        "total_estimated_minutes": (
            ticket_metrics["total_estimated_minutes"] or 0
        ),
        "remaining_estimated_minutes": (
            ticket_metrics["remaining_estimated_minutes"] or 0
        ),
        "total_tracked_seconds": tracked_seconds,
        "progress_percent": (
            round((completed_count / ticket_count) * 100)
            if ticket_count
            else 0
        ),
    }


def eligible_project_users(organization, user_uids):
    memberships = WorkspaceMember.objects.filter(
        workspace=organization,
        user__uid__in=user_uids,
        user__is_active=True,
        is_active=True,
        role__in=(
            WorkspaceRole.OWNER,
            WorkspaceRole.ADMIN,
            WorkspaceRole.MEMBER,
        ),
    ).select_related("user")
    users = [membership.user for membership in memberships]
    if len(users) != len(set(user_uids)):
        raise ValueError(
            "Every project member must be an active member of the workspace."
        )
    return users


@transaction.atomic
def create_project(
    *,
    organization,
    created_by,
    name,
    key,
    description="",
    status=Project.Status.PLANNED,
    priority=None,
    lead=None,
    member_users=(),
    start_date=None,
    target_date=None,
    color="#6750A4",
):
    project = Project.objects.create(
        organization=organization,
        created_by=created_by,
        name=name.strip(),
        key=key.strip().upper(),
        description=description.strip(),
        status=status,
        priority=priority,
        lead=lead,
        start_date=start_date,
        target_date=target_date,
        color=color.upper(),
    )
    users = {user.pk: user for user in member_users}
    users[created_by.pk] = created_by
    if lead:
        users[lead.pk] = lead
    ProjectMember.objects.bulk_create(
        [
            ProjectMember(
                project=project,
                user=user,
                added_by=created_by,
            )
            for user in users.values()
        ]
    )
    return project


@transaction.atomic
def update_project_members(*, project, actor, member_users):
    requested_ids = {user.pk for user in member_users}
    requested_ids.add(actor.pk)
    if project.lead_id:
        requested_ids.add(project.lead_id)

    ProjectMember.objects.filter(project=project).exclude(
        user_id__in=requested_ids
    ).soft_delete()
    existing_ids = set(
        ProjectMember.objects.filter(
            project=project,
            user_id__in=requested_ids,
        ).values_list("user_id", flat=True)
    )
    ProjectMember.objects.bulk_create(
        [
            ProjectMember(
                project=project,
                user_id=user_id,
                added_by=actor,
            )
            for user_id in requested_ids - existing_ids
        ]
    )

