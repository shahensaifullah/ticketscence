from io import StringIO

from django.core.management import call_command
from django.test import TestCase, override_settings

from accounts.models import User
from organizations.models import Workspace, WorkspaceMember
from projects.models import Project, ProjectMember
from tickets.models import Ticket, TicketExternalLink, TicketTimeEntry
from topics.models import Topic, TopicComment, TopicMention


@override_settings(TOPIC_EMBEDDING_ENABLED=False)
class CreateDemoDataCommandTests(TestCase):
    def test_command_creates_complete_repeatable_workflow(self):
        output = StringIO()

        call_command("create_demo_data", stdout=output)
        call_command("create_demo_data", stdout=output)

        workspace = Workspace.objects.get(name="TicketSense Demo")
        project = Project.objects.get(
            organization=workspace,
            key="PORTAL",
        )
        owner = User.objects.get(email="owner@demo.ticketsense.local")

        self.assertTrue(owner.check_password("Demo123!"))
        self.assertEqual(
            WorkspaceMember.objects.filter(workspace=workspace).count(),
            4,
        )
        self.assertEqual(
            WorkspaceMember.objects.get(
                workspace=workspace,
                user=owner,
            ).role,
            "owner",
        )
        self.assertEqual(
            ProjectMember.objects.filter(project=project).count(),
            4,
        )
        self.assertEqual(Topic.objects.filter(project=project).count(), 4)
        self.assertEqual(Ticket.objects.filter(project=project).count(), 7)
        self.assertEqual(
            set(
                Ticket.objects.filter(project=project).values_list(
                    "status",
                    flat=True,
                )
            ),
            {
                "backlog",
                "open",
                "in_progress",
                "in_review",
                "completed",
                "closed",
            },
        )
        self.assertEqual(
            TopicComment.objects.filter(topic__project=project).count(),
            4,
        )
        self.assertEqual(
            TopicMention.objects.filter(topic__project=project).count(),
            1,
        )
        self.assertEqual(TicketExternalLink.objects.count(), 1)
        self.assertEqual(TicketTimeEntry.objects.count(), 5)
        self.assertEqual(
            TicketTimeEntry.objects.filter(status="progressing").count(),
            1,
        )
        resolved = Topic.objects.get(
            project=project,
            title="Duplicate confirmation emails after payment retries",
        )
        self.assertEqual(resolved.status, "resolved")
        self.assertIsNotNone(resolved.solution_ticket)
        self.assertIn("Demo workflow is ready.", output.getvalue())
