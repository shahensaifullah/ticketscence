from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import models
from django.utils import timezone

from topics.models import Topic
from topics.services import (
    create_embeddings,
    LocalEmbeddingUnavailable,
    topic_embedding_text,
    topic_embedding_fingerprint,
)


class Command(BaseCommand):
    help = "Generate semantic-search embeddings for existing Topics."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Regenerate embeddings that already exist.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of Topics sent per embeddings request.",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        if not 1 <= batch_size <= 2048:
            raise CommandError("--batch-size must be between 1 and 2048.")
        queryset = Topic.objects.order_by("id")
        if not options["all"]:
            queryset = queryset.filter(
                models.Q(embedding__isnull=True)
                | ~models.Q(
                    embedding_model=settings.TOPIC_EMBEDDING_MODEL
                )
            )

        updated = 0
        last_id = 0
        while True:
            topics = list(queryset.filter(id__gt=last_id)[:batch_size])
            if not topics:
                break
            try:
                embeddings = create_embeddings(
                    [
                        topic_embedding_text(
                            title=topic.title,
                            description=topic.description,
                        )
                        for topic in topics
                    ]
                )
            except LocalEmbeddingUnavailable as error:
                raise CommandError(str(error)) from error

            now = timezone.now()
            for topic, embedding in zip(
                topics,
                embeddings,
                strict=True,
            ):
                topic.embedding = embedding
                topic.embedding_model = settings.TOPIC_EMBEDDING_MODEL
                topic.embedding_source_hash = topic_embedding_fingerprint(
                    title=topic.title,
                    description=topic.description,
                )
                topic.embedding_updated_at = now
            Topic.objects.bulk_update(
                topics,
                (
                    "embedding",
                    "embedding_model",
                    "embedding_source_hash",
                    "embedding_updated_at",
                ),
                batch_size=batch_size,
            )
            updated += len(topics)
            last_id = topics[-1].id
            self.stdout.write(f"Embedded {updated} Topics.")

        self.stdout.write(
            self.style.SUCCESS(f"Updated {updated} Topic embeddings.")
        )
