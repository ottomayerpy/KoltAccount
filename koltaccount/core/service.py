import re

from django.contrib.auth.models import User
from django.http import JsonResponse
from .models import CryptoSetting


def is_ajax(request):
    return request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'


def get_crypto_settings(user: User):
    """ Возвращает настройки шифрования """
    cs = CryptoSetting.objects.get(user=user)
    return {
        'key': {
            'size': cs.key.size,
            'division': cs.key.devision
        },
        'iv': {
            'size': cs.iv.size,
            'division': cs.iv.devision
        },
        'salt': {
            'size': cs.salt.size,
            'division': cs.salt.devision
        },
        'iterations': cs.iterations
    }


def check_username(username: str) -> dict:
    """ Проверяет существование имени в БД """
    is_exist_username = False

    if User.objects.filter(username=username).exists():
        is_exist_username = True

    return {
        'status': 'success',
        'is_exist_username': is_exist_username
    }


def check_if_password_correct(password1: str, password2: str) -> str:
    """ Проверка корректности пароля """
    if password1 != password2:
        return 'broken rule [pass == pass2]'
    if len(password1) < 8:
        return 'broken rule [len > 8]'
    if re.search('[a-z]', password1) is None:
        return 'broken rule [a-z]'
    if re.search('[A-Z]', password1) is None:
        return 'broken rule [A-Z]'
    if re.search('[0-9]', password1) is None:
        return 'broken rule [0-9]'

    return 'success'


def json_response(data: dict, status=200) -> JsonResponse:
    """ Возвращает JSON с правильными HTTP заголовками и в читаемом
    в браузере виде в случае с кириллицей """
    return JsonResponse(
        data=data,
        status=status,
        safe=not isinstance(data, list),
        json_dumps_params={
            'ensure_ascii': False
        }
    )
