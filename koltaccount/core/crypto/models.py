from core.baseapp.models import BaseModel, UserModel
from django.db.models import CASCADE, CharField, OneToOneField
from django.utils.translation import gettext_lazy as _


class MasterPassword(BaseModel):
    """ Мастер пароль пользователя """
    user = OneToOneField(
        UserModel, verbose_name=_("Пользователь"), on_delete=CASCADE)
    password = CharField(verbose_name=_("Пароль"), max_length=255)
    crypto_settings = CharField(verbose_name=_(
        "Настройки шифрования"), max_length=255)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = "Мастер пароль"
        verbose_name_plural = "Мастер пароли"
