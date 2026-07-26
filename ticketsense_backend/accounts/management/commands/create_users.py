from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from organizations.models import Workspace, WorkspaceMember

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial users"

    DEFAULT_PASSWORD = "123456"


    workspaces = [
        {
            "name": "saif",
        }
    ]

    USERS = [
        {
            "email": "admin@admin.com",
            "first_name": "Saifullah",
            "last_name": "Shahen",
            "role": "admin",
            "is_superuser": True,
            "is_staff": True,
            "workspace": ["bongo", "amazon"]
        },
        {
            "email": "admin@bongo.local",
            "first_name": "System",
            "last_name": "Admin",
            "role": "admin",
            "is_staff": True,
            "workspace": ["bongo"]
        },
        {
            "email": "manager@bongo.local",
            "first_name": "Project",
            "last_name": "Manager",
            "role": "manager",
            "workspace": ["bongo"]
        },
        {
            "email": "developer1@bongo.local",
            "first_name": "John",
            "last_name": "Developer",
            "role": "developer",
            "workspace": ["bongo"]
        },
        {
            "email": "developer2@bongo.local",
            "first_name": "Jane",
            "last_name": "Developer",
            "role": "developer",
            "workspace": ["bongo"]
        },
        {
            "email": "qa@amazon.local",
            "first_name": "QA",
            "last_name": "Engineer",
            "role": "qa",
            "workspace": ["amazon"]
        },
        {
            "email": "support@bongo.local",
            "first_name": "Support",
            "last_name": "Agent",
            "role": "support_agent",
            "workspace": ["bongo"]
        },
        {
            "email": "reporter@amazon.local",
            "first_name": "End",
            "last_name": "User",
            "role": "reporter",
            "workspace": ["amazon"]
        },
        {
            "email": "reporter@bongo.local",
            "first_name": "End",
            "last_name": "User",
            "role": "reporter",
            "workspace": ["bongo"]
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
            workspace_names = data.pop("workspace", "dhaka")

            user = User.objects.create_user(
                **data,
                password=password,
            )

            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.save()
            for index ,workspace_name in enumerate(workspace_names):
                workspace, _ = Workspace.objects.get_or_create(
                    name=workspace_name
                )
                WorkspaceMember.objects.create(
                    user=user,
                    workspace=workspace,
                    role=role,
                    is_current = True if index == 0 else False,
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Created: {email} | Password: {password}"
                )
            )


        self.stdout.write(
            self.style.SUCCESS("✔ Dummy users created successfully.")
        )
