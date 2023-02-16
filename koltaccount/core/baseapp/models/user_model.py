from django.contrib.auth.models import AbstractUser
from django.db.models import BooleanField
from django.utils.translation import gettext_lazy as _


class UserModel(AbstractUser):
    is_active_email = BooleanField(verbose_name=_(
        "Подтверждение почты"), default=False)

    def __str__(self):
        return self.username
