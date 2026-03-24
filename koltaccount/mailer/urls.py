from django.urls import path, re_path

from .views import (
    activate,
    change,
    change_done,
    check_test_template,
    confirm,
    confirm_complete,
    confirm_done,
)

urlpatterns = [
    path("change/", change, name="email_change_url"),
    path("change/done/", change_done, name="email_change_done_url"),
    path("confirm/", confirm, name="email_confirm_url"),
    path("confirm/done/", confirm_done, name="email_confirm_done_url"),
    path("confirm/complete/", confirm_complete, name="email_confirm_complete_url"),
    re_path(
        r"^activate/(?P<uidb64>[0-9A-Za-z_-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$",
        activate,
        name="email_activate_url",
    ),
    path("check_test_template/", check_test_template, name="check_email_template_url"),
]
