from core.accounts.models import Account
from core.baseapp.forms import PersonChangeForm, PersonCreationForm
from core.crypto.models import MasterPassword
from core.donation.models import Donation
from core.site_settings.models import SiteSetting
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from home.forms import UserModel


class KoltAdminSite(admin.AdminSite):
    pass


admin_site = KoltAdminSite(name="koltadmin")


@admin.register(Account, site=admin_site)
class AccountAdmin(admin.ModelAdmin):
    list_display = ["user"]


@admin.register(UserModel, site=admin_site)
class PersonAdmin(UserAdmin):
    add_form = PersonCreationForm
    form = PersonChangeForm
    model = UserModel
    list_display = ["username", "email", "is_active_email"]


@admin.register(MasterPassword, site=admin_site)
class MasterPasswordAdmin(admin.ModelAdmin):
    list_display = ["user", "password"]


@admin.register(Donation, site=admin_site)
class DonationAdmin(admin.ModelAdmin):
    list_display = ["user"]


@admin.register(SiteSetting, site=admin_site)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ["name", "value"]
