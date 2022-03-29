import traceback

from django.http import HttpResponseServerError
from django.shortcuts import render
from koltaccount.settings import STATIC_VERSION
from loguru import logger as log

from . import kolt_logger

from .models import SiteSetting


class BaseViewMiddleware:
    def __init__(self, get_response):
        self._get_response = get_response
    
    def __call__(self, request):
        if not request.user.is_staff and SiteSetting.objects.get(name='site_in_service').value == 'true':
            context = {
                'title': 'Сайт закрыт на техническое обслуживание',
                'static_version': STATIC_VERSION
            }
            return render(request, 'site_in_service.html', context)
        return self._get_response(request)


    def process_exception(self, request, exception):
        log.error(traceback.format_exc())
        kolt_logger.write_error_to_log_file(
            'ERROR', request.user, traceback.format_exc())
        return HttpResponseServerError(render(request, '500.html'))


# import functools
# from django.db import transaction
# from koltaccount.settings import DEBUG


# def base_view(function):
#     """ Декоратор для вьюшек, обрабатывает исключения """

#     @functools.wraps(function)
#     def wrapper(request, *args, **kwargs):
#         try:
#             with transaction.atomic():
#                 if not request.user.is_staff and SiteSetting.objects.get(name='site_in_service').value == 'true':
#                     context = {
#                         'title': 'Сайт закрыт на техническое обслуживание',
#                         'static_version': STATIC_VERSION
#                     }
#                     return render(request, 'site_in_service.html', context)
#                 return function(request, *args, **kwargs)
#         except Exception:
#             if DEBUG:
#                 log.error(traceback.format_exc())
#             kolt_logger.write_error_to_log_file(
#                 'ERROR', request.user, traceback.format_exc())
#             return HttpResponseServerError(render(request, '500.html'))

#     return wrapper
