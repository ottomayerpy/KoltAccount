from django.contrib.auth.models import User
from django.db import models


class Donation(models.Model):
    """ Пожертвования """
    user = models.ForeignKey(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(
        'Создано', auto_now=False, auto_now_add=True)
    data = models.TextField('Данные платежа')

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Пожертвование'
        verbose_name_plural = 'Пожертвования'
