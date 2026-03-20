from datetime import datetime
from uuid import uuid7

from django.contrib.auth.models import AbstractUser
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    BooleanField,
    CharField,
    DateTimeField,
    JSONField,
    Model,
    TextField,
    UUIDField,
)
from django.utils.translation import gettext_lazy as _


class BaseModel(Model):
    """Базовый класс с UUIDv7 и полем обновления"""

    id = UUIDField(
        primary_key=True, default=uuid7, editable=False, verbose_name=_("UUID")
    )

    updated_at = DateTimeField(auto_now=True, verbose_name=_("Обновлено"))

    class Meta:
        abstract = True

    def get_created_at(self):
        """Извлечь время создания из UUIDv7"""
        # UUIDv7 хранит время в первых 48 битах (смещение 80)
        timestamp_ms = self.id.int >> 80
        return datetime.fromtimestamp(timestamp_ms / 1000)

    @property
    def created_at(self):
        """Свойство для совместимости с TimeStampedModel"""
        return self.get_created_at()


class UserModel(BaseModel, AbstractUser):
    is_active_email = BooleanField(default=False, verbose_name=_("Подтверждение почты"))

    def __str__(self):
        return self.username


class SiteSetting(BaseModel):
    """Настройки сайта с JSON полем"""

    name = CharField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name=_("Название"),
        help_text=_("Имя настройки"),
    )

    value = JSONField(
        verbose_name=_("Значение"),
        default=dict,
        blank=True,
        encoder=DjangoJSONEncoder,
        help_text=_("Значение настройки в JSON формате"),
    )

    description = TextField(
        verbose_name=_("Описание"),
        blank=True,
        help_text=_("Описание назначения настройки"),
    )

    class Meta:
        verbose_name = _("Настройка сайта")
        verbose_name_plural = _("Настройки сайта")
        ordering = ["name"]

    def __str__(self):
        return self.name

    @classmethod
    def get(cls, name, default=None):
        """Получить значение настройки по имени"""
        try:
            return cls.objects.get(name=name).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set(cls, name, value, description=""):
        """Создать или обновить настройку"""
        obj, created = cls.objects.update_or_create(
            name=name,
            defaults={
                "value": value,
                "description": description or cls.get_default_description(name),
            },
        )
        return obj

    @classmethod
    def get_bool(cls, name, default=False):
        """Получить булево значение"""
        value = cls.get(name, default)
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            return value.lower() in ("true", "1", "yes", "on", "да")
        return bool(value)

    @classmethod
    def get_int(cls, name, default=0):
        """Получить целое число"""
        value = cls.get(name, default)
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @classmethod
    def get_str(cls, name, default=""):
        """Получить строку"""
        value = cls.get(name, default)
        return str(value) if value is not None else default

    @classmethod
    def get_list(cls, name, default=None):
        """Получить список"""
        value = cls.get(name, default or [])
        if isinstance(value, list):
            return value
        if isinstance(value, (str, int, float, bool)):
            return [value]
        return []

    @classmethod
    def toggle(cls, name, default=False, description=""):
        """
        Переключить булево значение настройки

        Args:
            name: имя настройки
            default: значение по умолчанию, если настройки нет
            description: описание (используется при создании)

        Returns:
            tuple: (новое значение, создана ли настройка)
        """
        try:
            # Пытаемся получить существующую настройку
            obj = cls.objects.get(name=name)
            # Инвертируем текущее значение
            new_value = not bool(obj.value)
            obj.value = new_value
            obj.save()
            return obj.value, False

        except cls.DoesNotExist:
            # Создаем новую с инвертированным default
            new_value = not bool(default)
            obj = cls.objects.create(
                name=name,
                value=new_value,
                description=description or cls.get_default_description(name),
            )
            return obj.value, True

    @classmethod
    def get_default_description(cls, name):
        """Получить описание по умолчанию для настройки"""
        descriptions = {
            "site_in_service": "Режим технического обслуживания сайта",
            "cpu_temp_path": "Путь до файла с значением температуры процессора",
        }
        return descriptions.get(name, "")
