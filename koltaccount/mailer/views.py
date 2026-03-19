from core.baseapp.models import UserModel
from core.email_service import activate_email as act_email
from core.email_service import hiding_email, send_email
from core.service import get_base_context
from core.token_generator import account_activation_token
from django.contrib.sites.models import Site
from django.http import HttpResponseForbidden
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from koltaccount.settings import SITE_PROTOCOL

from .forms import EmailChangeForm


def change(request):
    """Изменить адрес электронной почты"""
    context = get_base_context(
        {"title": "Изменить почтовый адрес", "form": EmailChangeForm}
    )

    if request.method == "POST":
        email = request.POST.get("email")
        user = UserModel.objects.get(id=request.user.id)
        current_site = Site.objects.get_current()
        send_email(
            user=user,
            subject="Привязка email к аккаунту",
            template="email/change.html",
            context={
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "token": account_activation_token.make_token(user),
            },
            email=email,
        )
        send_email(
            user=user,
            subject="Привязка email к аккаунту",
            template="email/notification_to_old_email.html",
            context={
                "email": hiding_email(email),
                "username": user.username,
                "domain": current_site.domain,
            },
        )
        user.email = email
        user.is_active_email = False
        user.save()
        return redirect(reverse("email_change_done_url"))
    return render(request, "email/change_form.html", context)


def change_done(request):
    """Страница которая говорит о том что письмо с
    инструкциями по изменению почтового адреса отправлено"""
    context = get_base_context(
        {"title": "Письмо с инструкциями по изменению почтового адреса отправлено"}
    )
    return render(request, "email/change_done.html", context)


def confirm(request):
    """Отправка письма о подтверждении
    почты после регистрации"""
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))
    send_email(
        user=request.user,
        subject="Добро пожаловать в KoltAccount",
        template="email/registration_confirm.html",
        context={
            "uid": urlsafe_base64_encode(force_bytes(request.user.pk)),
            "token": account_activation_token.make_token(request.user),
        },
    )
    return redirect(reverse("email_confirm_done_url"))


def confirm_done(request):
    """Страница которая говорит о том что
    отправленно письмо подтверждения почты после регистрации"""
    context = get_base_context({"title": "Письмо отправленно"})
    return render(request, "email/confirm_done.html", context)


def confirm_complete(request):
    """Страница которая говорит о том что
    пользователь успешно подтвердили почту после регистрации"""
    valid = False

    if "valid" in request.session:
        valid = request.session["valid"]
        del request.session["valid"]

    context = get_base_context({"title": "Подтверждение почты", "valid": valid})
    return render(request, "email/confirm_complete.html", context)


def activate(request, uidb64, token):
    """Активация почты"""
    if not request.user.is_authenticated:
        return redirect(reverse("kolt_login"))

    if act_email(uidb64, token):
        request.session["valid"] = True
    return redirect(reverse("email_confirm_complete_url"))


def check_test_template(request):
    """Текстирование шаблона для почты"""
    if not request.user.is_staff:
        return HttpResponseForbidden(render(request, "403.html"))

    context = {
        "username": request.user.username,
        "protocol": SITE_PROTOCOL,
        "domain": "koltaccount.ru",
        "uid": "MQ%5B0-9A-Za-z_%5",
        "token": "-z%5D%7B1,13%7D-%5B0-9A-Za-z%5D%",
        "email": hiding_email(request.user.email),
    }

    templates = [
        "email/registration_confirm.html",
        "email/notification_to_old_email.html",
        "email/change.html",
    ]

    return render(request, templates[0], context)


# TODO: Удалить. Потеряли где-то шаблон
# def change_complete(request):
#     """Страница которая говорит о том что
#     изменение адреса почты завершено"""
#     context = get_base_context({"title": "Изменение адреса почты завершено"})
#     return render(request, "email/email_change_complete.html", context)
