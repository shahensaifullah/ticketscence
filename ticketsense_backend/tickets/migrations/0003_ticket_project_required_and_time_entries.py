import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


def assign_legacy_tickets_to_general_projects(apps, schema_editor):
    Ticket = apps.get_model("tickets", "Ticket")
    Project = apps.get_model("projects", "Project")
    ProjectMember = apps.get_model("projects", "ProjectMember")
    WorkspaceMember = apps.get_model("organizations", "WorkspaceMember")

    organization_ids = (
        Ticket.objects.filter(project__isnull=True)
        .values_list("organization_id", flat=True)
        .distinct()
    )
    for organization_id in organization_ids:
        creator_id = (
            WorkspaceMember.objects.filter(
                workspace_id=organization_id,
                deleted_at__isnull=True,
                is_active=True,
            )
            .order_by("created_at", "id")
            .values_list("user_id", flat=True)
            .first()
        )
        project, _ = Project.objects.get_or_create(
            organization_id=organization_id,
            key="GENERAL",
            defaults={
                "name": "General",
                "description": "General workspace tickets.",
                "created_by_id": creator_id,
                "status": "in_progress",
            },
        )
        if creator_id:
            ProjectMember.objects.get_or_create(
                project_id=project.id,
                user_id=creator_id,
                defaults={"added_by_id": creator_id},
            )
        Ticket.objects.filter(
            organization_id=organization_id,
            project__isnull=True,
        ).update(project_id=project.id)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("projects", "0002_project_details_and_members"),
        ("tickets", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="estimated_minutes",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="TicketTimeEntry",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "uid",
                    models.UUIDField(
                        blank=True,
                        default=uuid.uuid4,
                        editable=False,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, db_index=True),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "started_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                    ),
                ),
                (
                    "stopped_at",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "duration_seconds",
                    models.PositiveBigIntegerField(default=0),
                ),
                (
                    "ticket",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="time_entries",
                        to="tickets.ticket",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="ticket_time_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-started_at"],
            },
        ),
        migrations.RunPython(
            assign_legacy_tickets_to_general_projects,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="ticket",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tickets",
                to="projects.project",
            ),
        ),
        migrations.AddConstraint(
            model_name="tickettimeentry",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("deleted_at__isnull", True),
                    ("stopped_at__isnull", True),
                ),
                fields=("ticket",),
                name="one_active_timer_per_ticket",
            ),
        ),
        migrations.AddConstraint(
            model_name="tickettimeentry",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(("stopped_at__isnull", True))
                    | models.Q(("stopped_at__gte", models.F("started_at")))
                ),
                name="ticket_timer_stop_not_before_start",
            ),
        ),
    ]
