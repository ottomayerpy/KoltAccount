from core.baseapp.models import BaseModel, UserModel
from django.db.models import CASCADE, DateTimeField, ForeignKey, TextField
from django.utils.translation import gettext_lazy as _


class Donation(BaseModel):
    """ Пожертвования """
    user = ForeignKey(
        UserModel, verbose_name=_("Пользователь"), on_delete=CASCADE)
    timestamp = DateTimeField(
        verbose_name=_("Создано"), auto_now=False, auto_now_add=True)
    data = TextField(verbose_name=_("Данные платежа"))

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = "Пожертвование"
        verbose_name_plural = "Пожертвования"
