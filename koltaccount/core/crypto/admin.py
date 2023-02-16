from django.contrib import admin

from .models import MasterPassword


class MasterPasswordAdmin(admin.ModelAdmin):
    list_display = ["user", "password"]

    class Meta:
        model = MasterPassword


admin.site.register(MasterPassword, MasterPasswordAdmin)
