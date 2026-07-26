from django.urls import path

from topics import views


urlpatterns = [
    path("", views.TopicListCreateView.as_view(), name="topic_list"),
    path(
        "suggestions",
        views.TopicSuggestionView.as_view(),
        name="topic_suggestions",
    ),
    path(
        "<uuid:topic_uid>",
        views.TopicDetailView.as_view(),
        name="topic_detail",
    ),
    path(
        "<uuid:topic_uid>/comments",
        views.TopicCommentCreateView.as_view(),
        name="topic_comment_create",
    ),
    path(
        "<uuid:topic_uid>/attachments",
        views.TopicAttachmentCreateView.as_view(),
        name="topic_attachment_create",
    ),
    path(
        "<uuid:topic_uid>/tickets",
        views.TopicTicketCreateView.as_view(),
        name="topic_ticket_create",
    ),
]
