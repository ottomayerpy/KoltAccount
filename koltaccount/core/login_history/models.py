from django.contrib.auth.models import User
from django.db import models


class LoginHistory(models.Model):
    """ История авторизаций """
    user = models.ForeignKey(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    ip = models.GenericIPAddressField(verbose_name='IP адрес')
    system = models.CharField('Операционная система', max_length=255)
    location = models.CharField('Локация', max_length=255)
    browser = models.CharField('Браузер', max_length=255)
    date = models.DateTimeField(
        'Дата', auto_now=False, auto_now_add=True)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'История входа в систему'
        verbose_name_plural = 'Истории входа в систему'
