from django.db.models import Model, DateTimeField
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(Model):
    """ Абстрактный класс для моделей объектов,
        которым необходимы временные отметки """

    created_time = DateTimeField(
        verbose_name=_("Создано"), auto_now_add=True)
    modified_time = DateTimeField(
        verbose_name=_("Модифицировано"), auto_now=True)

    class Meta:
        abstract = True
