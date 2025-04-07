import functools
import traceback

from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponseForbidden, HttpResponseServerError
from django.shortcuts import render
from koltaccount.settings import SITE_IN_SERVICE, STATIC_VERSION
from loguru import logger as log

from core.logger_service import write_error_to_log_file
from core.site_settings.models import SiteSetting


class BaseViewMiddleware:
    def __init__(self, get_response):
        self._get_response = get_response

    def __call__(self, request):
        site_in_service = SiteSetting.objects.filter(name="site_in_service").first()
        if site_in_service:
            site_in_service = site_in_service.value == "true"

        if not request.user.is_staff and site_in_service:
            context = {
                "title": "Сайт закрыт на техническое обслуживание",
                "static_version": STATIC_VERSION
            }
            return render(request, "site_in_service.html", context)
        return self._get_response(request)

    def process_exception(self, request, exception):
        log.error(traceback.format_exc())
        write_error_to_log_file(
            "ERROR", request.user, traceback.format_exc())
        return HttpResponseServerError(render(request, "500.html"))


def is_ajax(function):
    """ Декоратор посылает 403 если не ajax запрос """
    @functools.wraps(function)
    def wrapper(request, *args, **kwargs):
        if request.META.get("HTTP_X_REQUESTED_WITH") == "XMLHttpRequest":
            return function(request, *args, **kwargs)
        return HttpResponseForbidden(render(request, "403.html"))
    return wrapper
