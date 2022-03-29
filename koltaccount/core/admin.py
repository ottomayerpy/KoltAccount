from django.contrib import admin

from .models import (Account, Donation, LoginHistory, MasterPassword, Profile,
                     SiteSetting)


class AccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'updated', 'id']

    class Meta:
        model = Account


class MasterPasswordAdmin(admin.ModelAdmin):
    list_display = ['user', 'password', 'id']

    class Meta:
        model = MasterPassword


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_active_email', 'id']

    class Meta:
        model = Profile


class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip', 'system', 'location', 'browser', 'id']

    class Meta:
        model = LoginHistory


class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'id']

    class Meta:
        model = SiteSetting


admin.site.register(Account, AccountAdmin)
admin.site.register(MasterPassword, MasterPasswordAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(LoginHistory, LoginHistoryAdmin)
admin.site.register(SiteSetting, SiteSettingAdmin)
admin.site.register(Donation)
