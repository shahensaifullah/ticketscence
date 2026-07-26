import hashlib
import re
from functools import lru_cache

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from pgvector.django import CosineDistance

from accounts.models import User
from organizations.models import WorkspaceMember
from topics.models import (
    Topic,
    TopicActivity,
    TopicComment,
    TopicMention,
)


MENTION_PATTERN = re.compile(
    r"@([A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+"
    r"@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)"
)
EMBEDDING_DESCRIPTION_MAX_CHARS = 6000


class LocalEmbeddingUnavailable(Exception):
    pass


def topic_embedding_text(*, title, description):
    return (
        f"Title: {title.strip()}\n"
        "Description: "
        f"{description.strip()[:EMBEDDING_DESCRIPTION_MAX_CHARS]}"
    )


def topic_embedding_fingerprint(*, title, description):
    return hashlib.sha256(
        topic_embedding_text(
            title=title,
            description=description,
        ).encode("utf-8")
    ).hexdigest()


@lru_cache(maxsize=1)
def get_embedding_model():
    try:
        from fastembed import TextEmbedding

        return TextEmbedding(
            model_name=settings.TOPIC_EMBEDDING_MODEL,
            cache_dir=settings.TOPIC_EMBEDDING_CACHE_DIR,
            threads=settings.TOPIC_EMBEDDING_THREADS,
        )
    except Exception as error:
        raise LocalEmbeddingUnavailable(
            "The local Topic embedding model could not be loaded."
        ) from error


def create_embeddings(texts):
    cleaned_texts = [text.strip() for text in texts]
    if not cleaned_texts or any(not text for text in cleaned_texts):
        raise ValueError("Embedding input cannot be empty.")
    try:
        embeddings = [
            embedding.tolist()
            for embedding in get_embedding_model().embed(cleaned_texts)
        ]
    except LocalEmbeddingUnavailable:
        raise
    except Exception as error:
        raise LocalEmbeddingUnavailable(
            "Local Topic embedding inference failed."
        ) from error
    if len(embeddings) != len(cleaned_texts) or any(
        len(embedding) != settings.TOPIC_EMBEDDING_DIMENSIONS
        for embedding in embeddings
    ):
        raise LocalEmbeddingUnavailable(
            "The local model returned unexpected embedding dimensions."
        )
    return embeddings


def refresh_topic_embedding(topic, expected_fingerprint=None):
    title = topic.title
    description = topic.description
    source_hash = topic_embedding_fingerprint(
        title=title,
        description=description,
    )
    if expected_fingerprint and source_hash != expected_fingerprint:
        return None
    embedding = create_embeddings(
        [
            topic_embedding_text(
                title=title,
                description=description,
            )
        ]
    )[0]
    now = timezone.now()
    updated = Topic.objects.filter(
        pk=topic.pk,
        title=title,
        description=description,
    ).update(
        embedding=embedding,
        embedding_model=settings.TOPIC_EMBEDDING_MODEL,
        embedding_source_hash=source_hash,
        embedding_updated_at=now,
    )
    if not updated:
        return None
    topic.embedding = embedding
    topic.embedding_model = settings.TOPIC_EMBEDDING_MODEL
    topic.embedding_source_hash = source_hash
    topic.embedding_updated_at = now
    return embedding


def find_similar_topics(
    *,
    organization,
    title="",
    description="",
    exclude_uid=None,
    limit=5,
):
    query_embedding = create_embeddings(
        [
            topic_embedding_text(
                title=title,
                description=description,
            )
        ]
    )[0]
    queryset = (
        Topic.objects.filter(
            organization=organization,
            embedding__isnull=False,
            embedding_model=settings.TOPIC_EMBEDDING_MODEL,
        )
        .annotate(
            distance=CosineDistance("embedding", query_embedding)
        )
        .order_by("distance")
    )
    if exclude_uid:
        queryset = queryset.exclude(uid=exclude_uid)

    suggestions = []
    for topic in queryset.only(
        "uid",
        "title",
        "description",
        "topic_type",
        "status",
    )[: max(limit * 4, 20)]:
        score = max(0.0, min(1.0, 1.0 - float(topic.distance)))
        if score < settings.TOPIC_SIMILARITY_THRESHOLD:
            continue
        suggestions.append(
            {
                "uid": topic.uid,
                "title": topic.title,
                "topic_type": topic.topic_type,
                "status": topic.status,
                "score": round(score, 3),
            }
        )
        if len(suggestions) >= limit:
            break
    return suggestions


def record_topic_activity(topic, actor, event, description):
    TopicActivity.objects.create(
        topic=topic,
        actor=actor,
        event=event,
        description=description,
    )
    Topic.objects.filter(pk=topic.pk).update(
        last_activity_at=timezone.now(),
        updated_at=timezone.now(),
    )


@transaction.atomic
def create_topic_comment(
    *,
    topic,
    author,
    body,
    parent=None,
    mention_user_uids=(),
):
    if parent and parent.topic_id != topic.id:
        raise ValueError("A reply must belong to the same topic.")

    comment = TopicComment.objects.create(
        topic=topic,
        author=author,
        parent=parent,
        body=body,
    )
    mentioned_emails = {
        email.lower()
        for email in MENTION_PATTERN.findall(body)
    }
    explicit_uids = {str(uid) for uid in mention_user_uids}
    organization_user_ids = WorkspaceMember.objects.filter(
        workspace=topic.organization,
        is_active=True,
        user__is_active=True,
    ).values_list("user_id", flat=True)
    mentioned_users = User.objects.filter(
        id__in=organization_user_ids,
    ).filter(
        models.Q(email__in=mentioned_emails)
        | models.Q(uid__in=explicit_uids)
    )
    TopicMention.objects.bulk_create(
        [
            TopicMention(
                topic=topic,
                comment=comment,
                mentioned_user=user,
                mentioned_by=author,
            )
            for user in mentioned_users
            if user.id != author.id
        ]
    )
    record_topic_activity(
        topic,
        author,
        TopicActivity.Event.COMMENTED,
        "Added a reply." if parent else "Added a comment.",
    )
    return comment
