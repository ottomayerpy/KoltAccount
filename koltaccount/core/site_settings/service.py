from .models import SiteSetting


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
