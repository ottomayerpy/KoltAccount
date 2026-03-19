from core.logger_service import sorted_logs
from django.test import TestCase

from ..mailer.service import hiding_email


class KoltEmailTestCase(TestCase):
    def test_hiding_email(self):
        value = hiding_email("ivanenko123@mail.ru")
        result = "iv***@mail.ru"
        self.assertEquals(value, result)

    def test_sorted_logs(self):
        value = sorted_logs(
            {
                "0": {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "02.11.2020 03:49:41",
                    "traceback": "Traceback (most recent call last):",
                },
                "1": {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "02.11.2020 04:08:10",
                    "traceback": "Traceback (most recent call last):",
                },
                "2": {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "07.11.2020 06:48:10",
                    "traceback": "Traceback (most recent call last):",
                },
                "3": {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "08.11.2020 04:45:33",
                    "traceback": "Traceback (most recent call last):",
                },
                "4": {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "08.11.2020 04:45:33",
                    "traceback": "Traceback (most recent call last):",
                },
            }
        )
        result = [
            (
                "3",
                {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "08.11.2020 04:45:33",
                    "traceback": "Traceback (most recent call last):",
                },
            ),
            (
                "4",
                {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "08.11.2020 04:45:33",
                    "traceback": "Traceback (most recent call last):",
                },
            ),
            (
                "2",
                {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "07.11.2020 06:48:10",
                    "traceback": "Traceback (most recent call last):",
                },
            ),
            (
                "1",
                {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "02.11.2020 04:08:10",
                    "traceback": "Traceback (most recent call last):",
                },
            ),
            (
                "0",
                {
                    "type": "ERROR",
                    "user": "admin",
                    "date": "02.11.2020 03:49:41",
                    "traceback": "Traceback (most recent call last):",
                },
            ),
        ]
        self.assertEquals(value, result)
