import locale

import core.service as core_service
from core.accounts import service as accounts_service
from core.accounts.models import Account
from core.crypto import master_password
from core.crypto.models import MasterPassword
from core.donation import yandex_donations
from core.donation.models import Donation
from core.email_service import activate_email as act_email
from core.email_service import hiding_email, send_email
from core.logger_service import get_logs
from core.middleware import is_ajax
from core.site_settings import service as site_settings_service
from core.site_settings.models import SiteSetting
from core.token_generator import account_activation_token
from django.contrib.auth import authenticate, login
from core.baseapp.models import UserModel
from django.contrib.auth.views import PasswordResetView
from django.contrib.sites.models import Site
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseServerError
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from koltaccount.settings import (SITE_PROTOCOL, STATIC_VERSION, SUPPORT_EMAIL,
                                  YANDEX_MONEY_DEFAULT_SUM,
                                  YANDEX_MONEY_WALLET_NUMBER)

from .forms import (EmailChangeForm, KoltAuthenticationForm,
                    KoltPasswordResetForm, MasterPasswordResetForm,
                    RegisterForm)

# Русская локализация для даты
locale.setlocale(locale.LC_ALL, "")


def check_email_template(request):
    """ Текстирование шаблона для почты """
    if not request.user.is_staff:
        return HttpResponseForbidden(render(request, "403.html"))

    context = {
        "username": request.user.username,
        "protocol": SITE_PROTOCOL,
        "domain": "koltaccount.ru",
        "uid": "MQ%5B0-9A-Za-z_%5",
        "token": "-z%5D%7B1,13%7D-%5B0-9A-Za-z%5D%",
        "email": hiding_email(request.user.email)
    }

    # Шаблоны
    templates = [
        "email/registration_email_confirm_email.html",
        "email/email_change_notification_to_old_email.html",
        "email/email_change_email.html",
        "email/notification_ip_info_completed_requests_to_admin.html"
    ]

    return render(request, templates[0], context)


def get_cpu_temp(_) -> HttpResponse:
    cpu_temp = SiteSetting.objects.filter(name="cpu_temp_path").first()
    cpu_temp_path = cpu_temp.value if cpu_temp else False
    if cpu_temp_path:
        with open(cpu_temp_path) as f:
            temp = round(int(f.read()) / 1000, 1)
            return HttpResponse(f"{temp}°")
    return HttpResponseServerError("Не установлена настройка сайта cpu_temp_path")


def get_context(context: dict) -> dict:
    site_in_service = SiteSetting.objects.filter(name="site_in_service").first()

    base_context = {
        "site_in_service": site_in_service.value if site_in_service else False,
        "static_version": STATIC_VERSION
    }

    if context:
        base_context.update(context)
    return base_context


def index(request):
    """ Главная страница """
    context = get_context({"title": "KoltAccount (beta)"})

    if not request.user.is_authenticated:
        context.update({
            "title": "Менеджер паролей KoltAccount: хранение аккаунтов в облаке"
        })
        return render(request, "landing.html", context)

    context.update({
        "accounts": Account.objects.filter(user=request.user),
    })

    return render(request, "home.html", context)


def logs(request):
    """ Страница с отображением последних логов """
    if not request.user.is_staff:
        return HttpResponseForbidden(render(request, "403.html"))
    context = get_context({"title": "Логи", "logs": get_logs()})
    return render(request, "logs.html", context)


def noscript(request):
    """ Страница отображаемая если пользователь отключит javascript """
    context = get_context({"title": "Включите javascript!"})
    return render(request, "noscript.html", context)


def donation_notification(request):
    """ Уведомление о получении пожертвования """
    if request.method == "POST":
        if yandex_donations.create_donation(request.POST.dict()):
            return HttpResponse()
        return HttpResponseServerError()
    return HttpResponseForbidden(render(request, "403.html"))


def lk(request):
    """ Личный кабинет пользователя """
    context = get_context({
        "title": "Личный кабинет",
        # TODO Добавить историю входа из AXES
        "login_history": None, #LoginHistory.objects.filter(user=request.user).order_by("-date"),
        "donation": Donation.objects.filter(user=request.user).order_by("-timestamp"),
    })
    return render(request, "lk.html", context)


def support(request):
    context = get_context({"title": "Помощь и поддержка"})
    return render(request, "support/support.html", context)


