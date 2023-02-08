import json

from core.accounts.models import Account
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User
from koltaccount.settings import (CRYPT_STR_AES_MODE,
                                  CRYPT_STR_AES_PADDING,
                                  DECRYPT_MP_SUBSTRING_END,
                                  DECRYPT_MP_SUBSTRING_START,
                                  DECRYPT_STR_SUBSTRING_END,
                                  DECRYPT_STR_SUBSTRING_START)

from .models import MasterPassword


def master_password_reset(request) -> tuple or None:
    """ Сброс мастер пароля, удаляет запись мастер
        пароля пользователя и все записи его аккаунтов

    Args:
        request (Request): Запрос

    Returns:
        tuple or None: Вернет словарь с удаленной записью
                       мастер пароля в случае успеха, или
                       вернет None в случае неудачной проверки
                       пароля учетной записи пользователя
    """
    password = request.POST.get("password")
    if check_password(password, request.user.password):
        Account.objects.filter(user=request.user).delete()
        return MasterPassword.objects.get(user=request.user).delete()


def change_or_create_master_password(sites: str, descriptions: str, logins: str, passwords: str,
                                     new_master_password: str, new_crypto_settings: str, user: User) -> None:
    """ Изменяет мастер пароль """
    master_password, is_created = MasterPassword.objects.get_or_create(
        user=user,
        defaults={
            'password': new_master_password,
            'crypto_settings': new_crypto_settings
        }
    )

    account = Account.objects.filter(user=user)
    if account.count() > 0:
        sites = json.loads(sites)
        descriptions = json.loads(descriptions)
        logins = json.loads(logins)
        passwords = json.loads(passwords)

        for item in account:
            item.site = sites[str(item.id)]
            item.description = descriptions[str(item.id)]
            item.login = logins[str(item.id)]
            item.password = passwords[str(item.id)]
            item.save()

    if not is_created:
        master_password.password = new_master_password
        master_password.crypto_settings = new_crypto_settings
        master_password.save()


def get_master_password(user: User) -> str:
    """ Возвращает мастер пароль """
    default_cs = {
        'default_cs': json.dumps({
            'DECRYPT_SUBSTRING': {
                'mp': {
                    'start': DECRYPT_MP_SUBSTRING_START,
                    'end': DECRYPT_MP_SUBSTRING_END
                },
                'str': {
                    'start': DECRYPT_STR_SUBSTRING_START,
                    'end': DECRYPT_STR_SUBSTRING_END
                }
            },
            'CRYPT_STR_AES': {
                'mode': CRYPT_STR_AES_MODE,
                'padding': CRYPT_STR_AES_PADDING
            }
        })
    }
    try:
        master_password = MasterPassword.objects.get(user=user)
        return {
            'status': 'success',
            'result': master_password.password,
            'cs': master_password.crypto_settings,
            'default_cs': default_cs['default_cs']
        }
    except MasterPassword.DoesNotExist:
        return {
            'status': 'error',
            'result': 'doesnotexist',
            'default_cs': default_cs['default_cs']
        }
