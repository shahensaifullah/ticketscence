from django.urls import path

from projects import views


urlpatterns = [
    path("", views.ProjectListCreateView.as_view(), name="project_list"),
    path(
        "<str:project_key>",
        views.ProjectDetailView.as_view(),
        name="project_detail",
    ),
]
