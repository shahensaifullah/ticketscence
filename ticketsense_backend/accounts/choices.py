from django.db import models

class Role(models.TextChoices):
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    DEVELOPER = "developer", "Developer"
    SUPPORT_AGENT = "support_agent", "Support Agent"
    REPORTER = "reporter", "Reporter"
