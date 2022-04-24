from .models import SiteSetting


def get_ip_info_system_switch(system_name: str) -> dict:
    """ Изменяет систему получения информации по ip """
    # ipwhois.io ipinfo.io
    try:
        setting = SiteSetting.objects.get(name='get_ip_info_system')
        setting.value = system_name
        setting.save()

        return {
            'status': 'success',
            'value': setting.value
        }
    except SiteSetting.DoesNotExist:
        return {
            'status': 'error',
            'result': 'doesnotexist'
        }


def site_in_service_switch(checked: str) -> dict:
    """ Изменяет состояние сайта ('true' - Закрыт / 'false' - Открыт) """
    try:
        setting = SiteSetting.objects.get(name='site_in_service')
        if checked == 'true':
            setting.value = 'true'
        else:
            setting.value = 'false'

        setting.save()

        return {
            'status': 'success',
            'checked': setting.value
        }
    except SiteSetting.DoesNotExist:
        return {
            'status': 'error',
            'result': 'doesnotexist'
        }
