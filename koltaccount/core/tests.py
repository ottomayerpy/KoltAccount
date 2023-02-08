from django.test import TestCase

from .service import check_if_password_correct


class ServiceTestCase(TestCase):
    def test_check_if_password_correct(self):
        value = check_if_password_correct("Passwor1", "Passwor1")
        result = None
        self.assertEquals(value, result)
