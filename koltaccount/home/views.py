import locale

from core import service as core_service
from core.accounts import service as accounts_service
from core.accounts.models import Account
from core.crypto import master_password
from core.crypto.models import MasterPassword
from core.donation import yandex_donations
from core.donation.models import Donation
from core.kolt_email import service as email_service
from core.kolt_logger import service as logger_service
from core.login_history import service as login_history_service
from core.login_history.models import LoginHistory
from core.site_settings import service as site_settings_service
from core.site_settings.models import SiteSetting
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib.auth.views import PasswordResetView
from django.contrib.sites.models import Site
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from koltaccount.settings import (SITE_PROTOCOL, STATIC_VERSION, SUPPORT_EMAIL,
                                  YANDEX_MONEY_DEFAULT_SUM,
                                  YANDEX_MONEY_WALLET_NUMBER)
from loguru import logger as log

from .forms import (EmailChangeForm, KoltAuthenticationForm,
                    KoltPasswordResetForm, MasterPasswordResetForm,
                    RegisterForm)

# Русская локализация для даты
locale.setlocale(locale.LC_ALL, "")


def check_email_template(request):
    """ Текстирование шаблона для почты """
    if not request.user.is_staff:
        return HttpResponseForbidden(render(request, '403.html'))

    context = {
        'username': request.user.username,
        'protocol': SITE_PROTOCOL,
        'domain': 'koltaccount.ru',
        'uid': 'MQ%5B0-9A-Za-z_%5',
        'token': '-z%5D%7B1,13%7D-%5B0-9A-Za-z%5D%',
        'email': email_service.hiding_email(request.user.email)
    }

    # Шаблоны
    templates = [
        'email/registration_email_confirm_email',
        'email/email_change_notification_to_old_email',
        'email/email_change_email',
        'email/notification_ip_info_completed_requests_to_admin'
    ]

    return render(request, templates[0], context)


def index(request):
    """ Главная страница """
    context = {
        'title': 'KoltAccount (beta)',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }

    if not request.user.is_authenticated:
        context.update({
            'title': 'Менеджер паролей KoltAccount: хранение аккаунтов в облаке'
        })
        return render(request, 'landing.html', context)

    context.update({
        'accounts': Account.objects.filter(user=request.user),
    })

    return render(request, 'home.html', context)


def logs(request):
    """ Страница с отображением последних логов """
    if not request.user.is_staff:
        return HttpResponseForbidden(render(request, '403.html'))

    context = {
        'title': 'Логи',
        'logs': logger_service.get_logs(),
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'logs.html', context)


def noscript(request):
    """ Страница отображаемая если пользователь отключит javascript """
    context = {
        'title': 'Включите javascript!',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'noscript.html', context)


@csrf_exempt  # TODO Че этот декоратор тут делает???
def donation_notification(request):
    """ Уведомление о получении пожертвования """
    if request.method == 'POST':
        if yandex_donations.create_donation(request.POST.dict()):
            return HttpResponse(status=200)
        return HttpResponse(status=500)
    return HttpResponseForbidden(render(request, '403.html'))


def lk(request):
    """ Личный кабинет пользователя """
    context = {
        'title': 'Личный кабинет',
        'login_history': LoginHistory.objects.filter(user=request.user).order_by('-date'),
        'donation': Donation.objects.filter(user=request.user).order_by('-timestamp'),
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'get_ip_info_system': SiteSetting.objects.get(name='get_ip_info_system').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'lk.html', context)


