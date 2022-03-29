import json
import urllib.request

from koltaccount.settings import IPINFO_IO_TOKEN


def get_ip_info(client_ip: str, system: str) -> dict:
    """ Получить информацию о пользователе по ip через API """
    if system == 'ipwhois.io':
        objects = 'success,message,type,country,city,completed_requests'
        url = f'https://ipwhois.app/json/{client_ip}?objects={objects}&lang=ru'
    elif system == 'ipinfo.io':
        url = f'https://ipinfo.io/{client_ip}?token={IPINFO_IO_TOKEN}'

    with urllib.request.urlopen(url) as response:
        return json.load(response)


def get_client_ip(meta) -> str:
    """ Получить ip адрес пользователя """
    x_forwarded_for = meta.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[-1].strip()
    else:
        return meta.get('REMOTE_ADDR')
