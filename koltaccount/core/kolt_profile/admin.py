from django.contrib import admin

from .models import Profile


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_active_email', 'id']

    class Meta:
        model = Profile


admin.site.register(Profile, ProfileAdmin)
