from django.forms import EmailField, EmailInput, Form


class EmailChangeForm(Form):
    """ Форма изменения электронной почты """
    email = EmailField(
        label="Адрес электронной почты",
        max_length=254,
        widget=EmailInput(
            attrs={"autocomplete": "email", "autofocus": True})
    )
