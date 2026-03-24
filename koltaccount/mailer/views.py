from baseapp.utils import account_activation_token, get_base_context
from django.contrib.sites.models import Site
from django.http import HttpResponseForbidden
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from mailer.utils import activate_email, hiding_email, send_email

from koltaccount.settings import SITE_DOMAIN, SITE_PROTOCOL

from .forms import EmailChangeForm


def change(request):
    """Изменить адрес электронной почты"""
    if request.method != "POST":
        context = get_base_context(
            {"title": "Изменить почтовый адрес", "form": EmailChangeForm()}
        )
        return render(request, "email/change_form.html", context)

    email = request.POST.get("email")
    user = request.user
    current_site = Site.objects.get_current()

    # Отправляем письмо на новый email
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

    # Отправляем уведомление на старый email
    if user.email:
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


def change_done(request):
    """Страница после отправки письма с инструкциями"""
    context = get_base_context({"title": "Письмо с инструкциями отправлено"})
    return render(request, "email/change_done.html", context)


def confirm(request):
    """Отправка письма о подтверждении почты после регистрации"""
    if not request.user.is_authenticated:
        return redirect(reverse("home_url"))

    send_email(
        user=request.user,
        subject="Добро пожаловать в KoltAccount",
        template="email/confirm.html",
        context={
            "uid": urlsafe_base64_encode(force_bytes(request.user.pk)),
            "token": account_activation_token.make_token(request.user),
        },
    )
    return redirect(reverse("email_confirm_done_url"))


def confirm_done(request):
    """Страница после отправки письма подтверждения"""
    context = get_base_context({"title": "Письмо отправлено"})
    return render(request, "email/confirm_done.html", context)


def confirm_complete(request):
    """Страница успешного подтверждения почты"""
    valid = request.session.pop("valid", False)
    context = get_base_context({"title": "Подтверждение почты", "valid": valid})
    return render(request, "email/confirm_complete.html", context)


def activate(request, uidb64, token):
    """Активация почты"""
    if not request.user.is_authenticated:
        return redirect(reverse("kolt_login"))

    if activate_email(uidb64, token):
        request.session["valid"] = True

    return redirect(reverse("email_confirm_complete_url"))


def check_test_template(request):
    """Тестирование шаблона для почты"""
    if not request.user.is_staff:
        return HttpResponseForbidden(render(request, "403.html"))

    context = {
        "username": request.user.username,
        "protocol": SITE_PROTOCOL,
        "domain": SITE_DOMAIN,
        "uid": "MQ",
        "token": "abc123-def456",
        "email": hiding_email(request.user.email),
    }

    templates = [
        "email/confirm.html",
        "email/notification_to_old_email.html",
        "email/change.html",
    ]

    return render(request, templates[0], context)
