import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from accounts.choices import Role
from shared_app.models import BaseModel


class User(AbstractUser, BaseModel):
    uid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    email = models.EmailField(
        unique=True,
    )

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.REPORTER,
    )

    job_title = models.CharField(
        max_length=100,
        blank=True,
    )

    phone_number = models.CharField(
        max_length=30,
        blank=True,
    )

    avatar = models.ImageField(
        upload_to="users/avatars/",
        blank=True,
        null=True,
    )

    timezone = models.CharField(
        max_length=50,
        default="Europe/Berlin",
    )

    is_email_verified = models.BooleanField(
        default=False,
    )

    date_joined = None

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name","last_name"]

    def __str__(self) -> str:
        return self.email