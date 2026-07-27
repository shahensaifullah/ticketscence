from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from django.conf import settings
from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import Workspace, WorkspaceMember
from projects.models import Project
from tickets.models import Ticket
from topics.models import Topic, TopicMention
from topics.services import topic_embedding_fingerprint
from topics.tasks import embed_topic


@override_settings(TOPIC_EMBEDDING_ENABLED=False)
class TopicTicketApiTests(APITestCase):
    def setUp(self):
        self.organization = Workspace.objects.create(name="Acme")
        self.owner = self.add_member(
            "owner@example.com",
            WorkspaceRole.OWNER,
        )
        self.admin = self.add_member(
            "admin@example.com",
            WorkspaceRole.ADMIN,
        )
        self.member = self.add_member(
            "member@example.com",
            WorkspaceRole.MEMBER,
        )
        self.guest = self.add_member(
            "guest@example.com",
            WorkspaceRole.GUEST,
        )
        self.project = Project.objects.create(
            organization=self.organization,
            name="Checkout",
            key="PAY",
            created_by=self.owner,
        )

    def add_member(self, email, role):
        user = User.objects.create_user(
            email=email,
            password="Strong-pass-123!",
        )
        WorkspaceMember.objects.create(
            workspace=self.organization,
            user=user,
            role=role,
        )
        return user

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def topics_url(self):
        return f"/api/workspaces/{self.organization.slug}/topics/"

    def create_topic(self):
        self.authenticate(self.member)
        response = self.client.post(
            self.topics_url(),
            {
                "title": "Checkout intermittently fails",
                "description": "The team needs to understand gateway errors.",
                "topic_type": "bug",
                "priority": "high",
                "project_uid": str(self.project.uid),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return Topic.objects.get(uid=response.data["uid"])

    def ticket_payload(self, title="Investigate gateway failures"):
        return {
            "title": title,
            "description": f"Work required for: {title}.",
            "priority": "high",
            "project_uid": str(self.project.uid),
        }

    def test_member_can_comment_reply_and_mention_organization_member(self):
        topic = self.create_topic()
        comment_url = f"{self.topics_url()}{topic.uid}/comments"

        comment_response = self.client.post(
            comment_url,
            {
                "body": f"Can @{self.admin.email} inspect the gateway?",
            },
            format="json",
        )
        reply_response = self.client.post(
            comment_url,
            {
                "body": "I can reproduce this.",
                "parent_uid": comment_response.data["uid"],
            },
            format="json",
        )

        self.assertEqual(
            comment_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            reply_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertTrue(
            TopicMention.objects.filter(
                topic=topic,
                mentioned_user=self.admin,
            ).exists()
        )

    @override_settings(
        TOPIC_EMBEDDING_ENABLED=True,
        TOPIC_SIMILARITY_THRESHOLD=0.62,
    )
    @patch("topics.tasks.embed_topic.delay")
    @patch("topics.services.create_embeddings")
    def test_similar_topic_suggestions_are_organization_scoped(
        self,
        create_embeddings_mock,
        embed_topic_delay_mock,
    ):
        vector = [1.0] + [0.0] * 383
        create_embeddings_mock.return_value = [vector]
        with self.captureOnCommitCallbacks(execute=True):
            topic = self.create_topic()
        matching_topic = Topic.objects.create(
            organization=self.organization,
            project=self.project,
            title="Checkout gateway timeout",
            description="Payment checkout fails when the gateway times out.",
            topic_type=Topic.Type.BUG,
            created_by=self.admin,
        )
        other_organization = Workspace.objects.create(name="Other company")
        other_project = Project.objects.create(
            organization=other_organization,
            name="Other",
            key="OTHER",
            created_by=self.admin,
        )
        other_topic = Topic.objects.create(
            organization=other_organization,
            project=other_project,
            title="Checkout gateway timeout in another company",
            description="This must never be suggested to Acme.",
            topic_type=Topic.Type.BUG,
            created_by=self.admin,
        )
        Topic.objects.filter(pk=matching_topic.pk).update(
            embedding=vector,
            embedding_model=settings.TOPIC_EMBEDDING_MODEL,
        )
        Topic.objects.filter(pk=other_topic.pk).update(
            embedding=vector,
            embedding_model=settings.TOPIC_EMBEDDING_MODEL,
        )

        response = self.client.post(
            f"{self.topics_url()}suggestions",
            {
                "title": "Checkout gateway is failing",
                "description": "Customers see gateway timeout errors.",
                "exclude_uid": str(topic.uid),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {suggestion["title"] for suggestion in response.data}
        self.assertIn("Checkout gateway timeout", titles)
        self.assertNotIn(
            "Checkout gateway timeout in another company",
            titles,
        )
        embed_topic_delay_mock.assert_called_once()

    def test_topic_requires_a_project(self):
        self.authenticate(self.member)

        response = self.client.post(
            self.topics_url(),
            {
                "title": "Missing project",
                "description": "This Topic must be rejected.",
                "topic_type": "bug",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("project_uid", response.data)

    def test_admin_can_create_multiple_tickets_from_one_topic(self):
        topic = self.create_topic()
        self.authenticate(self.admin)
        url = f"{self.topics_url()}{topic.uid}/tickets"

        first = self.client.post(
            url,
            self.ticket_payload(),
            format="json",
        )
        second = self.client.post(
            url,
            self.ticket_payload("Add gateway timeout telemetry"),
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Ticket.objects.filter(origin_topic=topic).count(),
            2,
        )
        self.assertNotEqual(first.data["uid"], second.data["uid"])

    @patch("topics.services.create_embeddings")
    def test_embedding_task_is_idempotent_and_stores_source_hash(
        self,
        create_embeddings_mock,
    ):
        topic = self.create_topic()
        vector = [1.0] + [0.0] * 383
        create_embeddings_mock.return_value = [vector]
        fingerprint = topic_embedding_fingerprint(
            title=topic.title,
            description=topic.description,
        )

        first = embed_topic.run(str(topic.uid), fingerprint)
        second = embed_topic.run(str(topic.uid), fingerprint)

        topic.refresh_from_db()
        self.assertEqual(first, "embedded")
        self.assertEqual(second, "current")
        self.assertEqual(topic.embedding_source_hash, fingerprint)
        create_embeddings_mock.assert_called_once()

    def test_ticket_from_topic_requires_its_own_details(self):
        topic = self.create_topic()
        self.authenticate(self.admin)

        response = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)
        self.assertIn("description", response.data)
        self.assertIn("priority", response.data)

    def test_member_cannot_create_ticket_from_topic(self):
        topic = self.create_topic()

        response = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_deletes_topic_with_exact_title_and_preserves_ticket(self):
        topic = self.create_topic()
        self.authenticate(self.owner)
        ticket_response = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            self.ticket_payload(),
            format="json",
        )

        wrong_response = self.client.delete(
            f"{self.topics_url()}{topic.uid}",
            {"confirmation": "wrong name"},
            format="json",
        )
        delete_response = self.client.delete(
            f"{self.topics_url()}{topic.uid}",
            {"confirmation": topic.title},
            format="json",
        )

        self.assertEqual(
            ticket_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            wrong_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )
        ticket = Ticket.objects.get(uid=ticket_response.data["uid"])
        self.assertEqual(ticket.origin_topic_id, topic.id)
        self.assertFalse(Topic.objects.filter(pk=topic.pk).exists())
        self.assertTrue(Topic.all_objects.filter(pk=topic.pk).exists())

    def test_topic_resolves_when_all_related_tickets_are_terminal(self):
        topic = self.create_topic()
        self.authenticate(self.admin)
        create_url = f"{self.topics_url()}{topic.uid}/tickets"
        first = self.client.post(
            create_url,
            self.ticket_payload(),
            format="json",
        )
        second = self.client.post(
            create_url,
            self.ticket_payload("Add monitoring"),
            format="json",
        )
        ticket_base = (
            f"/api/workspaces/{self.organization.slug}/tickets"
        )

        self.client.patch(
            f"{ticket_base}/{first.data['reference']}",
            {"status": "completed"},
            format="json",
        )
        topic.refresh_from_db()
        self.assertEqual(
            topic.status,
            Topic.Status.CONVERTED_TO_TICKET,
        )

        self.client.patch(
            f"{ticket_base}/{second.data['reference']}",
            {"status": "closed"},
            format="json",
        )
        topic.refresh_from_db()
        self.assertEqual(topic.status, Topic.Status.RESOLVED)

    def test_ticket_can_be_assigned_directly_to_organization_member(self):
        topic = self.create_topic()
        self.authenticate(self.admin)
        created = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            self.ticket_payload(),
            format="json",
        )

        response = self.client.patch(
            (
                f"/api/workspaces/{self.organization.slug}/tickets/"
                f"{created.data['reference']}"
            ),
            {"assignee_uid": str(self.member.uid)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["assignee_uid"],
            str(self.member.uid),
        )
        ticket = Ticket.objects.get(uid=created.data["uid"])
        self.assertEqual(ticket.assignee, self.member)

    def test_admin_records_optional_solution_ticket_and_url(self):
        topic = self.create_topic()
        self.authenticate(self.admin)
        created = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            self.ticket_payload("Fix checkout retry handling"),
            format="json",
        )

        response = self.client.patch(
            f"{self.topics_url()}{topic.uid}",
            {
                "solution": "Retry only idempotent gateway requests.",
                "solution_url": "https://github.com/acme/app/pull/42",
                "solution_ticket_uid": created.data["uid"],
            },
            format="json",
        )
        detail = self.client.get(f"{self.topics_url()}{topic.uid}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(
            detail.data["solution"],
            "Retry only idempotent gateway requests.",
        )
        self.assertEqual(
            detail.data["solution_ticket"]["uid"],
            created.data["uid"],
        )

    def test_owner_deletes_ticket_with_exact_topic_title(self):
        topic = self.create_topic()
        self.authenticate(self.owner)
        created = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            self.ticket_payload(),
            format="json",
        )
        ticket_url = (
            f"/api/workspaces/{self.organization.slug}/tickets/"
            f"{created.data['reference']}"
        )

        wrong = self.client.delete(
            ticket_url,
            {"confirmation": "wrong name"},
            format="json",
        )
        deleted = self.client.delete(
            ticket_url,
            {"confirmation": topic.title},
            format="json",
        )

        self.assertEqual(wrong.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Ticket.objects.filter(uid=created.data["uid"]).exists()
        )
        self.assertTrue(
            Ticket.all_objects.filter(uid=created.data["uid"]).exists()
        )

    def test_member_cannot_delete_ticket(self):
        topic = self.create_topic()
        self.authenticate(self.admin)
        created = self.client.post(
            f"{self.topics_url()}{topic.uid}/tickets",
            self.ticket_payload(),
            format="json",
        )
        self.authenticate(self.member)

        response = self.client.delete(
            (
                f"/api/workspaces/{self.organization.slug}/tickets/"
                f"{created.data['reference']}"
            ),
            {"confirmation": topic.title},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_guest_is_read_only(self):
        topic = self.create_topic()
        self.authenticate(self.guest)

        list_response = self.client.get(self.topics_url())
        comment_response = self.client.post(
            f"{self.topics_url()}{topic.uid}/comments",
            {"body": "Blocked"},
            format="json",
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            comment_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_member_can_attach_file(self):
        topic = self.create_topic()
        file = SimpleUploadedFile(
            "error.log",
            b"gateway timeout",
            content_type="text/plain",
        )

        response = self.client.post(
            f"{self.topics_url()}{topic.uid}/attachments",
            {"file": file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
