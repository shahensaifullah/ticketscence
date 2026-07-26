from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import WorkspaceMember


class UserManagerTests(TestCase):
    def test_create_user_hashes_password(self):
        user = User.objects.create_user(
            email="person@example.com",
            password="test-password",
            first_name="Test",
            last_name="Person",
        )

        self.assertEqual(user.email, "person@example.com")
        self.assertTrue(user.check_password("test-password"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_superuser_sets_required_flags(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="test-password",
            first_name="Test",
            last_name="Admin",
        )

        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_delete_soft_deletes_user_by_default(self):
        user = User.objects.create_user(
            email="person@example.com",
            password="test-password",
        )

        user.delete()

        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        deleted_user = User.all_objects.get(pk=user.pk)
        self.assertTrue(deleted_user.is_deleted)

    def test_queryset_delete_soft_deletes_users(self):
        user = User.objects.create_user(
            email="person@example.com",
            password="test-password",
        )

        User.objects.filter(pk=user.pk).delete()

        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertTrue(User.all_objects.filter(pk=user.pk).exists())

    def test_hard_delete_removes_user(self):
        user = User.objects.create_user(
            email="person@example.com",
            password="test-password",
        )
        user_id = user.pk

        user.hard_delete()

        self.assertFalse(User.all_objects.filter(pk=user_id).exists())


class RegistrationWorkspaceTests(APITestCase):
    def test_registration_creates_named_current_workspace(self):
        response = self.client.post(
            "/api/auth/register",
            {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "workspace_name": "Analytical Engines",
                "email": "ada@example.com",
                "password": "Strong-pass-123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        membership = WorkspaceMember.objects.select_related(
            "workspace"
        ).get(user__email="ada@example.com")
        self.assertEqual(membership.workspace.name, "Analytical Engines")
        self.assertEqual(membership.role, WorkspaceRole.OWNER)
        self.assertTrue(membership.is_current)

    def test_registration_without_name_creates_personal_workspace(self):
        response = self.client.post(
            "/api/auth/register",
            {
                "first_name": "Grace",
                "last_name": "Hopper",
                "workspace_name": "",
                "email": "grace@example.com",
                "password": "Strong-pass-123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        membership = WorkspaceMember.objects.select_related(
            "workspace"
        ).get(user__email="grace@example.com")
        self.assertEqual(membership.workspace.name, "Personal Workspace")
        self.assertEqual(membership.role, WorkspaceRole.OWNER)
        self.assertTrue(membership.is_current)

    def test_login_repairs_legacy_user_without_workspace(self):
        user = User.objects.create_user(
            email="legacy@example.com",
            password="Strong-pass-123!",
        )

        response = self.client.post(
            "/api/auth/login",
            {
                "email": user.email,
                "password": "Strong-pass-123!",
                "remember": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        membership = WorkspaceMember.objects.select_related(
            "workspace"
        ).get(user=user)
        self.assertEqual(membership.workspace.name, "Personal Workspace")
        self.assertEqual(membership.role, WorkspaceRole.OWNER)
        self.assertTrue(membership.is_current)
