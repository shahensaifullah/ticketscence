from django.db import models

class OrganizationRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    DEVELOPER = "developer", "Developer"
    SUPPORT_AGENT = "support_agent", "Support Agent"
    REPORTER = "reporter", "Reporter"
