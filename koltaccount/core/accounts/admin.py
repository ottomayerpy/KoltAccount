from django.contrib import admin

from .models import Account


class AccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'updated', 'id']

    class Meta:
        model = Account


admin.site.register(Account, AccountAdmin)
