from django.urls import path

from tickets import views


urlpatterns = [
    path("", views.TicketListCreateView.as_view(), name="ticket_list"),
    path(
        "<str:reference>",
        views.TicketDetailView.as_view(),
        name="ticket_detail",
    ),
    path(
        "<str:reference>/external-links",
        views.TicketExternalLinkCreateView.as_view(),
        name="ticket_external_link_create",
    ),
]

