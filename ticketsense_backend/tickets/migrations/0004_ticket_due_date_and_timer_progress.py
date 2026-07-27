import django.utils.timezone
from django.db import migrations, models


def normalize_time_entries(apps, schema_editor):
    TicketTimeEntry = apps.get_model("tickets", "TicketTimeEntry")

    completed = TicketTimeEntry.objects.filter(stopped_at__isnull=False)
    completed.update(
        status="completed",
        progress_seconds=models.F("duration_seconds"),
        last_heartbeat_at=models.F("stopped_at"),
    )

    active_user_ids = (
        TicketTimeEntry.objects.filter(stopped_at__isnull=True)
        .values_list("user_id", flat=True)
        .distinct()
    )
    now = django.utils.timezone.now()
    for user_id in active_user_ids:
        active_entries = list(
            TicketTimeEntry.objects.filter(
                user_id=user_id,
                stopped_at__isnull=True,
            ).order_by("-started_at", "-id")
        )
        for entry in active_entries:
            progress = max(
                0,
                int((now - entry.started_at).total_seconds()),
            )
            entry.progress_seconds = progress
            entry.last_heartbeat_at = now
            if entry != active_entries[0]:
                entry.status = "completed"
                entry.stopped_at = now
                entry.duration_seconds = progress
            entry.save(
                update_fields=(
                    "progress_seconds",
                    "last_heartbeat_at",
                    "status",
                    "stopped_at",
                    "duration_seconds",
                )
            )


class Migration(migrations.Migration):
    dependencies = [
        ("tickets", "0003_ticket_project_required_and_time_entries"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="due_date",
            field=models.DateField(
                blank=True,
                db_index=True,
                null=True,
            ),
        ),
        migrations.RemoveConstraint(
            model_name="tickettimeentry",
            name="one_active_timer_per_ticket",
        ),
        migrations.AddField(
            model_name="tickettimeentry",
            name="last_heartbeat_at",
            field=models.DateTimeField(
                db_index=True,
                default=django.utils.timezone.now,
            ),
        ),
        migrations.AddField(
            model_name="tickettimeentry",
            name="progress_seconds",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="tickettimeentry",
            name="status",
            field=models.CharField(
                choices=[
                    ("progressing", "Progressing"),
                    ("completed", "Completed"),
                ],
                db_index=True,
                default="progressing",
                max_length=20,
            ),
        ),
        migrations.RunPython(
            normalize_time_entries,
            migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="tickettimeentry",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("deleted_at__isnull", True),
                    ("status", "progressing"),
                ),
                fields=("ticket",),
                name="one_active_timer_per_ticket",
            ),
        ),
        migrations.AddConstraint(
            model_name="tickettimeentry",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("deleted_at__isnull", True),
                    ("status", "progressing"),
                ),
                fields=("user",),
                name="one_active_timer_per_user",
            ),
        ),
    ]
