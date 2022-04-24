from django.contrib import admin

from .models import CryptoParam, CryptoSetting, MasterPassword


class CryptoSettingAdmin(admin.ModelAdmin):
    list_display = ['user', 'key', 'iv', 'salt', 'iterations', 'id']

    class Meta:
        model = CryptoSetting


class CryptoParamAdmin(admin.ModelAdmin):
    list_display = ['size', 'devision', 'id']

    class Meta:
        model = CryptoParam


class MasterPasswordAdmin(admin.ModelAdmin):
    list_display = ['user', 'password', 'id']

    class Meta:
        model = MasterPassword


admin.site.register(CryptoSetting, CryptoSettingAdmin)
admin.site.register(CryptoParam, CryptoParamAdmin)
admin.site.register(MasterPassword, MasterPasswordAdmin)
