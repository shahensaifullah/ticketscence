from django.test import TestCase

from accounts.models import User


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
