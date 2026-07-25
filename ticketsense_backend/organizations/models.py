from autoslug import AutoSlugField
from django.db import models

from accounts.choices import OrganizationRole
from accounts.models import User
from shared_app.models import BaseModel


# Create your models here.
class Organization(BaseModel):
    name = models.CharField(max_length=255)
    slug = AutoSlugField(populate_from='name', unique=True)

    is_active = models.BooleanField(default=False)

    members = models.ManyToManyField(User, through='OrganizationMember')


    def __str__(self):
        return self.name

class OrganizationMember(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    role = models.CharField(
        max_length=30,
        choices=OrganizationRole.choices,
        default=OrganizationRole.REPORTER,
    )

    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = ('organization', 'user')

