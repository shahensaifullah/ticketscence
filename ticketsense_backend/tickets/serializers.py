from rest_framework import serializers

from tickets.models import Ticket, TicketExternalLink


class TicketExternalLinkSerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)

    class Meta:
        model = TicketExternalLink
        fields = ("uid", "provider", "url", "label", "created_at")


class TicketSummarySerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    reference = serializers.CharField(read_only=True)
    project_uid = serializers.UUIDField(
        source="project.uid",
        read_only=True,
        allow_null=True,
    )
    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
        allow_null=True,
    )
    assignee_uid = serializers.UUIDField(
        source="assignee.uid",
        read_only=True,
        allow_null=True,
    )
    assignee_name = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            "uid",
            "reference",
            "title",
            "status",
            "priority",
            "project_uid",
            "project_name",
            "assignee_uid",
            "assignee_name",
            "created_at",
        )

    def get_assignee_name(self, obj):
        if not obj.assignee:
            return None
        return (
            f"{obj.assignee.first_name} {obj.assignee.last_name}".strip()
            or obj.assignee.email
        )


class TicketDetailSerializer(TicketSummarySerializer):
    description = serializers.CharField(read_only=True)
    origin_topic = serializers.SerializerMethodField()
    external_links = TicketExternalLinkSerializer(many=True, read_only=True)

    class Meta(TicketSummarySerializer.Meta):
        fields = TicketSummarySerializer.Meta.fields + (
            "description",
            "origin_topic",
            "external_links",
        )

    def get_origin_topic(self, obj):
        topic = obj.origin_topic
        if not topic:
            return None
        return {
            "uid": str(topic.uid),
            "title": topic.title,
            "topic_type": topic.topic_type,
            "status": topic.status,
            "is_deleted": topic.is_deleted,
        }


class TicketCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=Ticket.Priority.choices,
        required=False,
        allow_null=True,
    )
    project_uid = serializers.UUIDField(required=False, allow_null=True)
    origin_topic_uid = serializers.UUIDField(required=False, allow_null=True)


class TicketUpdateSerializer(serializers.ModelSerializer):
    assignee_uid = serializers.UUIDField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Ticket
        fields = (
            "title",
            "description",
            "status",
            "priority",
            "assignee_uid",
        )


class TicketDeleteSerializer(serializers.Serializer):
    confirmation = serializers.CharField(
        trim_whitespace=False,
        allow_blank=True,
    )


class TicketExternalLinkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketExternalLink
        fields = ("provider", "url", "label")
