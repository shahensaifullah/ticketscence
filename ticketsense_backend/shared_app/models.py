from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def restore(self):
        return self.update(deleted_at=None)

    def active(self):
        return self.filter(deleted_at__isnull=True)

    def deleted(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(
            self.model,
            using=self._db,
        ).filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(
            self.model,
            using=self._db,
        )


class BaseModel(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(
            using=using,
            update_fields=["deleted_at", "updated_at"],
        )

    def restore(self, using=None):
        self.deleted_at = None
        self.save(
            using=using,
            update_fields=["deleted_at", "updated_at"],
        )

    def hard_delete(self, using=None, keep_parents=False):
        return super().delete(
            using=using,
            keep_parents=keep_parents,
        )