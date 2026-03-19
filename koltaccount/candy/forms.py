from django.forms import CharField, Form, PasswordInput


class MasterPasswordResetForm(Form):
    """Форма сброса мастер пароля"""

    password = CharField(
        label="Пароль",
        strip=False,
        max_length=254,
        widget=PasswordInput(attrs={"autocomplete": "new-password", "autofocus": True}),
    )
