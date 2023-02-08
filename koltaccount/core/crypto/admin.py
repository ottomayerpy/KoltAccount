from django.contrib import admin

from .models import MasterPassword


class MasterPasswordAdmin(admin.ModelAdmin):
    list_display = ['user', 'password', 'id']

    class Meta:
        model = MasterPassword


admin.site.register(MasterPassword, MasterPasswordAdmin)
