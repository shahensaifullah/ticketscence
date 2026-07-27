from django.db import transaction
from django.db.models import Max

from organizations.models import Workspace
from projects.models import ProjectMember
from tickets.models import Ticket, TicketTimeEntry


@transaction.atomic
def create_ticket(
    *,
    organization,
    created_by,
    title,
    description,
    project,
    priority=None,
    origin_topic=None,
    estimated_minutes=0,
    due_date=None,
):
    Workspace.objects.select_for_update().get(pk=organization.pk)
    if project is None:
        raise ValueError("A Project is required to create a Ticket.")
    if project.organization_id != organization.id:
        raise ValueError("Project must belong to the ticket organization.")
    if origin_topic and origin_topic.organization_id != organization.id:
        raise ValueError("Origin Topic must belong to the ticket organization.")
    if (
        project
        and origin_topic
        and origin_topic.project_id
        and origin_topic.project_id != project.id
    ):
        raise ValueError("Ticket project must match the Origin Topic project.")

    last_number = (
        Ticket.all_objects.filter(organization=organization)
        .aggregate(max_number=Max("number"))["max_number"]
        or 0
    )
    ticket = Ticket.objects.create(
        organization=organization,
        project=project,
        origin_topic=origin_topic,
        number=last_number + 1,
        title=title.strip(),
        description=description.strip(),
        priority=priority,
        estimated_minutes=estimated_minutes,
        due_date=due_date,
        created_by=created_by,
    )

    if origin_topic:
        from topics.models import Topic, TopicActivity
        from topics.services import record_topic_activity

        if origin_topic.status != Topic.Status.CLOSED:
            origin_topic.status = Topic.Status.CONVERTED_TO_TICKET
            origin_topic.save(update_fields=["status", "updated_at"])
        record_topic_activity(
            origin_topic,
            created_by,
            TopicActivity.Event.TICKET_CREATED,
            f"Created ticket {ticket.reference}.",
        )

    return ticket


@transaction.atomic
def update_ticket(*, ticket, actor, validated_data):
    previous_status = ticket.status
    next_project = validated_data.get("project", ticket.project)
    if next_project.organization_id != ticket.organization_id:
        raise ValueError("Project must belong to the ticket organization.")
    if (
        ticket.origin_topic
        and ticket.origin_topic.project_id
        and ticket.origin_topic.project_id != next_project.id
    ):
        raise ValueError("Ticket project must match the Origin Topic project.")
    for field, value in validated_data.items():
        setattr(ticket, field, value)
    ticket.save()

    if ticket.assignee:
        ProjectMember.objects.get_or_create(
            project=ticket.project,
            user=ticket.assignee,
            defaults={"added_by": actor},
        )

    if ticket.status in {Ticket.Status.COMPLETED, Ticket.Status.CLOSED}:
        for entry in ticket.time_entries.filter(
            status=TicketTimeEntry.Status.PROGRESSING
        ):
            stop_ticket_timer(entry=entry)

    if (
        ticket.origin_topic
        and not ticket.origin_topic.is_deleted
        and ticket.status != previous_status
    ):
        from topics.models import Topic, TopicActivity
        from topics.services import record_topic_activity

        topic = ticket.origin_topic
        record_topic_activity(
            topic,
            actor,
            TopicActivity.Event.UPDATED,
            (
                f"Moved {ticket.reference} from {previous_status} "
                f"to {ticket.status}."
            ),
        )
        terminal_statuses = {
            Ticket.Status.COMPLETED,
            Ticket.Status.CLOSED,
        }
        remaining = topic.tickets.exclude(
            status__in=terminal_statuses
        ).exists()
        if not remaining and topic.status != Topic.Status.CLOSED:
            topic.status = Topic.Status.RESOLVED
            topic.save(update_fields=["status", "updated_at"])
            record_topic_activity(
                topic,
                actor,
                TopicActivity.Event.STATUS_CHANGED,
                "Resolved the Topic after all related Tickets completed.",
            )

    return ticket


@transaction.atomic
def start_ticket_timer(*, ticket, user):
    locked_ticket = Ticket.objects.select_for_update().get(pk=ticket.pk)
    user.__class__.objects.select_for_update().get(pk=user.pk)
    if locked_ticket.status in {
        Ticket.Status.COMPLETED,
        Ticket.Status.CLOSED,
    }:
        raise ValueError("Completed or closed Tickets cannot start a timer.")
    if TicketTimeEntry.objects.filter(
        ticket=locked_ticket,
        status=TicketTimeEntry.Status.PROGRESSING,
    ).exists():
        raise ValueError("This Ticket already has an active timer.")
    active_for_user = TicketTimeEntry.objects.filter(
        user=user,
        status=TicketTimeEntry.Status.PROGRESSING,
    ).select_related("ticket").first()
    if active_for_user:
        raise ValueError(
            f"You already have a running timer on "
            f"{active_for_user.ticket.reference}."
        )
    ProjectMember.objects.get_or_create(
        project=locked_ticket.project,
        user=user,
        defaults={"added_by": user},
    )
    entry = TicketTimeEntry.objects.create(
        ticket=locked_ticket,
        user=user,
    )
    if locked_ticket.status != Ticket.Status.IN_PROGRESS:
        locked_ticket.status = Ticket.Status.IN_PROGRESS
        locked_ticket.save(update_fields=("status", "updated_at"))
    return entry


@transaction.atomic
def heartbeat_ticket_timer(*, entry):
    from django.utils import timezone

    locked_entry = TicketTimeEntry.objects.select_for_update().get(
        pk=entry.pk
    )
    if locked_entry.status != TicketTimeEntry.Status.PROGRESSING:
        return locked_entry
    now = timezone.now()
    locked_entry.last_heartbeat_at = now
    locked_entry.progress_seconds = max(
        locked_entry.progress_seconds,
        int((now - locked_entry.started_at).total_seconds()),
    )
    locked_entry.save(
        update_fields=(
            "last_heartbeat_at",
            "progress_seconds",
            "updated_at",
        )
    )
    return locked_entry


@transaction.atomic
def stop_ticket_timer(*, entry):
    from django.utils import timezone

    locked_entry = TicketTimeEntry.objects.select_for_update().get(
        pk=entry.pk
    )
    if locked_entry.status == TicketTimeEntry.Status.COMPLETED:
        return locked_entry
    stopped_at = timezone.now()
    locked_entry.stopped_at = stopped_at
    locked_entry.last_heartbeat_at = stopped_at
    locked_entry.status = TicketTimeEntry.Status.COMPLETED
    locked_entry.duration_seconds = max(
        0,
        int((stopped_at - locked_entry.started_at).total_seconds()),
    )
    locked_entry.progress_seconds = locked_entry.duration_seconds
    locked_entry.save(
        update_fields=(
            "stopped_at",
            "last_heartbeat_at",
            "status",
            "progress_seconds",
            "duration_seconds",
            "updated_at",
        )
    )
    return locked_entry
