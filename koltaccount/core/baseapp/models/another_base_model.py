from uuid import uuid4

from django.db.models import Model, UUIDField
from django.utils.translation import gettext_lazy as _


class AnotherBaseModel(Model):
    """ Основной базовый класс моделей приложения """

    id = UUIDField(primary_key=True, default=uuid4,
                   editable=False, verbose_name=_("UUID"))

    class Meta:
        abstract = True
