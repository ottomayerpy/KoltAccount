import json

from django.http import HttpResponse

import core.service as core_service
from core.baseapp.models import UserModel

from koltaccount.settings import ACCOUNT_LIMIT

from .models import Account


def create_account(site: str, description: str,
                   login: str, password: str, user: UserModel) -> dict:
    """ Создает новый аккаунт """
    if Account.objects.count() >= 200:
        return {
            "status": "error",
            "message": "accountlimitreached"
        }

    account = Account.objects.create(
        user=user,
        site=site,
        description=description,
        login=login,
        password=password
    )

    return {
        "status": "success",
        "account_id": account.id
    }


def delete_account(account_id: int) -> dict:
    """ Удаляет аккаунт """
    try:
        account = Account.objects.get(id=account_id)
        account.delete()

        return {
            "status": "success"
        }
    except Account.DoesNotExist:
        return {
            "status": "error",
            "result": "doesnotexist"
        }


def change_info_account(site: str, description: str, new_login: str,
                        new_password: str, account_id: int) -> dict:
    """ Изменяет информацию аккаунта """
    try:
        account = Account.objects.get(id=account_id)
        account.site = site
        account.description = description

        if new_login == "":
            account.login = account.login
        else:
            account.login = new_login

        if new_password == "":
            account.password = account.password
        else:
            account.password = new_password

        account.save()

        return {
            "status": "success"
        }
    except Account.DoesNotExist:
        return {
            "status": "error",
            "result": "doesnotexist"
        }


def import_accounts(user, accounts):
    """Массовый импорт аккаунтов"""

    data = json.loads(accounts)

    if not data or not isinstance(data, list):
        return HttpResponse("Неверный формат данных", status=400)

    current_count = Account.objects.filter(user=user).count()
    if current_count + len(data) > ACCOUNT_LIMIT:
        return HttpResponse("Достигнут лимит аккаунтов", status=422)

    imported_accounts = []
    errors = []

    for idx, account_data in enumerate(data):
        try:
            account = Account.objects.create(
                user=user,
                site=account_data.get("site"),
                description=account_data.get("description"),
                login=account_data.get("login"),
                password=account_data.get("password"),
            )
            imported_accounts.append({"index": idx, "id": account.id})
        except Exception as e:
            errors.append({
                "index": idx,
                "error": str(e)
            })

    return core_service.json_response({
        "imported": imported_accounts,
        "errors": errors,
        "total": len(data),
        "success_count": len(imported_accounts),
        "error_count": len(errors)
    })
