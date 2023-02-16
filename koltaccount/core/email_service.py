import threading

from django.contrib.sites.models import Site
from django.core.mail import EmailMessage
from django.template.loader import get_template
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from koltaccount.settings import EMAIL_HOST_USER, SITE_PROTOCOL

from core.baseapp.models import UserModel
from core.token_generator import account_activation_token


class EmailThread(threading.Thread):
    """ Отправка почты в новом потоке """

    def __init__(self, subject, html_content, recipient_list):
        self.subject = subject
        self.recipient_list = recipient_list
        self.html_content = html_content
        threading.Thread.__init__(self)

    def run(self):
        msg = EmailMessage(self.subject, self.html_content,
                           EMAIL_HOST_USER, self.recipient_list)
        msg.content_subtype = "html"
        msg.send()


def send_email(user: UserModel, subject: str, template: str, context: dict = None, email: str = None) -> None:
    """ Отправить письмо """
    current_site = Site.objects.get_current()

    if context is None:
        context = dict()

    context.update({
        "username": user.username,
        "protocol": SITE_PROTOCOL,
        "domain": current_site.domain,
    })

    htmly = get_template(template)
    html_content = htmly.render(context)

    email_thread = EmailThread(
        subject,
        html_content,
        [user.email if email is None else email]
    )
    email_thread.start()
    email_thread.join(1.0)


def activate_email(uidb64, token) -> bool:
    """ Активация почты """
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = UserModel.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
        user = None
    if user is not None and account_activation_token.check_token(user, token):
        old_users = UserModel.objects.filter(email=user.email)
        for old_user in old_users:
            if not old_user.username == user.username:
                old_user.email = ""
                old_user.profile.is_active_email = False
                old_user.save()
        user.profile.is_active_email = True
        user.save()
        return True
    return False


def hiding_email(email: str) -> str:
    """ Скрывает тремя звездочками часть email адреса """
    try:
        return email[0:2] + "***" + email[email.index("@"):]
    except Exception:
        return ""
