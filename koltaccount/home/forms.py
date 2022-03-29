from core import kolt_email
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import (AuthenticationForm, PasswordResetForm,
                                       UsernameField)
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

UserModel = get_user_model()


class RegisterForm(forms.Form):
    """ Форма регистрации """
    username = UsernameField(
        label='Имя пользователя',
        widget=forms.TextInput(attrs={'autofocus': True, 'max_length': '254'})
    )
    email = forms.EmailField(
        label='Адрес электронной почты',
        max_length=254,
        widget=forms.EmailInput(attrs={'autocomplete': 'email'})
    )
    password1 = forms.CharField(
        label='Пароль',
        strip=False,
        max_length=254,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'})
    )
    password2 = forms.CharField(
        label='Повторите пароль',
        strip=False,
        max_length=254,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'})
    )


class KoltAuthenticationForm(AuthenticationForm):
    """ Форма расширяющая форму авторизации """
    username = UsernameField(widget=forms.TextInput(
        attrs={'autofocus': True, 'max_length': '254'}))
    password = forms.CharField(
        label='Пароль',
        strip=False,
        max_length=254,
        widget=forms.PasswordInput(attrs={'autocomplete': 'current-password'}),
    )
    system = forms.CharField(widget=forms.HiddenInput())
    browser = forms.CharField(widget=forms.HiddenInput())


class KoltPasswordResetForm(PasswordResetForm):
    """ Форма расширяющая форму восстановления пароля """

    def save(self, domain_override=None,
             subject_template_name='registration/password_reset_subject.txt',
             email_template_name='registration/password_reset_email.html',
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
                    'email': user_email,
                    'domain': domain,
                    'site_name': site_name,
                    'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                    'user': user,
                    'token': token_generator.make_token(user),
                    'protocol': 'https' if use_https else 'http',
                    **(extra_email_context or {}),
                }
                kolt_email.send_email(
                    email=user_email,
                    subject=f'Сброс пароля на {site_name}',
                    template=html_email_template_name,
                    context=context
                )


class MasterPasswordResetForm(forms.Form):
    """ Форма сброса мастер пароля """
    password = forms.CharField(
        label='Пароль',
        strip=False,
        max_length=254,
        widget=forms.PasswordInput(
            attrs={'autocomplete': 'new-password', 'autofocus': True})
    )


class EmailChangeForm(forms.Form):
    """ Форма изменения электронной почты """
    email = forms.EmailField(
        label='Адрес электронной почты',
        max_length=254,
        widget=forms.EmailInput(
            attrs={'autocomplete': 'email', 'autofocus': True})
    )
