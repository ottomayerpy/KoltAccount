import threading

from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from koltaccount.settings import SITE_PROTOCOL, SUPPORT_EMAIL

from . import ip_information
from . import kolt_email
from . import kolt_logger

from .models import LoginHistory, SiteSetting


class NewLoginHistory(threading.Thread):
    """ Создает новую запись истории авторизаций в новом потоке """

    def __init__(self, user, META, system, browser):
        self.user = user
        self.meta = META
        self.system = system
        self.browser = browser
        threading.Thread.__init__(self)

    def run(self):
        ip_system = SiteSetting.objects.get(name='get_ip_info_system').value
        client_ip = ip_information.get_client_ip(self.meta)
        ip_info = ip_information.get_ip_info(client_ip, ip_system)

        if ip_system == 'ipwhois.io' and ip_info['completed_requests'] == 9500:
            to_email = ''
            try:
                to_email = User.objects.get(username='admin').email
            except User.DoesNotExist:
                to_email = SUPPORT_EMAIL

            current_site = Site.objects.get_current()
            kolt_email.send_email(
                email=to_email,
                subject='Переполнение запросов ipwhois.io',
                template='notification_ip_info_completed_requests_to_admin',
                context={
                    'username': self.user.username,
                    'protocol': SITE_PROTOCOL,
                    'domain': current_site.domain,
                }
            )

        if ip_system == 'ipwhois.io':
            if ip_info['success']:
                if ip_info['city'] == ip_info['country']:
                    location = ip_info['country']
                else:
                    location = f"{ip_info['city']}, {ip_info['country']}"
                self.create_login_history(client_ip, location)
            else:
                kolt_logger.write_error_to_log_file(
                    'NewLoginHistory ipwhois.io ERROR',
                    self.user.username,
                    ip_info
                )
        elif ip_system == 'ipinfo.io':
            try:
                location = f"{ip_info['city']}, {ip_info['region']}"
                self.create_login_history(client_ip, location)
            except KeyError:
                kolt_logger.write_error_to_log_file(
                    'NewLoginHistory ipinfo.io ERROR',
                    self.user.username,
                    ip_info
                )

    def create_login_history(self, client_ip, location):
        """ Создает запись истории авторизации """
        if location is None:
            location = 'Не определено'

        LoginHistory.objects.create(
            user=self.user,
            ip=client_ip,
            system=self.system,
            location=location,
            browser=self.browser
        )

        # Удаляем последний элемент, если их становится больше 6, так как
        # в выводится 6 элементов, чтобы не мусорить в БД
        login_history = LoginHistory.objects.filter(user=self.user)
        if login_history.count() > 6:
            last_element = login_history.order_by('-id').last()
            last_element.delete()
