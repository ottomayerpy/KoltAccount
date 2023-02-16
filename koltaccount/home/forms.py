from core.email_service import send_email
from django.forms import TextInput, EmailField, EmailInput, CharField, PasswordInput, HiddenInput, Form
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import (AuthenticationForm, PasswordResetForm,
                                       UsernameField)
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

UserModel = get_user_model()


class RegisterForm(Form):
    """ Форма регистрации """
    username = UsernameField(
        label="Имя пользователя",
        widget=TextInput(attrs={"autofocus": True, "max_length": "254"})
    )
    email = EmailField(
        label="Адрес электронной почты",
        max_length=254,
        widget=EmailInput(attrs={"autocomplete": "email"})
    )
    password = CharField(
        label="Пароль",
        strip=False,
        max_length=254,
        widget=PasswordInput(attrs={"autocomplete": "new-password"})
    )
    password_repead = CharField(
        label="Повторите пароль",
        strip=False,
        max_length=254,
        widget=PasswordInput(attrs={"autocomplete": "new-password"})
    )


class KoltAuthenticationForm(AuthenticationForm):
    """ Форма расширяющая форму авторизации """
    username = UsernameField(widget=TextInput(
        attrs={"autofocus": True, "max_length": "254"}))
    password = CharField(
        label="Пароль",
        strip=False,
        max_length=254,
        widget=PasswordInput(attrs={"autocomplete": "current-password"}),
    )
    system = CharField(widget=HiddenInput())
    browser = CharField(widget=HiddenInput())


class KoltPasswordResetForm(PasswordResetForm):
    """ Форма расширяющая форму восстановления пароля """

    def save(self, domain_override=None,
             subject_template_name="registration/password_reset_subject.txt",
             email_template_name="registration/password_reset_email.html",
             use_https=False, token_generator=default_token_generator,
             from_email=None, request=None, html_email_template_name=None,
             extra_email_context=None):
        email = self.cleaned_data["email"]
        email_field_name = UserModel.get_email_field_name()
        for user in self.get_users(email):
            if user.profile.is_active_email:
                if not domain_override:
                    current_site = get_current_site(request)
                    site_name = current_site.name
                    domain = current_site.domain
                else:
                    site_name = domain = domain_override
                user_email = getattr(user, email_field_name)
                context = {
                    "email": user_email,
                    "domain": domain,
                    "site_name": site_name,
                    "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                    "user": user,
                    "token": token_generator.make_token(user),
                    "protocol": "https" if use_https else "http",
                    **(extra_email_context or {}),
                }
                send_email(
                    user=user,
                    subject=f"Сброс пароля на {site_name}",
                    template=html_email_template_name,
                    context=context
                )


class MasterPasswordResetForm(Form):
    """ Форма сброса мастер пароля """
    password = CharField(
        label="Пароль",
        strip=False,
        max_length=254,
        widget=PasswordInput(
            attrs={"autocomplete": "new-password", "autofocus": True})
    )


class EmailChangeForm(Form):
    """ Форма изменения электронной почты """
    email = EmailField(
        label="Адрес электронной почты",
        max_length=254,
        widget=EmailInput(
            attrs={"autocomplete": "email", "autofocus": True})
    )
