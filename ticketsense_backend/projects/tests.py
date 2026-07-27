from datetime import timedelta

from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import Workspace, WorkspaceMember
from projects.models import Project, ProjectMember
from tickets.models import TicketTimeEntry
from tickets.services import create_ticket


@override_settings(TOPIC_EMBEDDING_ENABLED=False)
class ProjectTimerApiTests(APITestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(name="Acme")
        self.owner = self.add_member(
            "owner@example.com",
            WorkspaceRole.OWNER,
        )
        self.member = self.add_member(
            "member@example.com",
            WorkspaceRole.MEMBER,
        )
        self.guest = self.add_member(
            "guest@example.com",
            WorkspaceRole.GUEST,
        )

    def add_member(self, email, role):
        user = User.objects.create_user(
            email=email,
            password="Strong-pass-123!",
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=user,
            role=role,
        )
        return user

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def projects_url(self):
        return f"/api/workspaces/{self.workspace.slug}/projects/"

    def create_project(self):
        self.authenticate(self.owner)
        response = self.client.post(
            self.projects_url(),
            {
                "name": "Checkout Platform",
                "key": "pay",
                "description": "Payment and checkout delivery.",
                "status": "in_progress",
                "priority": "high",
                "lead_uid": str(self.member.uid),
                "member_user_uids": [str(self.member.uid)],
                "start_date": "2026-07-01",
                "target_date": "2026-09-30",
                "color": "#3366AA",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return Project.objects.get(uid=response.data["uid"])

    def test_owner_creates_workspace_project_with_members(self):
        project = self.create_project()

        detail = self.client.get(f"{self.projects_url()}{project.key}")

        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["key"], "PAY")
        self.assertEqual(detail.data["lead_uid"], str(self.member.uid))
        self.assertEqual(detail.data["created_by_uid"], str(self.owner.uid))
        self.assertEqual(detail.data["metrics"]["member_count"], 2)
        self.assertEqual(
            ProjectMember.objects.filter(project=project).count(),
            2,
        )

    def test_guest_cannot_create_project(self):
        self.authenticate(self.guest)

        response = self.client.post(
            self.projects_url(),
            {
                "name": "Blocked",
                "key": "BLOCK",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ticket_timer_supports_multiple_sessions_and_project_metrics(self):
        project = self.create_project()
        ticket = create_ticket(
            organization=self.workspace,
            project=project,
            created_by=self.owner,
            title="Retry checkout requests",
            description="Implement safe retry handling.",
            estimated_minutes=180,
        )
        self.authenticate(self.member)
        timer_base = (
            f"/api/workspaces/{self.workspace.slug}/tickets/"
            f"{ticket.reference}/timer"
        )

        started = self.client.post(f"{timer_base}/start")
        active = self.client.get(
            f"/api/workspaces/{self.workspace.slug}/tickets/timer/active"
        )
        first_entry = TicketTimeEntry.objects.get(ticket=ticket)
        self.assertEqual(
            first_entry.status,
            TicketTimeEntry.Status.PROGRESSING,
        )
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, ticket.Status.IN_PROGRESS)
        TicketTimeEntry.objects.filter(pk=first_entry.pk).update(
            started_at=timezone.now() - timedelta(minutes=5)
        )
        heartbeat = self.client.post(f"{timer_base}/heartbeat")
        first_entry.refresh_from_db()
        stopped = self.client.post(f"{timer_base}/stop")
        no_longer_active = self.client.get(
            f"/api/workspaces/{self.workspace.slug}/tickets/timer/active"
        )
        first_entry.refresh_from_db()
        second_started = self.client.post(f"{timer_base}/start")

        detail = self.client.get(f"{self.projects_url()}{project.key}")

        self.assertEqual(started.status_code, status.HTTP_200_OK)
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["reference"], ticket.reference)
        self.assertEqual(heartbeat.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(first_entry.progress_seconds, 300)
        self.assertEqual(stopped.status_code, status.HTTP_200_OK)
        self.assertIsNone(no_longer_active.data)
        self.assertEqual(
            first_entry.status,
            TicketTimeEntry.Status.COMPLETED,
        )
        self.assertIsNotNone(first_entry.stopped_at)
        self.assertEqual(second_started.status_code, status.HTTP_200_OK)
        self.assertEqual(
            TicketTimeEntry.objects.filter(ticket=ticket).count(),
            2,
        )
        self.assertEqual(detail.data["metrics"]["open_ticket_count"], 1)
        self.assertEqual(
            detail.data["metrics"]["remaining_estimated_minutes"],
            180,
        )
        self.assertGreaterEqual(
            detail.data["metrics"]["total_tracked_seconds"],
            300,
        )

    def test_user_can_only_run_one_ticket_timer(self):
        project = self.create_project()
        first = create_ticket(
            organization=self.workspace,
            project=project,
            created_by=self.owner,
            title="First",
            description="First task",
        )
        second = create_ticket(
            organization=self.workspace,
            project=project,
            created_by=self.owner,
            title="Second",
            description="Second task",
        )
        self.authenticate(self.member)
        ticket_base = f"/api/workspaces/{self.workspace.slug}/tickets"

        started = self.client.post(
            f"{ticket_base}/{first.reference}/timer/start"
        )
        blocked = self.client.post(
            f"{ticket_base}/{second.reference}/timer/start"
        )

        self.assertEqual(started.status_code, status.HTTP_200_OK)
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            TicketTimeEntry.objects.filter(
                user=self.member,
                status=TicketTimeEntry.Status.PROGRESSING,
            ).count(),
            1,
        )

    def test_board_can_filter_by_project(self):
        project = self.create_project()
        other = Project.objects.create(
            organization=self.workspace,
            created_by=self.owner,
            name="Other",
            key="OTHER",
        )
        create_ticket(
            organization=self.workspace,
            project=project,
            created_by=self.owner,
            title="Payment ticket",
            description="Payment work",
        )
        create_ticket(
            organization=self.workspace,
            project=other,
            created_by=self.owner,
            title="Other ticket",
            description="Other work",
        )

        response = self.client.get(
            (
                f"/api/workspaces/{self.workspace.slug}/tickets/"
                f"?project={project.uid}"
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["project_uid"], str(project.uid))

    def test_board_card_cannot_be_created_without_project(self):
        self.authenticate(self.member)

        response = self.client.post(
            f"/api/workspaces/{self.workspace.slug}/tickets/",
            {
                "title": "Unscoped work",
                "description": "This card has no Project.",
                "priority": "medium",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("project_uid", response.data)
