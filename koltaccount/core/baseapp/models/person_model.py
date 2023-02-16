from django.contrib.auth.models import AbstractUser
from django.db.models import IntegerField
from django.utils.translation import gettext_lazy as _


class Person(AbstractUser):
    wallet = IntegerField(verbose_name=_("Кошелек"), default=0)

    def __str__(self):
        return self.username