def support(request):
    context = {
        'title': 'Помощь и поддержка',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/support.html', context)


def donation(request):
    context = {
        'title': 'Пожертвования',
        'wallet_number': YANDEX_MONEY_WALLET_NUMBER,
        'default_sum': YANDEX_MONEY_DEFAULT_SUM,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/donation.html', context)


def protection(request):
    context = {
        'title': 'Защита данных',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/protection.html', context)


def privacy(request):
    current_site = Site.objects.get_current()
    context = {
        'title': 'Политика конфиденциальности',
        'face': 'Колтманом Никитой Николаевичем',
        'protocol': f'{SITE_PROTOCOL}://',
        'domain': current_site.domain,
        'email': SUPPORT_EMAIL,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/privacy.html', context)


def terms(request):
    context = {
        'title': 'Пользовательское соглашение',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/terms.html', context)


def email_change(request):
    """ Изменить адрес электронной почты """
    context = {
        'title': 'Изменить почтовый адрес',
        'form': EmailChangeForm,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }

    if request.method == 'POST':
        email = request.POST.get('email')
        user = User.objects.get(id=request.user.id)
        current_site = Site.objects.get_current()
        email_service.confirm_email(
            user=user,
            email=email,
            subject='Привязка email к аккаунту',
            template='email/email_change_email.html'
        )
        email_service.send_email(
            email=user.email,
            subject='Привязка email к аккаунту',
            template='email/email_change_notification_to_old_email.html',
            context={
                'email': email_service.hiding_email(email),
                'username': user.username,
                'domain': current_site.domain
            }
        )
        user.email = email
        user.profile.is_active_email = False
        user.save()
        return redirect(reverse("email_change_done_url"))
    return render(request, 'email/email_change_form.html', context)


def email_change_done(request):
    """ Страница которая говорит о том что письмо с
    инструкциями по изменению почтового адреса отправлено """
    context = {
        'title': 'Письмо с инструкциями по изменению почтового адреса отправлено',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'email/email_change_done.html', context)


def email_change_complete(request):
    """ Страница которая говорит о том что
    изменение адреса почты завершено """
    context = {
        'title': 'Изменение адреса почты завершено',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'email/email_change_complete.html', context)


def confirm_email_done(request):
    """ Страница которая говорит о том что
    отправленно письмо подтверждения почты после регистрации """
    context = {
        'title': 'Письмо отправленно',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'email/confirm_email_done.html', context)


def confirm_email_complete(request):
    """ Страница которая говорит о том что
    пользователь успешно подтвердили почту после регистрации """
    valid = False

    if 'valid' in request.session:
        valid = request.session['valid']
        del request.session['valid']

    context = {
        'title': 'Подтверждение почты',
        'valid': valid,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'email/confirm_email_complete.html', context)


def confirm_email(request):
    """ Отправка письма о подтверждении
    почты после регистрации """
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))
    email_service.confirm_email(
        user=request.user,
        email=request.user.email,
        subject='Добро пожаловать в KoltAccount',
        template='email/registration_email_confirm_email.html'
    )
    return redirect(reverse("confirm_email_done_url"))


def activate_email(request, uidb64, token):
    """ Активация почты """
    if not request.user.is_authenticated:
        return redirect(reverse("kolt_login"))

    if email_service.activate_email(uidb64, token):
        request.session['valid'] = True
    return redirect(reverse("confirm_email_complete_url"))


def master_password_reset(request):
    """ Сброс мастер пароля """
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = {
        'title': 'Сброс мастер пароля',
        'form': MasterPasswordResetForm,
        'form_message': 'None',
        'master_password': False,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }

    if MasterPassword.objects.filter(user=request.user).exists():
        context.update({
            'master_password': True
        })

    if request.method == 'POST':
        password = request.POST.get('password')

        if master_password.master_password_reset(request.user, password):
            return redirect(reverse("home_url"))

        context.update({
            'form_message': 'Password is not valid'
        })
    return render(request, 'registration/master_password_reset.html', context)


def get_ip_info_system_switch(request):
    """ Закрыть сайт на техническое обслуживание """
    if core_service.is_ajax(request) and request.user.is_staff:
        system_name = request.POST.get('system_name', None)
        answer = site_settings_service.get_ip_info_system_switch(system_name)
        return core_service.json_response(answer)
    return HttpResponseForbidden(render(request, '403.html'))


def site_in_service_switch(request):
    """ Закрыть сайт на техническое обслуживание """
    if core_service.is_ajax(request) and request.user.is_staff:
        checked = request.POST.get('checked', None)
        answer = site_settings_service.site_in_service_switch(checked)
        return core_service.json_response(answer)
    return HttpResponseForbidden(render(request, '403.html'))


def create_account(request):
    """ Создает аккаунт """
    if not core_service.is_ajax(request):
        return HttpResponseForbidden(render(request, '403.html'))

    site = request.POST.get('site', None)
    description = request.POST.get('description', None)
    _login = request.POST.get('login', None)
    password = request.POST.get('password', None)

    answer = accounts_service.create_account(
        site=site,
        description=description,
        login=_login,
        password=password,
        user=request.user
    )
    return core_service.json_response(answer)


def delete_account(request):
    """ Удаляет аккаунт """
    if not core_service.is_ajax(request):
        return HttpResponseForbidden(render(request, '403.html'))

    account_id = request.POST.get('account_id', None)
    answer = accounts_service.delete_account(account_id)
    return core_service.json_response(answer)


def change_info_account(request):
    """ Изменяет информацию об аккаунте """
    if not core_service.is_ajax(request):
        return HttpResponseForbidden(render(request, '403.html'))

    site = request.POST.get('site', None)
    description = request.POST.get('description', None)
    new_login = request.POST.get('new_login', None)
    new_password = request.POST.get('new_password', None)
    account_id = request.POST.get('account_id', None)

    answer = accounts_service.change_info_account(
        site=site,
        description=description,
        new_login=new_login,
        new_password=new_password,
        account_id=account_id
    )
    return core_service.json_response(answer)


def change_or_create_master_password(request):
    """ Изменяет мастер пароль """
    if not core_service.is_ajax(request):
        return HttpResponseForbidden(render(request, '403.html'))

    sites = request.POST.get('sites', None)
    descriptions = request.POST.get('descriptions', None)
    logins = request.POST.get('logins', None)
    passwords = request.POST.get('passwords', None)
    new_master_password = request.POST.get('new_master_password', None)
    new_crypto_settings = request.POST.get('new_cs', None)

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


def check_username(request):
    """ Проверяет существование имени в БД """
    if not core_service.is_ajax(request):
        return HttpResponseForbidden(render(request, '403.html'))

    username = request.POST.get('username', None)
    answer = core_service.check_username(username)
    return core_service.json_response(answer)


def get_master_password(request):
    """ Возвращает мастер пароль """
    if not core_service.is_ajax(request):
        return HttpResponseForbidden(render(request, '403.html'))

    answer = master_password.get_master_password(user=request.user)
    return core_service.json_response(answer)


def kolt_login(request):
    """ Авторизация пользователей """
    if request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = {
        'title': 'Авторизация',
        'form': KoltAuthenticationForm,
        'form_message': 'None',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }

    if request.method == 'POST':
        username = request.POST.get('username', None)
        password = request.POST.get('password', None)
        system = request.POST.get('system', None)
        browser = request.POST.get('browser', None)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            nlh_thread = login_history_service.NewLoginHistory(
                user, request.META, system, browser)
            nlh_thread.start()
            nlh_thread.join(1.0)
            return redirect(reverse("home_url"))

        context.update({
            'form_message': 'Login error'
        })
    return render(request, 'registration/login.html', context)


class KoltPasswordResetView(PasswordResetView):
    """ Переопределение формы сброса пароля для представления """
    form_class = KoltPasswordResetForm


class RegisterView(TemplateView):
    """ Регистрация пользователей """

    def dispatch(self, request, *args, **kwargs):
        return kolt_register(request)


def kolt_register(request):
    """ Регистрация """
    if request.user.is_authenticated:
        return redirect(reverse("home_url"))

    context = {
        'title': 'Регистрация',
        'form': RegisterForm,
        'form_message': 'None',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }

    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        answer = core_service.check_if_password_correct(password1, password2)
        if answer == 'success':
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password1
                )

                email_service.confirm_email(
                    user=user,
                    email=email,
                    subject='Добро пожаловать в KoltAccount',
                    template='email/registration_email_confirm_email.html'
                )

                return redirect(reverse("kolt_login"))
            except Exception as err:
                if str(err) == 'UNIQUE constraint failed: auth_user.username':
                    context.update({
                        'form_message': 'username error',
                        'username': username,
                        'email': email
                    })
                else:
                    raise
        else:
            context.update({
                'form_message': answer,
                'username': username,
                'email': email
            })
    return render(request, 'registration/register.html', context)
