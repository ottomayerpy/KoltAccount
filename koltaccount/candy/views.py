import json
import traceback

from axes.decorators import axes_dispatch
from baseapp.logger import write_error_to_log_file
from baseapp.middleware import is_ajax
from baseapp.utils import get_base_context, json_response
from candy.models import Candy, MasterPassword
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from koltaccount.settings import (
    CANDIES_LIMIT,
    CRYPT_STR_AES_MODE,
    CRYPT_STR_AES_PADDING,
    DECRYPT_MP_SUBSTRING_END,
    DECRYPT_MP_SUBSTRING_START,
    DECRYPT_STR_SUBSTRING_END,
    DECRYPT_STR_SUBSTRING_START,
)

from .forms import MasterPasswordResetForm


@require_POST
@login_required
@is_ajax
def create_candy(request):
    """Создает конфетку"""
    site, login, password = (
        request.POST.get("site"),
        request.POST.get("login"),
        request.POST.get("password"),
    )

    if not all([site, login, password]):
        return json_response({"result": "missing_fields"}, 400)

    if Candy.objects.filter(user=request.user).count() >= CANDIES_LIMIT:
        return json_response({"result": "limit_reached"}, 400)

    candy = Candy.objects.create(
        user=request.user,
        site=site,
        login=login,
        password=password,
        description=request.POST.get("description", ""),
    )

    return json_response({"candy_id": candy.id}, 201)


@require_POST
@login_required
@is_ajax
def delete_candy(request):
    """Удаляет конфетку"""
    candy_id = request.POST.get("candy_id")

    if not candy_id:
        return json_response({"result": "missing_candy_id"}, 400)

    if not Candy.objects.filter(id=candy_id, user=request.user).delete()[0]:
        return json_response({"result": "doesnotexist"}, 404)

    return HttpResponse(status=204)


@require_POST
@login_required
@is_ajax
def clear_all_candies(request):
    """
    Очистить все конфетки пользователя

    Returns:
        200: все конфетки удалены
        404: нет конфеток
    """
    deleted_count, _ = Candy.objects.filter(user=request.user).delete()

    if deleted_count == 0:
        return HttpResponse(status=404)

    return HttpResponse(status=204)


@require_POST
@login_required
@is_ajax
def change_candy(request):
    """Изменяет конфетку"""
    candy_id = request.POST.get("candy_id")

    if not candy_id:
        return json_response({"result": "missing_candy_id"}, 400)

    try:
        candy = Candy.objects.get(id=candy_id, user=request.user)
    except Candy.DoesNotExist:
        return json_response({"result": "doesnotexist"}, 404)

    # Обновляем только переданные поля
    if site := request.POST.get("site"):
        candy.site = site
    if description := request.POST.get("description"):
        candy.description = description
    if new_login := request.POST.get("new_login"):
        candy.login = new_login
    if new_password := request.POST.get("new_password"):
        candy.password = new_password

    candy.save()

    return HttpResponse(status=204)


@require_POST
@login_required
@is_ajax
def import_candies(request):
    """Массовый импорт конфеток"""
    try:
        data = json.loads(request.POST.get("candies", "{}"))
    except json.JSONDecodeError:
        return json_response({"result": "invalid_json"}, 400)

    if not isinstance(data, list):
        return json_response({"result": "invalid_format"}, 400)

    # Проверка лимита
    current_count = Candy.objects.filter(user=request.user).count()
    if current_count + len(data) > CANDIES_LIMIT:
        return json_response({"result": "limit_reached"}, 422)

    imported = []
    errors = []

    for idx, item in enumerate(data):
        try:
            candy = Candy.objects.create(
                user=request.user,
                site=item.get("site"),
                description=item.get("description", ""),
                login=item.get("login"),
                password=item.get("password"),
            )
            imported.append({"index": idx, "id": candy.id})
        except Exception:
            write_error_to_log_file("ERROR", request.user, traceback.format_exc())
            errors.append({"index": idx})

    return json_response(
        {
            "imported": imported,
            "total": len(data),
            "success_count": len(imported),
            "error_count": len(errors),
        },
        207 if errors else 201,
    )


@require_GET
@login_required
@is_ajax
def get_master_password(request):
    """Возвращает мастер пароль"""

    # Настройки по умолчанию
    default_crypto_settings = json.dumps(
        {
            "DECRYPT_SUBSTRING": {
                "mp": {
                    "start": DECRYPT_MP_SUBSTRING_START,
                    "end": DECRYPT_MP_SUBSTRING_END,
                },
                "str": {
                    "start": DECRYPT_STR_SUBSTRING_START,
                    "end": DECRYPT_STR_SUBSTRING_END,
                },
            },
            "CRYPT_STR_AES": {
                "mode": CRYPT_STR_AES_MODE,
                "padding": CRYPT_STR_AES_PADDING,
            },
        }
    )

    try:
        master_password = MasterPassword.objects.get(user=request.user)
        return json_response(
            {
                "password": master_password.password,
                "crypto_settings": master_password.crypto_settings,
                "default_crypto_settings": default_crypto_settings,
            },
            200,
        )
    except MasterPassword.DoesNotExist:
        return json_response(
            {
                "result": "doesnotexist",
                "default_crypto_settings": default_crypto_settings,
            },
            404,
        )


@require_POST
@login_required
@is_ajax
def save_master_password(request):
    """Создает или обновляет мастер-пароль"""
    master, created = MasterPassword.objects.get_or_create(
        user=request.user,
        defaults={
            "password": request.POST["new_master_password"],
            "crypto_settings": request.POST["new_cs"],
        },
    )

    # Перешифровываем существующие конфетки если они есть
    if Candy.objects.filter(user=request.user).exists():
        sites = json.loads(request.POST["sites"])
        desc = json.loads(request.POST["descriptions"])
        logins = json.loads(request.POST["logins"])
        passwords = json.loads(request.POST["passwords"])

        for candy in Candy.objects.filter(user=request.user):
            candy.site = sites[str(candy.id)]
            candy.description = desc[str(candy.id)]
            candy.login = logins[str(candy.id)]
            candy.password = passwords[str(candy.id)]
            candy.save()

    # Обновляем существующий мастер-пароль
    if not created:
        master.password = request.POST["new_master_password"]
        master.crypto_settings = request.POST["new_cs"]
        master.save()

    return HttpResponse(status=204)


@login_required
@axes_dispatch
def master_password_reset(request):
    """Сброс мастер пароля"""
    context = get_base_context(
        {
            "title": "Сброс мастер пароля",
            "form": MasterPasswordResetForm,
            "form_message": None,
            "has_master_password": MasterPassword.objects.filter(
                user=request.user
            ).exists(),
        }
    )

    if request.method != "POST":
        return render(request, "passwords/master_password_reset.html", context)

    # Обработка POST запроса
    password = request.POST.get("password")

    if not check_password(password, request.user.password):
        context["form_message"] = "Password is not valid"
        return render(request, "passwords/master_password_reset.html", context)

    # Удаляем все конфетки пользователя
    Candy.objects.filter(user=request.user).delete()

    # Удаляем мастер-пароль
    MasterPassword.objects.filter(user=request.user).delete()

    return redirect(reverse("home_url"))
