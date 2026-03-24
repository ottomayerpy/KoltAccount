from baseapp.forms import PersonChangeForm, PersonCreationForm
from baseapp.models import SiteSetting
from baseapp.utils import UserModel
from candy.models import Candy, MasterPassword
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin


class KoltAdminSite(admin.AdminSite):
    pass


admin_site = KoltAdminSite(name="koltadmin")


@admin.register(Candy, site=admin_site)
class CandyAdmin(admin.ModelAdmin):
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


@admin.register(SiteSetting, site=admin_site)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ["name", "value"]
