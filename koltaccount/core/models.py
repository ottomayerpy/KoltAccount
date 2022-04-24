from random import randint

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from koltaccount.settings import CS_IV_ID, CS_KEY_ID, CS_SALT_ID


class Account(models.Model):
    """ Аккаунты пользователя """
    user = models.ForeignKey(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    site = models.CharField('Сайт', max_length=255)
    description = models.CharField('Описание', max_length=255)
    login = models.CharField('Логин', max_length=255)
    password = models.CharField('Пароль', max_length=255)
    updated = models.DateTimeField(
        'Обновлено', auto_now=True, auto_now_add=False)
    timestamp = models.DateTimeField(
        'Создано', auto_now=False, auto_now_add=True)

    def __str__(self):
        return f'{self.id} ({self.user.username})'

    class Meta:
        verbose_name = 'Аккаунт'
        verbose_name_plural = 'Аккаунты'
        ordering = ['-id', '-timestamp']


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


class Profile(models.Model):
    """ Профиль пользователя """
    user = models.OneToOneField(
        User, verbose_name='Пользователь', on_delete=models.CASCADE)
    is_active_email = models.BooleanField('Подтверждение почты', default=False)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'


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


class SiteSetting(models.Model):
    """ Настройки сайта """
    name = models.CharField('Название', max_length=255)
    value = models.CharField('Значение', max_length=255)

    def __str__(self):
        return f'{self.name} ({self.value})'

    class Meta:
        verbose_name = 'Настройка сайта'
        verbose_name_plural = 'Настройки сайта'


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

    class Meta:
        verbose_name = 'Настройка шифрования пользователя'
        verbose_name_plural = 'Настройки шифрования пользователей'


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


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        CryptoSetting.objects.create(
            user=instance,
            key=CryptoParam.objects.get(id=CS_KEY_ID),
            iv=CryptoParam.objects.get(id=CS_IV_ID),
            salt=CryptoParam.objects.get(id=CS_SALT_ID),
            iterations=randint(57, 7999),
        )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
