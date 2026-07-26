import logging

from celery import shared_task
from django.conf import settings
from django.db import transaction

from topics.models import Topic
from topics.services import (
    LocalEmbeddingUnavailable,
    refresh_topic_embedding,
    topic_embedding_fingerprint,
)


logger = logging.getLogger(__name__)


@shared_task(
    autoretry_for=(LocalEmbeddingUnavailable,),
    retry_backoff=5,
    retry_jitter=True,
    max_retries=3,
    acks_late=True,
    ignore_result=True,
)
def embed_topic(topic_uid, expected_fingerprint):
    topic = Topic.objects.filter(uid=topic_uid).first()
    if not topic:
        return "missing"
    current_fingerprint = topic_embedding_fingerprint(
        title=topic.title,
        description=topic.description,
    )
    if current_fingerprint != expected_fingerprint:
        return "stale"
    if (
        topic.embedding is not None
        and topic.embedding_model == settings.TOPIC_EMBEDDING_MODEL
        and topic.embedding_source_hash == current_fingerprint
    ):
        return "current"
    refreshed = refresh_topic_embedding(
        topic,
        expected_fingerprint=expected_fingerprint,
    )
    return "embedded" if refreshed is not None else "stale"


def enqueue_topic_embedding(topic):
    if not settings.TOPIC_EMBEDDING_ENABLED:
        return
    fingerprint = topic_embedding_fingerprint(
        title=topic.title,
        description=topic.description,
    )

    def publish():
        try:
            embed_topic.delay(str(topic.uid), fingerprint)
        except Exception:
            logger.exception(
                "Unable to enqueue embedding for Topic %s.",
                topic.uid,
            )

    transaction.on_commit(publish, robust=True)
