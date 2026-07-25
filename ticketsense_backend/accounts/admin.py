from django.contrib import admin

from accounts.models import User
from organizations.models import Organization


# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name')
    search_fields = ('email', 'first_name', 'last_name')

class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ('name',)
    

admin.site.register(User, UserAdmin)
admin.site.register(Organization, OrganizationAdmin)