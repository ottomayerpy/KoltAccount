import json

from django.http import HttpResponse

import core.service as core_service

from koltaccount.settings import CANDIES_LIMIT

from .models import Account


def import_accounts(user, accounts):
    """Массовый импорт аккаунтов"""

    data = json.loads(accounts)

    if not data or not isinstance(data, list):
        return HttpResponse("Неверный формат данных", status=400)

    current_count = Account.objects.filter(user=user).count()
    if current_count + len(data) > CANDIES_LIMIT:
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
