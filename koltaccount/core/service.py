import re

from django.http import JsonResponse

from core.baseapp.models import UserModel


def check_username(request) -> dict:
    """ Проверяет существование имени в БД """
    username = request.POST.get("username", None)
    user = UserModel.objects.filter(username=username).exists()
    return {"user": "exist"} if user else {"user": None}


def check_if_password_correct(password: str, repeat_password: str) -> str or None:
    """ Проверка корректности пароля """
    if password != repeat_password:
        return "broken rule [password == repeat_password]"
    elif len(password) < 8:
        return "broken rule [len > 8]"
    elif re.search("[a-z]", password) is None:
        return "broken rule [a-z]"
    elif re.search("[A-Z]", password) is None:
        return "broken rule [A-Z]"
    elif re.search("[0-9]", password) is None:
        return "broken rule [0-9]"


def json_response(data: dict = None, status=200) -> JsonResponse:
    """ Возвращает JSON с правильными HTTP заголовками и в читаемом
    в браузере виде в случае с кириллицей """
    return JsonResponse(
        data=data,
        status=status,
        safe=not isinstance(data, list),
        json_dumps_params={
            "ensure_ascii": False
        }
    )
