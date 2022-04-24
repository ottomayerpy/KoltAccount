from django.db import models


class SiteSetting(models.Model):
    """ Настройки сайта """
    name = models.CharField('Название', max_length=255)
    value = models.CharField('Значение', max_length=255)

    def __str__(self):
        return f'{self.name} ({self.value})'

    class Meta:
        verbose_name = 'Настройка сайта'
        verbose_name_plural = 'Настройки сайта'
