from django.db import transaction
from django.db.models import Max

from organizations.models import Workspace
from tickets.models import Ticket


@transaction.atomic
def create_ticket(
    *,
    organization,
    created_by,
    title,
    description,
    priority=None,
    project=None,
    origin_topic=None,
):
    Workspace.objects.select_for_update().get(pk=organization.pk)
    if project and project.organization_id != organization.id:
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
    for field, value in validated_data.items():
        setattr(ticket, field, value)
    ticket.save()

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
