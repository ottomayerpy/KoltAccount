import re

from core.baseapp.models import UserModel
from core.site_settings.models import SiteSetting
from django.http import JsonResponse

from koltaccount.settings import STATIC_VERSION


def check_username_db(request) -> dict:
    """Проверяет существование имени в БД"""
    username = request.POST.get("username", None)
    user = UserModel.objects.filter(username=username).exists()
    return {"user": "exist"} if user else {"user": None}


def check_if_password_correct(password: str, repeat_password: str):
    """Проверка корректности пароля"""
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
    """Возвращает JSON с правильными HTTP заголовками и в читаемом
    в браузере виде в случае с кириллицей"""
    return JsonResponse(
        data=data,
        status=status,
        safe=isinstance(data, dict),
        json_dumps_params={"ensure_ascii": False},
    )


def get_base_context(context: dict) -> dict:
    base_context = {
        "site_in_service": SiteSetting.get_bool("site_in_service"),
        "static_version": STATIC_VERSION,
    }

    if context:
        base_context.update(context)
    return base_context
