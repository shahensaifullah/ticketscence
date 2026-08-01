from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from accounts.choices import WorkspaceRole
from organizations.models import Workspace, WorkspaceMember
from projects.models import Project, ProjectMember
from tickets.models import Ticket, TicketExternalLink, TicketTimeEntry
from topics.models import Topic, TopicActivity, TopicComment, TopicMention


User = get_user_model()


class Command(BaseCommand):
    help = "Create a repeatable Project -> Topic -> Ticket demo workflow."

    DEMO_PASSWORD = "Demo123!"
    WORKSPACE_NAME = "TicketSense Demo"
    PROJECT_KEY = "PORTAL"

    USERS = (
        {
            "email": "owner@demo.ticketsense.local",
            "first_name": "Olivia",
            "last_name": "Owner",
            "role": WorkspaceRole.OWNER,
        },
        {
            "email": "product@demo.ticketsense.local",
            "first_name": "Priya",
            "last_name": "Product",
            "role": WorkspaceRole.ADMIN,
        },
        {
            "email": "developer@demo.ticketsense.local",
            "first_name": "Daniel",
            "last_name": "Developer",
            "role": WorkspaceRole.MEMBER,
        },
        {
            "email": "qa@demo.ticketsense.local",
            "first_name": "Quinn",
            "last_name": "QA",
            "role": WorkspaceRole.MEMBER,
        },
    )

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.localdate()
        now = timezone.now()

        workspace, _ = Workspace.objects.update_or_create(
            name=self.WORKSPACE_NAME,
            defaults={"is_active": True},
        )
        users = self._seed_users(workspace)
        owner = users["owner@demo.ticketsense.local"]
        product = users["product@demo.ticketsense.local"]
        developer = users["developer@demo.ticketsense.local"]
        qa = users["qa@demo.ticketsense.local"]

        project, _ = Project.objects.update_or_create(
            organization=workspace,
            key=self.PROJECT_KEY,
            defaults={
                "name": "Customer Portal Refresh",
                "description": (
                    "Improve the self-service support portal from discovery "
                    "through delivery, with measurable ticket progress."
                ),
                "status": Project.Status.IN_PROGRESS,
                "priority": Project.Priority.HIGH,
                "lead": product,
                "created_by": owner,
                "start_date": today - timedelta(days=21),
                "target_date": today + timedelta(days=35),
                "color": "#2563EB",
                "is_active": True,
            },
        )
        for user in users.values():
            ProjectMember.objects.update_or_create(
                project=project,
                user=user,
                defaults={"added_by": owner, "deleted_at": None},
            )

        topics = self._seed_topics(
            workspace=workspace,
            project=project,
            owner=owner,
            product=product,
            developer=developer,
            qa=qa,
            now=now,
        )
        tickets = self._seed_tickets(
            workspace=workspace,
            project=project,
            topic=topics["delivery"],
            resolved_topic=topics["resolved"],
            owner=owner,
            product=product,
            developer=developer,
            qa=qa,
            today=today,
            now=now,
        )

        resolved_topic = topics["resolved"]
        resolved_topic.solution = (
            "Generate one idempotency key per order and reuse it for all "
            "confirmation retries."
        )
        resolved_topic.solution_url = (
            "https://docs.example.com/customer-portal/idempotent-confirmations"
        )
        resolved_topic.solution_ticket = tickets["email_fix"]
        resolved_topic.status = Topic.Status.RESOLVED
        resolved_topic.save(
            update_fields=(
                "solution",
                "solution_url",
                "solution_ticket",
                "status",
                "updated_at",
            )
        )
        self._activity(
            resolved_topic,
            product,
            TopicActivity.Event.SOLUTION_UPDATED,
            "Documented the verified solution and linked the completed Ticket.",
        )

        self.stdout.write(self.style.SUCCESS("Demo workflow is ready."))
        self.stdout.write(f"Workspace: {workspace.name} ({workspace.slug})")
        self.stdout.write(f"Project: {project.key} - {project.name}")
        self.stdout.write(
            f"Data: {len(topics)} topics, {len(tickets)} tickets"
        )
        self.stdout.write("Login: owner@demo.ticketsense.local")
        self.stdout.write(f"Password: {self.DEMO_PASSWORD}")
        self.stdout.write(
            "The owner account has a running timer on "
            f"{tickets['frontend'].reference}."
        )

    def _seed_users(self, workspace):
        users = {}
        for spec in self.USERS:
            email = spec["email"]
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    "first_name": spec["first_name"],
                    "last_name": spec["last_name"],
                    "is_active": True,
                    "is_email_verified": True,
                },
            )
            user.set_password(self.DEMO_PASSWORD)
            user.save(update_fields=("password", "updated_at"))
            WorkspaceMember.objects.update_or_create(
                workspace=workspace,
                user=user,
                defaults={
                    "role": spec["role"],
                    "is_active": True,
                    "is_current": spec["role"] == WorkspaceRole.OWNER,
                    "deleted_at": None,
                },
            )
            users[email] = user
        return users

    def _seed_topics(
        self,
        *,
        workspace,
        project,
        owner,
        product,
        developer,
        qa,
        now,
    ):
        definitions = {
            "idea": {
                "title": "Let customers follow support requests from mobile",
                "description": (
                    "Customers want a simple mobile view of request status, "
                    "owner, and latest response. Validate demand before planning."
                ),
                "topic_type": Topic.Type.FEATURE,
                "status": Topic.Status.OPEN,
                "priority": Topic.Priority.MEDIUM,
                "created_by": product,
                "is_pinned": False,
            },
            "review": {
                "title": "Intermittent errors when uploading large attachments",
                "description": (
                    "Uploads above 20 MB sometimes fail without a useful error. "
                    "The team needs logs and reproduction steps before deciding."
                ),
                "topic_type": Topic.Type.BUG,
                "status": Topic.Status.UNDER_REVIEW,
                "priority": Topic.Priority.HIGH,
                "created_by": qa,
                "is_pinned": False,
            },
            "delivery": {
                "title": "Reduce checkout abandonment on the support-plan flow",
                "description": (
                    "Analytics show customers leaving the mobile checkout before "
                    "confirmation. Break the agreed solution into deliverable work."
                ),
                "topic_type": Topic.Type.IMPROVEMENT,
                "status": Topic.Status.CONVERTED_TO_TICKET,
                "priority": Topic.Priority.CRITICAL,
                "created_by": product,
                "is_pinned": True,
            },
            "resolved": {
                "title": "Duplicate confirmation emails after payment retries",
                "description": (
                    "Some customers receive two confirmation emails when the "
                    "payment callback is retried."
                ),
                "topic_type": Topic.Type.BUG,
                "status": Topic.Status.RESOLVED,
                "priority": Topic.Priority.HIGH,
                "created_by": qa,
                "is_pinned": False,
            },
        }
        topics = {}
        for key, definition in definitions.items():
            topic, _ = Topic.objects.update_or_create(
                organization=workspace,
                project=project,
                title=definition["title"],
                defaults={
                    **definition,
                    "last_activity_at": now,
                    "deleted_at": None,
                },
            )
            topics[key] = topic
            self._activity(
                topic,
                definition["created_by"],
                TopicActivity.Event.CREATED,
                "Created the Topic for team discussion.",
            )

        review_comment, _ = TopicComment.objects.get_or_create(
            topic=topics["review"],
            author=qa,
            body=(
                "I reproduced this with a 28 MB video on a throttled connection. "
                "@developer@demo.ticketsense.local can you inspect the timeout?"
            ),
        )
        TopicMention.objects.get_or_create(
            topic=topics["review"],
            comment=review_comment,
            mentioned_user=developer,
            defaults={"mentioned_by": qa},
        )
        TopicComment.objects.get_or_create(
            topic=topics["review"],
            author=developer,
            parent=review_comment,
            body=(
                "The API gateway closes the connection at 30 seconds. I am "
                "checking direct-to-storage uploads before we create a Ticket."
            ),
        )
        self._activity(
            topics["review"],
            developer,
            TopicActivity.Event.COMMENTED,
            "Added investigation findings in a threaded reply.",
        )

        TopicComment.objects.get_or_create(
            topic=topics["delivery"],
            author=product,
            body=(
                "Agreed scope: simplify the form, preserve checkout state, add "
                "payment telemetry, and verify the flow on mobile."
            ),
        )
        TopicComment.objects.get_or_create(
            topic=topics["delivery"],
            author=owner,
            body="Approved. Please split this into independently shippable Tickets.",
        )
        self._activity(
            topics["delivery"],
            owner,
            TopicActivity.Event.STATUS_CHANGED,
            "Approved the proposal and moved it into delivery.",
        )
        return topics

    def _seed_tickets(
        self,
        *,
        workspace,
        project,
        topic,
        resolved_topic,
        owner,
        product,
        developer,
        qa,
        today,
        now,
    ):
        definitions = {
            "research": {
                "title": "Map mobile checkout drop-off points",
                "description": "Review funnel analytics and document the top exits.",
                "origin_topic": topic,
                "status": Ticket.Status.COMPLETED,
                "priority": Ticket.Priority.HIGH,
                "estimated_minutes": 240,
                "due_date": today - timedelta(days=12),
                "assignee": product,
            },
            "api": {
                "title": "Persist checkout state across payment retries",
                "description": (
                    "Store resumable checkout state and return a safe retry token."
                ),
                "origin_topic": topic,
                "status": Ticket.Status.IN_REVIEW,
                "priority": Ticket.Priority.CRITICAL,
                "estimated_minutes": 720,
                "due_date": today + timedelta(days=3),
                "assignee": developer,
            },
            "frontend": {
                "title": "Build the simplified mobile checkout form",
                "description": (
                    "Implement the approved two-step checkout and validation states."
                ),
                "origin_topic": topic,
                "status": Ticket.Status.IN_PROGRESS,
                "priority": Ticket.Priority.HIGH,
                "estimated_minutes": 600,
                "due_date": today + timedelta(days=7),
                "assignee": owner,
            },
            "qa": {
                "title": "Run mobile checkout regression suite",
                "description": "Verify retries, validation, and confirmation flows.",
                "origin_topic": topic,
                "status": Ticket.Status.OPEN,
                "priority": Ticket.Priority.HIGH,
                "estimated_minutes": 300,
                "due_date": today + timedelta(days=12),
                "assignee": qa,
            },
            "telemetry": {
                "title": "Add checkout funnel telemetry dashboard",
                "description": "Track step completion, retry rate, and abandonment.",
                "origin_topic": topic,
                "status": Ticket.Status.BACKLOG,
                "priority": Ticket.Priority.MEDIUM,
                "estimated_minutes": 360,
                "due_date": today + timedelta(days=20),
                "assignee": None,
            },
            "email_fix": {
                "title": "Make confirmation delivery idempotent",
                "description": "Deduplicate confirmation jobs by order id.",
                "origin_topic": resolved_topic,
                "status": Ticket.Status.COMPLETED,
                "priority": Ticket.Priority.HIGH,
                "estimated_minutes": 360,
                "due_date": today - timedelta(days=5),
                "assignee": developer,
            },
            "email_verify": {
                "title": "Verify confirmation retries in production",
                "description": "Confirm one message is sent across callback retries.",
                "origin_topic": resolved_topic,
                "status": Ticket.Status.CLOSED,
                "priority": Ticket.Priority.MEDIUM,
                "estimated_minutes": 120,
                "due_date": today - timedelta(days=3),
                "assignee": qa,
            },
        }
        tickets = {}
        for key, definition in definitions.items():
            ticket = Ticket.objects.filter(
                organization=workspace,
                title=definition["title"],
            ).first()
            if ticket is None:
                last_number = (
                    Ticket.all_objects.filter(organization=workspace)
                    .aggregate(max_number=Max("number"))["max_number"]
                    or 0
                )
                ticket = Ticket.objects.create(
                    organization=workspace,
                    project=project,
                    number=last_number + 1,
                    created_by=owner,
                    title=definition["title"],
                    description=definition["description"],
                )
            for field, value in definition.items():
                setattr(ticket, field, value)
            ticket.project = project
            ticket.created_by = owner
            ticket.deleted_at = None
            ticket.save()
            tickets[key] = ticket
            self._activity(
                definition["origin_topic"],
                owner,
                TopicActivity.Event.TICKET_CREATED,
                f"Created ticket {ticket.reference}: {ticket.title}.",
            )

        TicketExternalLink.objects.update_or_create(
            ticket=tickets["api"],
            provider=TicketExternalLink.Provider.GITHUB_PR,
            defaults={
                "url": "https://github.com/example/ticketsense/pull/42",
                "label": "Retry-state implementation",
                "added_by": developer,
            },
        )

        self._completed_time(
            tickets["research"], product, now - timedelta(days=13), 10_800
        )
        self._completed_time(
            tickets["api"], developer, now - timedelta(days=2), 14_400
        )
        self._completed_time(
            tickets["email_fix"], developer, now - timedelta(days=7), 18_000
        )
        self._completed_time(
            tickets["email_verify"], qa, now - timedelta(days=4), 5_400
        )

        active = TicketTimeEntry.objects.filter(
            user=owner,
            status=TicketTimeEntry.Status.PROGRESSING,
        ).first()
        if active and active.ticket_id != tickets["frontend"].id:
            active.status = TicketTimeEntry.Status.COMPLETED
            active.stopped_at = now
            active.duration_seconds = active.elapsed_seconds
            active.progress_seconds = active.duration_seconds
            active.last_heartbeat_at = now
            active.save()
        TicketTimeEntry.objects.update_or_create(
            ticket=tickets["frontend"],
            user=owner,
            status=TicketTimeEntry.Status.PROGRESSING,
            defaults={
                "started_at": now - timedelta(minutes=37),
                "stopped_at": None,
                "last_heartbeat_at": now,
                "progress_seconds": 2_220,
                "duration_seconds": 0,
                "deleted_at": None,
            },
        )
        return tickets

    def _completed_time(self, ticket, user, started_at, duration_seconds):
        stopped_at = started_at + timedelta(seconds=duration_seconds)
        TicketTimeEntry.objects.update_or_create(
            ticket=ticket,
            user=user,
            status=TicketTimeEntry.Status.COMPLETED,
            duration_seconds=duration_seconds,
            defaults={
                "started_at": started_at,
                "stopped_at": stopped_at,
                "last_heartbeat_at": stopped_at,
                "progress_seconds": duration_seconds,
                "deleted_at": None,
            },
        )

    def _activity(self, topic, actor, event, description):
        TopicActivity.objects.get_or_create(
            topic=topic,
            event=event,
            description=description,
            defaults={"actor": actor},
        )
