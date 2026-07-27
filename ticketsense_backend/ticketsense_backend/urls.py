from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth', include('accounts.apis.auth.urls')),
    path('api/auth/', include('accounts.apis.auth.urls')),
    path(
        "api/workspaces/<slug:workspace_slug>/topics/",
        include("topics.urls"),
    ),
    path(
        "api/workspaces/<slug:workspace_slug>/tickets/",
        include("tickets.urls"),
    ),
    path(
        "api/workspaces/<slug:workspace_slug>/projects/",
        include("projects.urls"),
    ),
    path("api/workspaces/", include("organizations.urls")),
    # Temporary compatibility alias for clients using the previous endpoint.
    path("api/organizations/", include("organizations.urls")),

    path("api-auth/", include("rest_framework.urls"))

]
