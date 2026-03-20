from baseapp.models import BaseModel, UserModel
from django.db.models import CASCADE, CharField, ForeignKey, OneToOneField
from django.utils.translation import gettext_lazy as _


class Candy(BaseModel):
    """Конфетки пользователя"""

    user = ForeignKey(UserModel, verbose_name=_("Пользователь"), on_delete=CASCADE)
    site = CharField(verbose_name=_("Сайт"), max_length=255)
    description = CharField(verbose_name=_("Описание"), max_length=255)
    login = CharField(verbose_name=_("Логин"), max_length=255)
    password = CharField(verbose_name=_("Пароль"), max_length=255)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = "Конфетка"
        verbose_name_plural = "Конфетки"


class MasterPassword(BaseModel):
    """Мастер пароль пользователя"""

    user = OneToOneField(UserModel, verbose_name=_("Пользователь"), on_delete=CASCADE)
    password = CharField(verbose_name=_("Пароль"), max_length=255)
    # TODO: CharField не подходит
    crypto_settings = CharField(verbose_name=_("Настройки шифрования"), max_length=255)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = "Мастер пароль"
        verbose_name_plural = "Мастер пароли"
