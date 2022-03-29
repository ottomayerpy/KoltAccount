from core.models import SiteSetting
from django.contrib.sites.models import Site
from django.shortcuts import render
from koltaccount.settings import (SITE_PROTOCOL, STATIC_VERSION, SUPPORT_EMAIL,
                                 YANDEX_MONEY_DEFAULT_SUM,
                                 YANDEX_MONEY_WALLET_NUMBER)


def support(request):
    context = {
        'title': 'Помощь и поддержка',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/support.html', context)


def donation(request):
    context = {
        'title': 'Пожертвования',
        'wallet_number': YANDEX_MONEY_WALLET_NUMBER,
        'default_sum': YANDEX_MONEY_DEFAULT_SUM,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/donation.html', context)


def protection(request):
    context = {
        'title': 'Защита данных',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/protection.html', context)


def privacy(request):
    current_site = Site.objects.get_current()
    context = {
        'title': 'Политика конфиденциальности',
        'face': 'Колтманом Никитой Николаевичем',
        'protocol': f'{SITE_PROTOCOL}://',
        'domain': current_site.domain,
        'email': SUPPORT_EMAIL,
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/privacy.html', context)


def terms(request):
    context = {
        'title': 'Пользовательское соглашение',
        'site_in_service': SiteSetting.objects.get(name='site_in_service').value,
        'static_version': STATIC_VERSION
    }
    return render(request, 'support/terms.html', context)
