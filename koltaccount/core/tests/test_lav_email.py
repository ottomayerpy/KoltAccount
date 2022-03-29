from django.test import TestCase

from .. import kolt_email


class KoltEmailTestCase(TestCase):
    def test_hiding_email(self):
        value = kolt_email.hiding_email('ivanenko123@mail.ru')
        result = 'iv***@mail.ru'
        self.assertEquals(value, result)
