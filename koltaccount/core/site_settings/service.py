import core.service as core_service
from django.http import HttpResponseServerError

from .models import SiteSetting


def site_in_service_switch(checked: str) -> dict:
    """ Изменяет состояние сайта ("true" - Закрыт / "false" - Открыт) """
    try:
        setting = SiteSetting.objects.get(name="site_in_service")
        if checked == "true":
            setting.value = "true"
        else:
            setting.value = "false"

        setting.save()

        return core_service.json_response(setting.value)
    except SiteSetting.DoesNotExist:
        return HttpResponseServerError("Не установлена настройка сайта site_in_service")
