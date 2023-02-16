from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import PersonChangeForm, PersonCreationForm
from .models import Person


class PersonAdmin(UserAdmin):
    add_form = PersonCreationForm
    form = PersonChangeForm
    model = Person
    list_display = ["username", "email", "wallet"]


admin.site.register(Person, PersonAdmin)
