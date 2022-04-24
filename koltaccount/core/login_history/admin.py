from django.contrib import admin

from .models import LoginHistory


class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip', 'system', 'location', 'browser', 'id']

    class Meta:
        model = LoginHistory


admin.site.register(LoginHistory, LoginHistoryAdmin)
