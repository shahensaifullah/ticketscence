from rest_framework import serializers

from tickets.serializers import TicketSummarySerializer
from topics.models import (
    Topic,
    TopicActivity,
    TopicAttachment,
    TopicComment,
    TopicMention,
)


def user_name(user):
    return f"{user.first_name} {user.last_name}".strip() or user.email


class TopicMentionSerializer(serializers.ModelSerializer):
    user_uid = serializers.UUIDField(
        source="mentioned_user.uid",
        read_only=True,
    )
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(
        source="mentioned_user.email",
        read_only=True,
    )

    class Meta:
        model = TopicMention
        fields = ("user_uid", "name", "email")

    def get_name(self, obj):
        return user_name(obj.mentioned_user)


class TopicAttachmentSerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    url = serializers.FileField(source="file", read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TopicAttachment
        fields = (
            "uid",
            "original_name",
            "content_type",
            "size",
            "url",
            "uploaded_by_name",
            "created_at",
        )

    def get_uploaded_by_name(self, obj):
        return user_name(obj.uploaded_by)


class TopicCommentSerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    parent_uid = serializers.UUIDField(
        source="parent.uid",
        read_only=True,
        allow_null=True,
    )
    author_uid = serializers.UUIDField(source="author.uid", read_only=True)
    author_name = serializers.SerializerMethodField()
    mentions = TopicMentionSerializer(many=True, read_only=True)
    attachments = TopicAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = TopicComment
        fields = (
            "uid",
            "parent_uid",
            "author_uid",
            "author_name",
            "body",
            "mentions",
            "attachments",
            "created_at",
            "updated_at",
        )

    def get_author_name(self, obj):
        return user_name(obj.author)


class TopicActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = TopicActivity
        fields = ("event", "description", "actor_name", "created_at")

    def get_actor_name(self, obj):
        return user_name(obj.actor) if obj.actor else "Former member"


class TopicSerializer(serializers.ModelSerializer):
    uid = serializers.UUIDField(read_only=True)
    organization_uid = serializers.UUIDField(
        source="organization.uid",
        read_only=True,
    )
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
    created_by_uid = serializers.UUIDField(
        source="created_by.uid",
        read_only=True,
    )
    created_by_name = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(read_only=True)
    ticket_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = (
            "uid",
            "organization_uid",
            "project_uid",
            "project_name",
            "title",
            "description",
            "topic_type",
            "status",
            "priority",
            "created_by_uid",
            "created_by_name",
            "is_pinned",
            "is_locked",
            "last_activity_at",
            "comment_count",
            "ticket_count",
            "created_at",
            "updated_at",
        )

    def get_created_by_name(self, obj):
        return user_name(obj.created_by)


class TopicDetailSerializer(TopicSerializer):
    comments = TopicCommentSerializer(many=True, read_only=True)
    attachments = TopicAttachmentSerializer(many=True, read_only=True)
    tickets = TicketSummarySerializer(many=True, read_only=True)
    activities = TopicActivitySerializer(many=True, read_only=True)
    participants = serializers.SerializerMethodField()
    solution_ticket = TicketSummarySerializer(read_only=True)

    class Meta(TopicSerializer.Meta):
        fields = TopicSerializer.Meta.fields + (
            "attachments",
            "participants",
            "comments",
            "tickets",
            "solution",
            "solution_url",
            "solution_ticket",
            "activities",
        )

    def get_participants(self, obj):
        users = {obj.created_by_id: obj.created_by}
        for comment in obj.comments.all():
            users[comment.author_id] = comment.author
            for mention in comment.mentions.all():
                users[mention.mentioned_user_id] = mention.mentioned_user
        return [
            {
                "uid": str(user.uid),
                "name": user_name(user),
                "email": user.email,
            }
            for user in users.values()
        ]


class TopicCreateSerializer(serializers.ModelSerializer):
    project_uid = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Topic
        fields = (
            "project_uid",
            "title",
            "description",
            "topic_type",
            "priority",
        )

    def validate_title(self, value):
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Topic title cannot be blank.")
        return title


class TopicUpdateSerializer(serializers.ModelSerializer):
    solution_ticket_uid = serializers.UUIDField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Topic
        fields = (
            "title",
            "description",
            "topic_type",
            "status",
            "priority",
            "is_pinned",
            "is_locked",
            "solution",
            "solution_url",
            "solution_ticket_uid",
        )


class TopicSuggestionQuerySerializer(serializers.Serializer):
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )
    exclude_uid = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        title = attrs.get("title", "").strip()
        description = attrs.get("description", "").strip()
        if len(f"{title} {description}".strip()) < 4:
            raise serializers.ValidationError(
                "Enter at least four characters to find similar Topics."
            )
        attrs["title"] = title
        attrs["description"] = description
        return attrs


class TopicSuggestionSerializer(serializers.Serializer):
    uid = serializers.UUIDField()
    title = serializers.CharField()
    topic_type = serializers.ChoiceField(choices=Topic.Type.choices)
    status = serializers.ChoiceField(choices=Topic.Status.choices)
    score = serializers.FloatField()


class TopicDeleteSerializer(serializers.Serializer):
    confirmation = serializers.CharField(
        trim_whitespace=False,
        allow_blank=True,
    )


class TopicCommentCreateSerializer(serializers.Serializer):
    body = serializers.CharField(trim_whitespace=True)
    parent_uid = serializers.UUIDField(required=False, allow_null=True)
    mention_user_uids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
    )


class TopicAttachmentCreateSerializer(serializers.Serializer):
    file = serializers.FileField()
    comment_uid = serializers.UUIDField(required=False, allow_null=True)


class TopicTicketCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=Topic.Priority.choices,
    )
    project_uid = serializers.UUIDField(required=False, allow_null=True)
