import functools
import traceback

from baseapp.logger import write_error_to_log_file
from baseapp.models import SiteSetting
from django.http import (
    HttpResponseForbidden,
    HttpResponseNotFound,
    HttpResponseServerError,
)
from django.shortcuts import render

from koltaccount.settings import STATIC_VERSION


class BaseViewMiddleware:
    def __init__(self, get_response):
        self._get_response = get_response

    def __call__(self, request):
        if not request.user.is_staff:
            if request.path.startswith("/admin"):
                return HttpResponseForbidden(render(request, "403.html"))
            if SiteSetting.get_bool("site_in_service"):
                context = {
                    "title": "Сайт закрыт на техническое обслуживание",
                    "static_version": STATIC_VERSION,
                }
                return render(request, "site_in_service.html", context)
        return self._get_response(request)

    def process_exception(self, request, exception):
        write_error_to_log_file("ERROR", request.user, traceback.format_exc())
        return HttpResponseServerError(render(request, "500.html"))


def is_ajax(function):
    """Декоратор посылает 404 если не ajax запрос"""

    @functools.wraps(function)
    def wrapper(request, *args, **kwargs):
        if request.META.get("HTTP_X_REQUESTED_WITH") == "XMLHttpRequest":
            return function(request, *args, **kwargs)
        return HttpResponseNotFound(render(request, "404.html"))

    return wrapper


def is_staff(function):
    """Декоратор посылает 403 если пользователь не admin"""

    @functools.wraps(function)
    def wrapper(request, *args, **kwargs):
        if request.user.is_staff:
            return function(request, *args, **kwargs)
        return HttpResponseForbidden(render(request, "403.html"))

    return wrapper
