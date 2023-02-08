from django.contrib.auth.models import User
from django.db import models


class MasterPassword(models.Model):
    """ Мастер пароль пользователя """
    user = models.OneToOneField(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    password = models.CharField('Пароль', max_length=255)
    crypto_settings = models.CharField('Настройки шифрования', max_length=255)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Мастер пароль'
        verbose_name_plural = 'Мастер пароли'
