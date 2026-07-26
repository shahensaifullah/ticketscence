from django.contrib import admin

from topics.models import (
    Topic,
    TopicActivity,
    TopicAttachment,
    TopicComment,
    TopicMention,
)


admin.site.register(Topic)
admin.site.register(TopicComment)
admin.site.register(TopicMention)
admin.site.register(TopicAttachment)
admin.site.register(TopicActivity)

