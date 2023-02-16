import json

from argon2 import PasswordHasher
from django.contrib.auth.models import User
from koltaccount.settings import DONATION_NOTIFICATION_SECRET_KEY

from .models import Donation


def calculate_hash(data: dict) -> str:
    """ Вычисляет хеш для проверки платежа """
    text = "{0}&{1}&{2}&{3}&{4}&{5}&{6}&{7}&{8}".format(
        data.get("notification_type", ""),
        data.get("operation_id", ""),
        data.get("amount", ""),
        data.get("currency", ""),
        data.get("datetime", ""),
        data.get("sender", ""),
        data.get("codepro", ""),
        DONATION_NOTIFICATION_SECRET_KEY,
        data.get("label", "")
    )

    ph = PasswordHasher()
    return ph.hash(text.encode("utf-8"))


def create_donation(info: dict) -> bool:
    """ Создает пожертвование """
    donate_hash = calculate_hash(info)

    if donate_hash == info.get("sha1_hash", ""):
        try:
            Donation.objects.create(
                user=User.objects.get(id=info.get("label", "")),
                data=json.dumps(info)
            )
            return True
        except ValueError:
            return False
    return False
