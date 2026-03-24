import threading

from baseapp.utils import account_activation_token
from django.contrib.sites.models import Site
from django.core.mail import EmailMessage
from django.template.loader import get_template
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from koltaccount.settings import EMAIL_HOST_USER, SITE_PROTOCOL


class EmailThread(threading.Thread):
    """Отправка почты в новом потоке"""

    def __init__(self, subject, html_content, recipient_list):
        self.subject = subject
        self.recipient_list = recipient_list
        self.html_content = html_content
        threading.Thread.__init__(self)

    def run(self):
        msg = EmailMessage(
            self.subject, self.html_content, EMAIL_HOST_USER, self.recipient_list
        )
        msg.content_subtype = "html"
        msg.send()


def send_email(
    user,
    subject: str,
    template: str,
    context: dict = None,
    email: str = None,
) -> None:
    """Отправить письмо"""
    current_site = Site.objects.get_current()

    if context is None:
        context = {}

    context.update(
        {
            "username": user.username,
            "protocol": SITE_PROTOCOL,
            "domain": current_site.domain,
        }
    )

    htmly = get_template(template)
    html_content = htmly.render(context)

    recipient = email if email else user.email
    email_thread = EmailThread(subject, html_content, [recipient])
    email_thread.start()


def activate_email(uidb64, token) -> bool:
    """Активация почты"""
    from django.contrib.auth import get_user_model

    UserModel = get_user_model()

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = UserModel.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
        return False

    if not account_activation_token.check_token(user, token):
        return False

    # Отвязываем старый email от других пользователей
    UserModel.objects.filter(email=user.email).exclude(pk=user.pk).update(
        email="", is_active_email=False
    )

    user.is_active_email = True
    user.save()
    return True


def hiding_email(email: str) -> str:
    """Скрывает тремя звездочками часть email адреса"""
    if not email or "@" not in email:
        return email or ""

    try:
        local, domain = email.split("@", 1)
        if len(local) <= 2:
            return f"{local[0]}***@{domain}"
        return f"{local[:2]}***@{domain}"
    except Exception:
        return email
