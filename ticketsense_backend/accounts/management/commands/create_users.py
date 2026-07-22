from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial users"

    DEFAULT_PASSWORD = "12345"

    USERS = [
        {
            "username": "superadmin",
            "email": "superadmin@ticketsense.local",
            "first_name": "Super",
            "last_name": "Admin",
            "role": "admin",
            "is_superuser": True,
            "is_staff": True,
        },
        {
            "username": "admin",
            "email": "admin@ticketsense.local",
            "first_name": "System",
            "last_name": "Admin",
            "role": "admin",
            "is_staff": True,
        },
        {
            "username": "manager",
            "email": "manager@ticketsense.local",
            "first_name": "Project",
            "last_name": "Manager",
            "role": "manager",
        },
        {
            "username": "developer1",
            "email": "developer1@ticketsense.local",
            "first_name": "John",
            "last_name": "Developer",
            "role": "developer",
        },
        {
            "username": "developer2",
            "email": "developer2@ticketsense.local",
            "first_name": "Jane",
            "last_name": "Developer",
            "role": "developer",
        },
        {
            "username": "qa",
            "email": "qa@ticketsense.local",
            "first_name": "QA",
            "last_name": "Engineer",
            "role": "qa",
        },
        {
            "username": "support",
            "email": "support@ticketsense.local",
            "first_name": "Support",
            "last_name": "Agent",
            "role": "support_agent",
        },
        {
            "username": "reporter",
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

            user = User.objects.create_user(
                **data,
                password=password,
            )

            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Created: {email} | Password: {password}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS("✔ Dummy users created successfully.")
        )