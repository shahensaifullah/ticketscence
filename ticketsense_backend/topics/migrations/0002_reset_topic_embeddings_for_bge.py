from django.db import migrations


def clear_legacy_local_embeddings(apps, schema_editor):
    Topic = apps.get_model("topics", "Topic")
    Topic.objects.exclude(
        embedding_model="BAAI/bge-small-en-v1.5"
    ).update(
        embedding=None,
        embedding_model="",
        embedding_updated_at=None,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("topics", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            clear_legacy_local_embeddings,
            migrations.RunPython.noop,
        ),
    ]
