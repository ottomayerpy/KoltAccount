from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import PersonChangeForm, PersonCreationForm
from .models import UserModel


class PersonAdmin(UserAdmin):
    add_form = PersonCreationForm
    form = PersonChangeForm
    model = UserModel
    list_display = ["username", "email", "is_active_email"]


admin.site.register(UserModel, PersonAdmin)
