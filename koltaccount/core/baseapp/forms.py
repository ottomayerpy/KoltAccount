from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import UserModel


class PersonCreationForm(UserCreationForm):

    class Meta:
        model = UserModel
        fields = ("username", "email")


class PersonChangeForm(UserChangeForm):

    class Meta:
        model = UserModel
        fields = ("username", "email")
