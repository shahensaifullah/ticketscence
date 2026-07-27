from rest_framework import serializers

from projects.models import Project
from projects.services import project_metrics
from tickets.serializers import TicketSummarySerializer


def user_name(user):
    if not user:
        return None
    return (
        f"{user.first_name} {user.last_name}".strip()
        or user.email
    )


class ProjectMemberSerializer(serializers.Serializer):
    user_uid = serializers.UUIDField(source="user.uid")
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")

    def get_name(self, obj):
        return user_name(obj.user)


class ProjectSerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    organization_uid = serializers.UUIDField(
        source="organization.uid",
        read_only=True,
    )
    lead_uid = serializers.UUIDField(
        source="lead.uid",
        read_only=True,
        allow_null=True,
    )
    lead_name = serializers.SerializerMethodField()
    created_by_uid = serializers.UUIDField(
        source="created_by.uid",
        read_only=True,
        allow_null=True,
    )
    created_by_name = serializers.SerializerMethodField()
    metrics = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "uid",
            "organization_uid",
            "name",
            "key",
            "description",
            "status",
            "priority",
            "lead_uid",
            "lead_name",
            "created_by_uid",
            "created_by_name",
            "start_date",
            "target_date",
            "color",
            "is_active",
            "metrics",
            "created_at",
            "updated_at",
        )

    def get_lead_name(self, obj):
        return user_name(obj.lead)

    def get_created_by_name(self, obj):
        return user_name(obj.created_by)

    def get_metrics(self, obj):
        return project_metrics(obj)


class ProjectDetailSerializer(ProjectSerializer):
    members = ProjectMemberSerializer(
        source="memberships",
        many=True,
        read_only=True,
    )
    tickets = TicketSummarySerializer(many=True, read_only=True)
    topic_count = serializers.SerializerMethodField()

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + (
            "members",
            "topic_count",
            "tickets",
        )

    def get_topic_count(self, obj):
        return obj.topics.count()


class ProjectWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    key = serializers.RegexField(
        regex=r"^[A-Za-z][A-Za-z0-9_-]{1,19}$",
        max_length=20,
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    status = serializers.ChoiceField(
        choices=Project.Status.choices,
        required=False,
    )
    priority = serializers.ChoiceField(
        choices=Project.Priority.choices,
        required=False,
        allow_null=True,
    )
    lead_uid = serializers.UUIDField(required=False, allow_null=True)
    member_user_uids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
    )
    start_date = serializers.DateField(required=False, allow_null=True)
    target_date = serializers.DateField(required=False, allow_null=True)
    color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        required=False,
    )

    def validate(self, attrs):
        start = attrs.get("start_date")
        target = attrs.get("target_date")
        if start and target and target < start:
            raise serializers.ValidationError(
                {"target_date": "Target date cannot be before start date."}
            )
        if "key" in attrs:
            attrs["key"] = attrs["key"].upper()
        return attrs
