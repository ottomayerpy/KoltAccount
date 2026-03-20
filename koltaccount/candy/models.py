from baseapp.models import BaseModel, UserModel
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import CASCADE, CharField, ForeignKey, JSONField, OneToOneField
from django.utils.translation import gettext_lazy as _


class Candy(BaseModel):
    """Конфетки пользователя"""

    user = ForeignKey(
        UserModel,
        verbose_name=_("Пользователь"),
        on_delete=CASCADE,
        related_name="candies",  # user.candies.all()
    )
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
    crypto_settings = JSONField(
        verbose_name=_("Значение"),
        default=dict,
        blank=True,
        encoder=DjangoJSONEncoder,
        help_text=_("Значение настройки в JSON формате"),
    )

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = "Мастер пароль"
        verbose_name_plural = "Мастер пароли"
