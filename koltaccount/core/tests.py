from django.test import TestCase

from .email_service import hiding_email
from .service import check_if_password_correct


class ServiceTestCase(TestCase):
    def test_check_if_password_correct(self):
        value = check_if_password_correct("Passwor1", "Passwor1")
        result = None
        self.assertEquals(value, result)


class KoltEmailTestCase(TestCase):
    def test_hiding_email(self):
        value = hiding_email('ivanenko123@mail.ru')
        result = 'iv***@mail.ru'
        self.assertEquals(value, result)
