import threading

from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from koltaccount.settings import SITE_PROTOCOL

from core.kolt_email import service as email_service

from .models import LoginHistory


class NewLoginHistory(threading.Thread):
    """ Создает новую запись истории авторизаций в новом потоке """

    def __init__(self, user, META, system, browser):
        self.user = user
        self.meta = META
        self.system = system
        self.browser = browser
        threading.Thread.__init__(self)

    def run(self):
        client_ip = self.get_client_ip()

        email_service.send_email(
            user=self.user,
            subject="Новый вход в аккаунт",
            template="email/notification_login.html"
        )
        self.create_login_history(client_ip)

    def get_client_ip(self) -> str:
        """ Получить ip адрес пользователя """
        x_forwarded_for = self.meta.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[-1].strip()
        else:
            return self.meta.get("REMOTE_ADDR")

    def create_login_history(self, client_ip, location=None):
        """ Создает запись истории авторизации """
        LoginHistory.objects.create(
            user=self.user,
            ip=client_ip,
            system=self.system,
            location=location if location is not None else "Не определено",
            browser=self.browser
        )

        # Удаляем последний элемент, если их становится больше 6, так как
        # в выводится 6 элементов, чтобы не мусорить в БД
        login_history = LoginHistory.objects.filter(user=self.user)
        if login_history.count() > 6:
            last_element = login_history.order_by("-id").last()
            last_element.delete()