def donation(request):
    context = get_context({
        "title": "Пожертвования",
        "wallet_number": YANDEX_MONEY_WALLET_NUMBER,
        "default_sum": YANDEX_MONEY_DEFAULT_SUM
    })
    return render(request, "support/donation.html", context)


def protection(request):
    context = get_context({"title": "Защита данных"})
    return render(request, "support/protection.html", context)


def privacy(request):
    current_site = Site.objects.get_current()
    context = get_context({
        "title": "Политика конфиденциальности",
        "face": "Колтманом Никитой Николаевичем",
        "protocol": f"{SITE_PROTOCOL}://",
        "domain": current_site.domain,
        "email": SUPPORT_EMAIL
    })
    return render(request, "support/privacy.html", context)


def terms(request):
    context = get_context({"title": "Пользовательское соглашение"})
    return render(request, "support/terms.html", context)


def email_change(request):
    """ Изменить адрес электронной почты """
    context = get_context({"title": "Изменить почтовый адрес", "form": EmailChangeForm})

    if request.method == "POST":
        email = request.POST.get("email")
        user = UserModel.objects.get(id=request.user.id)
        current_site = Site.objects.get_current()
        send_email(
            user=user,
            subject="Привязка email к аккаунту",
            template="email/email_change_email.html",
            context={
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "token": account_activation_token.make_token(user)
            },
            email=email
        )
        send_email(
            user=user,
            subject="Привязка email к аккаунту",
            template="email/email_change_notification_to_old_email.html",
            context={
                "email": hiding_email(email),
                "username": user.username,
                "domain": current_site.domain
            }
        )
        user.email = email
        user.is_active_email = False
        user.save()
        return redirect(reverse("email_change_done_url"))
    return render(request, "email/email_change_form.html", context)


def email_change_done(request):
    """ Страница которая говорит о том что письмо с
    инструкциями по изменению почтового адреса отправлено """
    context = get_context({"title": "Письмо с инструкциями по изменению почтового адреса отправлено"})
    return render(request, "email/email_change_done.html", context)


def email_change_complete(request):
    """ Страница которая говорит о том что
    изменение адреса почты завершено """
    context = get_context({"title": "Изменение адреса почты завершено"})
    return render(request, "email/email_change_complete.html", context)


def confirm_email_done(request):
    """ Страница которая говорит о том что
    отправленно письмо подтверждения почты после регистрации """
    context = get_context({"title": "Письмо отправленно"})
    return render(request, "email/confirm_email_done.html", context)


def confirm_email_complete(request):
    """ Страница которая говорит о том что
    пользователь успешно подтвердили почту после регистрации """
    valid = False

    if "valid" in request.session:
        valid = request.session["valid"]
        del request.session["valid"]

    context = get_context({"title": "Подтверждение почты", "valid": valid})
    return render(request, "email/confirm_email_complete.html", context)


def confirm_email(request):
    """ Отправка письма о подтверждении
    почты после регистрации """
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))
    send_email(
        user=request.user,
        subject="Добро пожаловать в KoltAccount",
        template="email/registration_email_confirm_email.html",
        context={
            "uid": urlsafe_base64_encode(force_bytes(request.user.pk)),
            "token": account_activation_token.make_token(request.user)
        }
    )
    return redirect(reverse("confirm_email_done_url"))


def activate_email(request, uidb64, token):
    """ Активация почты """
    if not request.user.is_authenticated:
        return redirect(reverse("kolt_login"))

    if act_email(uidb64, token):
        request.session["valid"] = True
    return redirect(reverse("confirm_email_complete_url"))


def master_password_reset(request):
    """ Сброс мастер пароля """
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = get_context({
        "title": "Сброс мастер пароля",
        "form": MasterPasswordResetForm,
        "form_message": "None",
        "master_password": False
    })

    if MasterPassword.objects.filter(user=request.user).exists():
        context.update({
            "master_password": True
        })

    if request.method == "POST":
        if master_password.master_password_reset(request) is not None:
            return redirect(reverse("home_url"))

        context.update({
            "form_message": "Password is not valid"
        })
    return render(request, "registration/master_password_reset.html", context)


@is_ajax
def site_in_service_switch(request):
    """ Закрыть сайт на техническое обслуживание """
    if request.user.is_staff:
        checked = request.POST.get("checked", None)
        answer = site_settings_service.site_in_service_switch(checked)
        return core_service.json_response(answer)
    return HttpResponseForbidden(render(request, "403.html"))


