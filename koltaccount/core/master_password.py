import json

from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User

from .models import Account, MasterPassword


def master_password_reset(user: User, password: str) -> bool:
    """ Сброс мастер пароля """
    if check_password(password, user.password):
        master_password = MasterPassword.objects.get(user=user)
        master_password.delete()
        accounts = Account.objects.filter(user=user)
        accounts.delete()
        return True
    return False


def change_or_create_master_password(sites: str, descriptions: str, logins: str, passwords: str,
                                     new_master_password: str, user: User) -> dict:
    """ Изменяет мастер пароль """
    master_password, is_created = MasterPassword.objects.get_or_create(
        user=user,
        defaults={
            'password': new_master_password
        }
    )

    # Если False значит объект найден, и не был создан, а это значит, что
    # существуют записанные аккаунты и их можно переписывать
    if not is_created:
        sites = json.loads(sites)
        descriptions = json.loads(descriptions)
        logins = json.loads(logins)
        passwords = json.loads(passwords)

        # Перезаписываем все аккаунты на новые значения
        account = Account.objects.filter(user=user)

        for item in account:
            item.site = sites[str(item.id)]
            item.description = descriptions[str(item.id)]
            item.login = logins[str(item.id)]
            item.password = passwords[str(item.id)]
            item.save()

        master_password.password = new_master_password
        master_password.save()

    return {
        'status': 'success'
    }


def get_master_password(user: User) -> str:
    """ Возвращает мастер пароль """
    try:
        master_password = MasterPassword.objects.get(user=user)
        return {
            'status': 'success',
            'result': master_password.password
        }
    except MasterPassword.DoesNotExist:
        return {
            'status': 'error',
            'result': 'doesnotexist'
        }
