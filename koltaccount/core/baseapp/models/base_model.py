from uuid import uuid4

from core.baseapp.models.time_stamped_model import TimeStampedModel
from django.db.models import UUIDField
from django.utils.translation import gettext_lazy as _


class BaseModel(TimeStampedModel):
    """ Основной базовый класс моделей приложения """

    id = UUIDField(primary_key=True, default=uuid4,
                   editable=False, verbose_name=_("UUID"))

    class Meta:
        abstract = True
