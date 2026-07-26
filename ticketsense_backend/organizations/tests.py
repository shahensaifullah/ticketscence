from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import Workspace, WorkspaceMember


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://localhost:3000",
)
class WorkspaceApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="Strong-pass-123!",
            first_name="Ada",
            last_name="Admin",
        )
        self.manager = User.objects.create_user(
            email="manager@example.com",
            password="Strong-pass-123!",
            first_name="Manny",
            last_name="Manager",
        )
        self.developer = User.objects.create_user(
            email="developer@example.com",
            password="Strong-pass-123!",
            first_name="Dev",
            last_name="User",
        )
        self.workspace = Workspace.objects.create(name="Acme")
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.admin,
            role=WorkspaceRole.ADMIN,
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.manager,
            role=WorkspaceRole.MEMBER,
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.developer,
            role=WorkspaceRole.GUEST,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def member_url(self):
        return f"/api/workspaces/{self.workspace.slug}/members"

    def test_user_can_create_and_list_multiple_workspaces(self):
        self.authenticate(self.admin)

        response = self.client.post(
            "/api/workspaces/",
            {"name": "Northstar Labs"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["role"], WorkspaceRole.OWNER)
        self.assertTrue(response.data["is_current"])

        response = self.client.get("/api/workspaces/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["workspace_count"], 2)
        self.assertEqual(len(response.data["workspaces"]), 2)
        self.assertEqual(
            sum(
                workspace["is_current"]
                for workspace in response.data["workspaces"]
            ),
            1,
        )

    def test_user_can_switch_current_workspace(self):
        second_workspace = Workspace.objects.create(name="Northstar")
        second_membership = WorkspaceMember.objects.create(
            workspace=second_workspace,
            user=self.admin,
            role=WorkspaceRole.MEMBER,
        )
        self.authenticate(self.admin)

        response = self.client.post(
            f"/api/workspaces/{second_workspace.slug}/activate"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_current"])
        second_membership.refresh_from_db()
        self.assertTrue(second_membership.is_current)
        self.assertEqual(
            WorkspaceMember.objects.filter(
                user=self.admin,
                is_current=True,
            ).count(),
            1,
        )

    def test_list_assigns_a_current_workspace_when_missing(self):
        self.authenticate(self.developer)

        response = self.client.get("/api/workspaces/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            sum(
                workspace["is_current"]
                for workspace in response.data["workspaces"]
            ),
            1,
        )

    def test_dashboard_is_scoped_to_user_membership(self):
        other_workspace = Workspace.objects.create(name="Private")
        self.authenticate(self.developer)

        response = self.client.get(
            f"/api/workspaces/{other_workspace.slug}/dashboard"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_create_member_and_send_credentials_email(self):
        self.authenticate(self.admin)

        response = self.client.post(
            self.member_url(),
            {
                "first_name": "New",
                "last_name": "Member",
                "email": "new@example.com",
                "password": "Strong-pass-123!",
                "role": WorkspaceRole.MEMBER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["created_user"])
        self.assertTrue(response.data["email_sent"])
        self.assertTrue(
            WorkspaceMember.objects.filter(
                workspace=self.workspace,
                user__email="new@example.com",
                role=WorkspaceRole.MEMBER,
            ).exists()
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Temporary password", mail.outbox[0].body)

    def test_existing_user_is_linked_without_password_change(self):
        existing = User.objects.create_user(
            email="existing@example.com",
            password="Existing-pass-123!",
        )
        self.authenticate(self.admin)

        response = self.client.post(
            self.member_url(),
            {
                "first_name": "Ignored",
                "last_name": "Name",
                "email": existing.email,
                "password": "Different-pass-123!",
                "role": WorkspaceRole.GUEST,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        existing.refresh_from_db()
        self.assertTrue(existing.check_password("Existing-pass-123!"))
        self.assertFalse(response.data["created_user"])
        self.assertIn("existing TicketSense password", mail.outbox[0].body)

    def test_member_cannot_add_members(self):
        self.authenticate(self.manager)

        response = self.client.post(
            self.member_url(),
            {
                "first_name": "Another",
                "last_name": "Admin",
                "email": "another-admin@example.com",
                "password": "Strong-pass-123!",
                "role": WorkspaceRole.ADMIN,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_guest_cannot_add_members(self):
        self.authenticate(self.developer)

        response = self.client.post(
            self.member_url(),
            {
                "first_name": "Blocked",
                "last_name": "Member",
                "email": "blocked@example.com",
                "password": "Strong-pass-123!",
                "role": WorkspaceRole.MEMBER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_update_workspace_name(self):
        owner = User.objects.create_user(
            email="owner@example.com",
            password="Strong-pass-123!",
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=owner,
            role=WorkspaceRole.OWNER,
        )
        self.authenticate(owner)

        response = self.client.patch(
            f"/api/workspaces/{self.workspace.slug}",
            {"name": "Acme AI"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.workspace.refresh_from_db()
        self.assertEqual(self.workspace.name, "Acme AI")

    def test_non_owner_cannot_update_or_delete_workspace(self):
        self.authenticate(self.admin)
        url = f"/api/workspaces/{self.workspace.slug}"

        update_response = self.client.patch(
            url,
            {"name": "Blocked rename"},
            format="json",
        )
        delete_response = self.client.delete(url)

        self.assertEqual(
            update_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            delete_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_owner_can_soft_delete_workspace(self):
        owner = User.objects.create_user(
            email="deleting-owner@example.com",
            password="Strong-pass-123!",
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=owner,
            role=WorkspaceRole.OWNER,
            is_current=True,
        )
        self.authenticate(owner)

        response = self.client.delete(
            f"/api/workspaces/{self.workspace.slug}"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Workspace.objects.filter(pk=self.workspace.pk).exists()
        )
        self.assertTrue(
            Workspace.all_objects.filter(pk=self.workspace.pk).exists()
        )
        replacement = WorkspaceMember.objects.get(
            user=owner,
            is_current=True,
        )
        self.assertEqual(replacement.role, WorkspaceRole.OWNER)
        self.assertNotEqual(replacement.workspace_id, self.workspace.pk)

    def test_owner_role_cannot_be_assigned_to_member(self):
        self.authenticate(self.admin)

        response = self.client.post(
            self.member_url(),
            {
                "first_name": "Another",
                "last_name": "Owner",
                "email": "another-owner@example.com",
                "password": "Strong-pass-123!",
                "role": WorkspaceRole.OWNER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)
