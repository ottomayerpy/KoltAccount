from django.contrib.auth.models import User

from .models import CryptoSetting


def get_crypto_settings(user: User):
    """ Возвращает настройки шифрования """
    cs = CryptoSetting.objects.get(user=user)
    return {
        'key': {
            'size': cs.key.size,
            'division': cs.key.devision
        },
        'iv': {
            'size': cs.iv.size,
            'division': cs.iv.devision
        },
        'salt': {
            'size': cs.salt.size,
            'division': cs.salt.devision
        },
        'iterations': cs.iterations
    }
