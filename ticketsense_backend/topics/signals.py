from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from topics.models import Topic
from topics.services import topic_embedding_fingerprint
from topics.tasks import enqueue_topic_embedding


@receiver(post_save, sender=Topic)
def enqueue_topic_embedding_after_save(sender, instance, **kwargs):
    if not settings.TOPIC_EMBEDDING_ENABLED or instance.is_deleted:
        return
    source_hash = topic_embedding_fingerprint(
        title=instance.title,
        description=instance.description,
    )
    if (
        instance.embedding is not None
        and instance.embedding_model == settings.TOPIC_EMBEDDING_MODEL
        and instance.embedding_source_hash == source_hash
    ):
        return
    enqueue_topic_embedding(instance)
