from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import UserModel


class PersonCreationForm(UserCreationForm):

    class Meta:
        model = UserModel
        fields = ("username", "email", "is_active_email")


class PersonChangeForm(UserChangeForm):

    class Meta:
        model = UserModel
        fields = ("username", "email", "is_active_email")
