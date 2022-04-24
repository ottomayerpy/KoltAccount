from django.contrib import admin

from .models import SiteSetting


class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'id']

    class Meta:
        model = SiteSetting


admin.site.register(SiteSetting, SiteSettingAdmin)
