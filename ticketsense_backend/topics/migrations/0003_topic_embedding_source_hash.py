from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("topics", "0002_reset_topic_embeddings_for_bge"),
    ]

    operations = [
        migrations.AddField(
            model_name="topic",
            name="embedding_source_hash",
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
