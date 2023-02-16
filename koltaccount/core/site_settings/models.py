from core.baseapp.models import BaseModel
from django.db.models import CharField
from django.utils.translation import gettext_lazy as _


class SiteSetting(BaseModel):
    """ Настройки сайта """
    name = CharField(verbose_name=_("Название"), max_length=255)
    value = CharField(verbose_name=_("Значение"), max_length=255)

    def __str__(self):
        return f"{self.name} ({self.value})"

    class Meta:
        verbose_name = "Настройка сайта"
        verbose_name_plural = "Настройки сайта"
