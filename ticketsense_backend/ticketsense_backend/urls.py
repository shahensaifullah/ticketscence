from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('accounts.apis.auth.urls')),
    path('api/auth/', include('accounts.apis.auth.urls')),

    path("api-auth/", include("rest_framework.urls"))

]
