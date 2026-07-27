import django.db.models.deletion
from django.db import migrations, models


def assign_topics_to_general_projects(apps, schema_editor):
    Topic = apps.get_model("topics", "Topic")
    Project = apps.get_model("projects", "Project")
    ProjectMember = apps.get_model("projects", "ProjectMember")
    WorkspaceMember = apps.get_model("organizations", "WorkspaceMember")

    organization_ids = (
        Topic.objects.filter(project__isnull=True)
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
                "description": "General workspace topics and tickets.",
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
        Topic.objects.filter(
            organization_id=organization_id,
            project__isnull=True,
        ).update(project_id=project.id)


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0002_project_details_and_members"),
        ("topics", "0003_topic_embedding_source_hash"),
    ]

    operations = [
        migrations.RunPython(
            assign_topics_to_general_projects,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="topic",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="topics",
                to="projects.project",
            ),
        ),
    ]
