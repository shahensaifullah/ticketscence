from rest_framework import serializers

from tickets.models import Ticket, TicketExternalLink, TicketTimeEntry


class TicketExternalLinkSerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)

    class Meta:
        model = TicketExternalLink
        fields = ("uid", "provider", "url", "label", "created_at")


class TicketTimeEntrySerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    user_uid = serializers.UUIDField(source="user.uid", read_only=True)
    user_name = serializers.SerializerMethodField()
    elapsed_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = TicketTimeEntry
        fields = (
            "uid",
            "user_uid",
            "user_name",
            "started_at",
            "stopped_at",
            "last_heartbeat_at",
            "status",
            "progress_seconds",
            "duration_seconds",
            "elapsed_seconds",
        )

    def get_user_name(self, obj):
        return (
            f"{obj.user.first_name} {obj.user.last_name}".strip()
            or obj.user.email
        )


class TicketSummarySerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    reference = serializers.CharField(read_only=True)
    organization_slug = serializers.CharField(
        source="organization.slug",
        read_only=True,
    )
    project_uid = serializers.UUIDField(
        source="project.uid",
        read_only=True,
    )
    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
    )
    assignee_uid = serializers.UUIDField(
        source="assignee.uid",
        read_only=True,
        allow_null=True,
    )
    assignee_name = serializers.SerializerMethodField()
    total_tracked_seconds = serializers.SerializerMethodField()
    active_timer = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            "uid",
            "reference",
            "organization_slug",
            "title",
            "status",
            "priority",
            "estimated_minutes",
            "due_date",
            "project_uid",
            "project_name",
            "assignee_uid",
            "assignee_name",
            "total_tracked_seconds",
            "active_timer",
            "created_at",
        )

    def get_assignee_name(self, obj):
        if not obj.assignee:
            return None
        return (
            f"{obj.assignee.first_name} {obj.assignee.last_name}".strip()
            or obj.assignee.email
        )

    def get_time_entries(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {})
        if "time_entries" in prefetched:
            return list(prefetched["time_entries"])
        return list(obj.time_entries.select_related("user"))

    def get_total_tracked_seconds(self, obj):
        return sum(
            (
                entry.duration_seconds
                if entry.stopped_at
                else entry.elapsed_seconds
            )
            for entry in self.get_time_entries(obj)
        )

    def get_active_timer(self, obj):
        entry = next(
            (
                item
                for item in self.get_time_entries(obj)
                if item.status == TicketTimeEntry.Status.PROGRESSING
            ),
            None,
        )
        if not entry:
            return None
        return TicketTimeEntrySerializer(entry).data


class TicketDetailSerializer(TicketSummarySerializer):
    description = serializers.CharField(read_only=True)
    origin_topic = serializers.SerializerMethodField()
    external_links = TicketExternalLinkSerializer(many=True, read_only=True)
    time_entries = TicketTimeEntrySerializer(many=True, read_only=True)

    class Meta(TicketSummarySerializer.Meta):
        fields = TicketSummarySerializer.Meta.fields + (
            "description",
            "origin_topic",
            "external_links",
            "time_entries",
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
    project_uid = serializers.UUIDField()
    origin_topic_uid = serializers.UUIDField(required=False, allow_null=True)
    estimated_minutes = serializers.IntegerField(
        required=False,
        min_value=0,
        max_value=525600,
    )


class TicketUpdateSerializer(serializers.ModelSerializer):
    assignee_uid = serializers.UUIDField(
        required=False,
        allow_null=True,
        write_only=True,
    )
    project_uid = serializers.UUIDField(
        required=False,
        write_only=True,
    )

    class Meta:
        model = Ticket
        fields = (
            "title",
            "description",
            "status",
            "priority",
            "estimated_minutes",
            "due_date",
            "assignee_uid",
            "project_uid",
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
