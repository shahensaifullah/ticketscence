from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from organizations.models import Organization, OrganizationMember

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial users"

    DEFAULT_PASSWORD = "12345"


    organizations = [
        {
            "name": "saif",
        }
    ]
    organization_name = "Bongo"

    USERS = [
        {
            "email": "saif@saif.com",
            "first_name": "Super",
            "last_name": "Admin",
            "role": "admin",
            "is_superuser": True,
            "is_staff": True,
        },
        {
            "email": "admin@ticketsense.local",
            "first_name": "System",
            "last_name": "Admin",
            "role": "admin",
            "is_staff": True,
        },
        {
            "email": "manager@ticketsense.local",
            "first_name": "Project",
            "last_name": "Manager",
            "role": "manager",
        },
        {
            "email": "developer1@ticketsense.local",
            "first_name": "John",
            "last_name": "Developer",
            "role": "developer",
        },
        {
            "email": "developer2@ticketsense.local",
            "first_name": "Jane",
            "last_name": "Developer",
            "role": "developer",
        },
        {
            "email": "qa@ticketsense.local",
            "first_name": "QA",
            "last_name": "Engineer",
            "role": "qa",
        },
        {
            "email": "support@ticketsense.local",
            "first_name": "Support",
            "last_name": "Agent",
            "role": "support_agent",
        },
        {
            "email": "reporter@ticketsense.local",
            "first_name": "End",
            "last_name": "User",
            "role": "reporter",
        },
    ]

    def handle(self, *args, **options):

        for data in self.USERS:

            email = data["email"]

            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f"{email} already exists")
                )
                continue

            password = self.DEFAULT_PASSWORD

            is_superuser = data.pop("is_superuser", False)
            is_staff = data.pop("is_staff", False)
            role = data.pop("role", False)

            user = User.objects.create_user(
                **data,
                password=password,
            )

            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.save()

            org, _ = Organization.objects.get_or_create(
                name=self.organization_name
            )
            OrganizationMember.objects.create(
                user=user,
                organization=org,
                role=role,
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Created: {email} | Password: {password}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS("✔ Dummy users created successfully.")
        )
