from django.test import TestCase

from .service import hiding_email


class KoltEmailTestCase(TestCase):
    def test_hiding_email(self):
        value = hiding_email('ivanenko123@mail.ru')
        result = 'iv***@mail.ru'
        self.assertEquals(value, result)
