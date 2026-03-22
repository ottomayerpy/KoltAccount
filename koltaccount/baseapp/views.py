import json
import locale
import os

from axes.models import AccessAttempt, AccessLog
from baseapp.forms import KoltAuthenticationForm, KoltPasswordResetForm, RegisterForm
from baseapp.logger import get_logs
from baseapp.middleware import is_ajax, is_staff
from baseapp.models import SiteSetting, UserModel
from baseapp.utils import (
    account_activation_token,
    check_if_password_correct,
    check_username_db,
    get_base_context,
    json_response,
)
from candy.models import Candy
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import PasswordResetView
from django.contrib.sites.models import Site
from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.http import require_GET, require_POST
from django.views.generic import TemplateView
from mailer.utils import send_email

from koltaccount.settings import SITE_PROTOCOL, SUPPORT_EMAIL

# Русская локализация для даты
locale.setlocale(locale.LC_ALL, "")


@require_GET
@is_staff
@is_ajax
def get_cpu_temp(request) -> HttpResponse:
    cpu_temp_path = SiteSetting.get_str("cpu_temp_path")
    if cpu_temp_path:
        if not os.path.exists(cpu_temp_path):
            return HttpResponseServerError(
                "Нет такого файла который указан в cpu_temp_path"
            )
        with open(cpu_temp_path) as f:
            temp = round(int(f.read()) / 1000, 1)
            return HttpResponse(f"{temp}°")
    return HttpResponseServerError("Не установлена настройка сайта cpu_temp_path")


@require_POST
@is_staff
def save_cpu_temp_path(request):
    """
    Сохраняет путь к датчику температуры CPU
    """
    try:
        data = json.loads(request.body)
        path = data.get("cpu_temp_path", "").strip()

        if not path:
            return JsonResponse({"error": "Путь не может быть пустым"}, status=400)

        # Сохраняем настройку
        SiteSetting.set("cpu_temp_path", path, "Путь к датчику температуры CPU")

        return json_response(path)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Неверный формат данных"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def index(request):
    """Главная страница"""
    context = get_base_context({"title": "KoltAccount"})

    if not request.user.is_authenticated:
        context.update(
            {"title": "Менеджер паролей KoltAccount: хранение аккаунтов в облаке"}
        )
        return render(request, "landing.html", context)

    context.update(
        {
            "accounts": Candy.objects.filter(user=request.user),
        }
    )

    return render(request, "home.html", context)


@is_staff
def logs(request):
    """Страница с отображением последних логов"""
    context = get_base_context({"title": "Логи", "logs": get_logs()})
    return render(request, "logs.html", context)


def noscript(request):
    """Страница отображаемая если пользователь отключит javascript"""
    context = get_base_context({"title": "Включите javascript!"})
    return render(request, "noscript.html", context)


@login_required
def lk(request):
    """Личный кабинет пользователя"""

    # Получаем историю входов из AccessLog
    login_history = AccessLog.objects.filter(username=request.user.username).order_by(
        "-attempt_time"
    )[:50]

    # Получаем неудачные попытки из AccessAttempt
    failed_attempts = AccessAttempt.objects.filter(
        username=request.user.username
    ).order_by("-attempt_time")[:20]

    # Объединяем и сортируем
    combined_history = []

    for log in login_history:
        combined_history.append(
            {
                "type": "log",
                "data": log,
                "is_active": log.logout_time is None,
                "time": log.attempt_time,
            }
        )

    for attempt in failed_attempts:
        combined_history.append(
            {
                "type": "attempt",
                "data": attempt,
                "is_active": False,
                "time": attempt.attempt_time,
            }
        )

    # Сортируем по времени
    combined_history.sort(key=lambda x: x["time"], reverse=True)

    context = get_base_context(
        {
            "title": "Личный кабинет",
            "login_history": combined_history[:50],  # Ограничим 50 записями
            "cpu_temp_path": SiteSetting.get_str("cpu_temp_path"),
        }
    )
    return render(request, "lk.html", context)


def support(request):
    context = get_base_context({"title": "Помощь и поддержка"})
    return render(request, "support/support.html", context)


def protection(request):
    context = get_base_context({"title": "Защита данных"})
    return render(request, "support/protection.html", context)


def privacy(request):
    current_site = Site.objects.get_current()
    context = get_base_context(
        {
            "title": "Политика конфиденциальности",
            "face": "Колтман Никита Николаевич",
            "protocol": f"{SITE_PROTOCOL}://",
            "domain": current_site.domain,
            "email": SUPPORT_EMAIL,
        }
    )
    return render(request, "support/privacy.html", context)


def terms(request):
    context = get_base_context({"title": "Пользовательское соглашение"})
    return render(request, "support/terms.html", context)


@require_POST
@is_staff
@is_ajax
def site_in_service_toggle(request):
    """Переключить режим обслуживания сайта"""
    changed, _ = SiteSetting.toggle("site_in_service")

    if not changed:
        return HttpResponse(status=404)

    return HttpResponse(status=204)


@require_POST
@is_ajax
def check_username(request):
    """Проверяет существование имени в БД"""
    return json_response(check_username_db(request))


def kolt_login(request):
    """Авторизация пользователей"""
    if request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = get_base_context(
        {"title": "Авторизация", "form": KoltAuthenticationForm, "form_message": "None"}
    )

    if request.method == "POST":
        username = request.POST.get("username", None)
        password = request.POST.get("password", None)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect(reverse("home_url"))

        context.update({"form_message": "Login error"})
    return render(request, "registration/login.html", context)


class KoltPasswordResetView(PasswordResetView):
    """Переопределение формы сброса пароля для представления"""

    form_class = KoltPasswordResetForm


class RegisterView(TemplateView):
    """Регистрация пользователей"""

    def dispatch(self, request, *args, **kwargs):
        """Регистрация"""
        if request.user.is_authenticated:
            return redirect(reverse("home_url"))

        context = get_base_context(
            {"title": "Регистрация", "form": RegisterForm, "form_message": "None"}
        )

        if request.method == "POST":
            username = request.POST.get("username")
            email = request.POST.get("email")
            password1 = request.POST.get("password1")
            password2 = request.POST.get("password2")

            answer = check_if_password_correct(password1, password2)
            if answer is None:
                try:
                    user = UserModel.objects.create_user(
                        username=username, email=email, password=password1
                    )

                    send_email(
                        user=user,
                        email=email,
                        subject="Добро пожаловать в KoltAccount",
                        template="email/registration_email_confirm_email.html",
                        context={
                            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                            "token": account_activation_token.make_token(user),
                        },
                    )

                    return redirect(reverse("kolt_login"))
                except Exception as err:
                    if str(err) == "UNIQUE constraint failed: auth_user.username":
                        context.update(
                            {
                                "form_message": "username error",
                                "username": username,
                                "email": email,
                            }
                        )
                    else:
                        raise
            else:
                context.update(
                    {"form_message": answer, "username": username, "email": email}
                )
        return render(request, "registration/register.html", context)
