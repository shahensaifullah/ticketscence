from django.contrib import admin

from accounts.models import User
from organizations.models import Workspace


# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name')
    search_fields = ('email', 'first_name', 'last_name')

class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ('name',)
    

admin.site.register(User, UserAdmin)
admin.site.register(Workspace, WorkspaceAdmin)