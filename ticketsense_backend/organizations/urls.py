from django.urls import path

from organizations import views


urlpatterns = [
    path("", views.WorkspaceListCreateView.as_view(), name="workspace_list"),
    path("mine", views.MyWorkspaceListView.as_view(), name="my_workspace_list"),
    path(
        "<slug:workspace_slug>",
        views.WorkspaceDetailView.as_view(),
        name="workspace_detail",
    ),
    path(
        "<slug:workspace_slug>/dashboard",
        views.WorkspaceDashboardView.as_view(),
        name="workspace_dashboard",
    ),
    path(
        "<slug:workspace_slug>/activate",
        views.CurrentWorkspaceView.as_view(),
        name="workspace_activate",
    ),
    path(
        "<slug:workspace_slug>/members",
        views.WorkspaceMemberCreateView.as_view(),
        name="workspace_member_create",
    ),
]
