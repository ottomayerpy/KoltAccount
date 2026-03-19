import json

from candy import service
from candy.models import Candy, MasterPassword
from core.middleware import is_ajax
from core.service import get_base_context, json_response
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from koltaccount.settings import CANDIES_LIMIT

from .forms import MasterPasswordResetForm


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
@is_ajax
def delete_candy(request):
    """Удаляет конфетку"""
    candy_id = request.POST.get("candy_id")

    if not candy_id:
        return json_response({"result": "missing_candy_id"}, 400)

    if not Candy.objects.filter(id=candy_id).delete()[0]:
        return json_response({"result": "doesnotexist"}, 404)

    return HttpResponse(status=204)


@is_ajax
def change_candy(request):
    """Изменяет конфетку"""
    candy_id = request.POST.get("candy_id")

    if not candy_id:
        return json_response({"result": "missing_candy_id"}, 400)

    try:
        candy = Candy.objects.get(id=candy_id)
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
        except Exception as e:
            errors.append({"index": idx, "error": str(e)})

    return json_response(
        {
            "imported": imported,
            "errors": errors,
            "total": len(data),
            "success_count": len(imported),
            "error_count": len(errors),
        },
        207 if errors else 201,
    )


@is_ajax
def get_master_password(request):
    """Возвращает мастер пароль"""
    answer = service.get_master_password(user=request.user)
    return json_response(answer)


@is_ajax
def change_or_create_master_password(request):
    """Изменяет или создает мастер пароль"""
    sites = request.POST.get("sites", None)
    descriptions = request.POST.get("descriptions", None)
    logins = request.POST.get("logins", None)
    passwords = request.POST.get("passwords", None)
    new_master_password = request.POST.get("new_master_password", None)
    new_crypto_settings = request.POST.get("new_cs", None)

    answer = service.change_or_create_master_password(
        sites=sites,
        descriptions=descriptions,
        logins=logins,
        passwords=passwords,
        new_master_password=new_master_password,
        new_crypto_settings=new_crypto_settings,
        user=request.user,
    )
    return json_response(answer)


def master_password_reset(request):
    """Сброс мастер пароля"""
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = get_base_context(
        {
            "title": "Сброс мастер пароля",
            "form": MasterPasswordResetForm,
            "form_message": "None",
            "master_password": False,
        }
    )

    if MasterPassword.objects.filter(user=request.user).exists():
        context.update({"master_password": True})

    if request.method == "POST":
        if service.master_password_reset(request) is not None:
            return redirect(reverse("home_url"))

        context.update({"form_message": "Password is not valid"})
    return render(request, "registration/master_password_reset.html", context)