@is_ajax
def create_account(request):
    """ Создает аккаунт """

    site = request.POST.get("site", None)
    description = request.POST.get("description", None)
    _login = request.POST.get("login", None)
    password = request.POST.get("password", None)

    answer = accounts_service.create_account(
        site=site,
        description=description,
        login=_login,
        password=password,
        user=request.user
    )
    return core_service.json_response(answer)


@is_ajax
def delete_account(request):
    """ Удаляет аккаунт """
    account_id = request.POST.get("account_id", None)
    answer = accounts_service.delete_account(account_id)
    return core_service.json_response(answer)


@is_ajax
def change_info_account(request):
    """ Изменяет информацию об аккаунте """
    site = request.POST.get("site", None)
    description = request.POST.get("description", None)
    new_login = request.POST.get("new_login", None)
    new_password = request.POST.get("new_password", None)
    account_id = request.POST.get("account_id", None)

    answer = accounts_service.change_info_account(
        site=site,
        description=description,
        new_login=new_login,
        new_password=new_password,
        account_id=account_id
    )
    return core_service.json_response(answer)


@is_ajax
def change_or_create_master_password(request):
    """ Изменяет мастер пароль """
    sites = request.POST.get("sites", None)
    descriptions = request.POST.get("descriptions", None)
    logins = request.POST.get("logins", None)
    passwords = request.POST.get("passwords", None)
    new_master_password = request.POST.get("new_master_password", None)
    new_crypto_settings = request.POST.get("new_cs", None)

    answer = master_password.change_or_create_master_password(
        sites=sites,
        descriptions=descriptions,
        logins=logins,
        passwords=passwords,
        new_master_password=new_master_password,
        new_crypto_settings=new_crypto_settings,
        user=request.user
    )
    return core_service.json_response(answer)


@is_ajax
def check_username(request):
    """ Проверяет существование имени в БД """
    return core_service.json_response(core_service.check_username(request))


@is_ajax
def get_master_password(request):
    """ Возвращает мастер пароль """
    answer = master_password.get_master_password(user=request.user)
    return core_service.json_response(answer)


def kolt_login(request):
    """ Авторизация пользователей """
    if request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = get_context({
        "title": "Авторизация",
        "form": KoltAuthenticationForm,
        "form_message": "None"
    })

    if request.method == "POST":
        username = request.POST.get("username", None)
        password = request.POST.get("password", None)
        # system = request.POST.get("system", None)
        # browser = request.POST.get("browser", None)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            # nlh_thread = login_history_service.NewLoginHistory(
            #     user, request.META, system, browser)
            # nlh_thread.start()
            # nlh_thread.join(1.0)
            return redirect(reverse("home_url"))

        context.update({
            "form_message": "Login error"
        })
    return render(request, "registration/login.html", context)


class KoltPasswordResetView(PasswordResetView):
    """ Переопределение формы сброса пароля для представления """
    form_class = KoltPasswordResetForm


class RegisterView(TemplateView):
    """ Регистрация пользователей """

    def dispatch(self, request, *args, **kwargs):
        """ Регистрация """
        if request.user.is_authenticated:
            return redirect(reverse("home_url"))

        context = get_context({
            "title": "Регистрация",
            "form": RegisterForm,
            "form_message": "None"
        })

        if request.method == "POST":
            username = request.POST.get("username")
            email = request.POST.get("email")
            password1 = request.POST.get("password1")
            password2 = request.POST.get("password2")

            answer = core_service.check_if_password_correct(password1, password2)
            if answer is None:
                try:
                    user = UserModel.objects.create_user(
                        username=username,
                        email=email,
                        password=password1
                    )

                    send_email(
                        user=user,
                        email=email,
                        subject="Добро пожаловать в KoltAccount",
                        template="email/registration_email_confirm_email.html",
                        context={
                            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                            "token": account_activation_token.make_token(user)
                        }
                    )

                    return redirect(reverse("kolt_login"))
                except Exception as err:
                    if str(err) == "UNIQUE constraint failed: auth_user.username":
                        context.update({
                            "form_message": "username error",
                            "username": username,
                            "email": email
                        })
                    else:
                        raise
            else:
                context.update({
                    "form_message": answer,
                    "username": username,
                    "email": email
                })
        return render(request, "registration/register.html", context)
