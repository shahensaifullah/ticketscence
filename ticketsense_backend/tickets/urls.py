from django.urls import path

from tickets import views


urlpatterns = [
    path("", views.TicketListCreateView.as_view(), name="ticket_list"),
    path(
        "assigned",
        views.AssignedTicketListView.as_view(),
        name="assigned_ticket_list",
    ),
    path(
        "timer/active",
        views.ActiveTicketTimerView.as_view(),
        name="active_ticket_timer",
    ),
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
    path(
        "<str:reference>/timer/start",
        views.TicketTimerStartView.as_view(),
        name="ticket_timer_start",
    ),
    path(
        "<str:reference>/timer/stop",
        views.TicketTimerStopView.as_view(),
        name="ticket_timer_stop",
    ),
    path(
        "<str:reference>/timer/heartbeat",
        views.TicketTimerHeartbeatView.as_view(),
        name="ticket_timer_heartbeat",
    ),
]
