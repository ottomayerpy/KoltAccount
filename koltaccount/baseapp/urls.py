from baseapp import views
from django.urls import path

urlpatterns = [
    path("", views.index, name="home_url"),
    path("get_cpu_temp", views.get_cpu_temp, name="get_cpu_temp_url"),
    path("save-cpu-temp-path/", views.save_cpu_temp_path, name="save_cpu_temp_path"),
    path("lk/", views.lk, name="lk_url"),
    path("noscript/", views.noscript, name="noscript_url"),
    path("logs/", views.logs, name="logs_url"),
    path("login/", views.kolt_login, name="kolt_login"),
    path("register/", views.RegisterView.as_view(), name="register_url"),
    path("support/", views.support, name="support_url"),
    path("support/protection/", views.protection, name="protection_url"),
    path("support/privacy/", views.privacy, name="privacy_url"),
    path("support/terms/", views.terms, name="terms_url"),
    path("lk/site_in_service_toggle/", views.site_in_service_toggle),
    path(
        "accounts/password_reset/",
        views.KoltPasswordResetView.as_view(
            html_email_template_name="passwords/password_reset_email.html"
        ),
    ),
]
