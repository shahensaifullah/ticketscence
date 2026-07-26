from django.db import models


class WorkspaceRole(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    DEVELOPER = "developer", "Developer"
    SUPPORT_AGENT = "support_agent", "Support Agent"
    REPORTER = "reporter", "Reporter"
