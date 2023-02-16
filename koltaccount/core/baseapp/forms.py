from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import Person


class PersonCreationForm(UserCreationForm):

    class Meta:
        model = Person
        fields = ("username", "email")


class PersonChangeForm(UserChangeForm):

    class Meta:
        model = Person
        fields = ("username", "email")
