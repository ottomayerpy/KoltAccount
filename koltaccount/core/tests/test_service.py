from django.test import TestCase

from .. import service


class ServiceTestCase(TestCase):
    def test_check_if_password_correct(self):
        value = service.check_if_password_correct('Passwor1', 'Passwor1')
        result = 'success'
        self.assertEquals(value, result)
