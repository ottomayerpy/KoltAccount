from random import randint

from django.contrib.auth.models import User
from django.db import models
from koltaccount.settings import CP_IV_ID, CP_KEY_ID, CP_SALT_ID


class CryptoParam(models.Model):
    """ Настройка отдельных параметров шифрования (например соли...) """
    size = models.IntegerField('Размер', default=256)
    devision = models.IntegerField('Делитель', default=8)

    def __str__(self):
        return f'{self.size}/{self.devision}'

    class Meta:
        verbose_name = 'Настройка отдельных параметров шифрования'
        verbose_name_plural = 'Настройки отдельных параметров шифрования'


class CryptoSetting(models.Model):
    """ Индивидуальные настройки шифрования пользователя """
    user = models.OneToOneField(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    key = models.ForeignKey(CryptoParam, verbose_name='Ключ',
                            related_name='CS_KEY', on_delete=models.CASCADE)
    iv = models.ForeignKey(CryptoParam, verbose_name='IV',
                           related_name='CS_IV', on_delete=models.CASCADE)
    salt = models.ForeignKey(CryptoParam, verbose_name='Соль',
                             related_name='CS_SALT', on_delete=models.CASCADE)
    iterations = models.IntegerField('Кол-во интераций', default=10)

    def __str__(self):
        return self.user.username

    def create(self, user):
        CryptoSetting.objects.create(
            user=user,
            key=CryptoParam.objects.get(id=CP_KEY_ID),
            iv=CryptoParam.objects.get(id=CP_IV_ID),
            salt=CryptoParam.objects.get(id=CP_SALT_ID),
            iterations=randint(57, 7999),
        )

    def change(self, user):
        cs = CryptoSetting.objects.get(user=user)
        cs.key = CryptoParam.objects.get(id=CP_KEY_ID)
        cs.iv = CryptoParam.objects.get(id=CP_IV_ID)
        cs.salt = CryptoParam.objects.get(id=CP_SALT_ID)
        cs.iterations = randint(57, 7999)
        cs.save()

    class Meta:
        verbose_name = 'Настройка шифрования пользователя'
        verbose_name_plural = 'Настройки шифрования пользователей'


class MasterPassword(models.Model):
    """ Мастер пароль пользователя """
    user = models.OneToOneField(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    password = models.CharField('Пароль', max_length=255)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Мастер пароль'
        verbose_name_plural = 'Мастер пароли'
