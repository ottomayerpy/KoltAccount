from core.baseapp.models import BaseModel, UserModel
from django.db.models import CASCADE, CharField, ForeignKey
from django.utils.translation import gettext_lazy as _


class Account(BaseModel):
    """ Аккаунты пользователя """
    user = ForeignKey(UserModel, verbose_name=_(
        "Пользователь"), on_delete=CASCADE)
    site = CharField(verbose_name=_("Сайт"), max_length=255)
    description = CharField(verbose_name=_("Описание"), max_length=255)
    login = CharField(verbose_name=_("Логин"), max_length=255)
    password = CharField(verbose_name=_("Пароль"), max_length=255)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = "Аккаунт"
        verbose_name_plural = "Аккаунты"
