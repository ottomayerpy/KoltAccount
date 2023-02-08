from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='home_url'),
    path('lk/', views.lk, name='lk_url'),
    path('noscript/', views.noscript, name='noscript_url'),
    path('logs/', views.logs, name='logs_url'),
    path('login/', views.kolt_login, name="kolt_login"),
    path('register/', views.RegisterView.as_view(), name="register_url"),
    
    path('support/', views.support, name='support_url'),
    path('support/protection/', views.protection, name='protection_url'),
    path('support/donation/', views.donation, name='donation_url'),
    path('support/privacy/', views.privacy, name='privacy_url'),
    path('support/terms/', views.terms, name='terms_url'),

    path('lk/site_in_service_switch/', views.site_in_service_switch),
    path('donation_notification/', views.donation_notification),
    path('create_account/', views.create_account),
    path('delete_account/', views.delete_account),
    path('change_info_account/', views.change_info_account),
    path('get_master_password/', views.get_master_password),
    path('change_or_create_master_password/',
         views.change_or_create_master_password),
    path('register/check_username/', views.check_username),

    path('email_change/', views.email_change, name='email_change_url'),
    path('email_change/done/', views.email_change_done,
         name='email_change_done_url'),

    path('accounts/password_reset/', views.KoltPasswordResetView.as_view(
        html_email_template_name='registration/password_reset_email.html')),

    path('confirm_email/', views.confirm_email, name='confirm_email_url'),
    path('confirm_email/done/', views.confirm_email_done,
         name='confirm_email_done_url'),
    path('confirm_email/complete/', views.confirm_email_complete,
         name='confirm_email_complete_url'),
    path('activate_email/<uidb64>[0-9A-Za-z_\-]+)/<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/', views.activate_email,
         name='activate_email'),

    path('master_password_reset/', views.master_password_reset,
         name='master_password_reset_url'),

    # Страница для проверки email шаблонов
    path('check_email_template/', views.check_email_template,
         name='check_email_template_url'),
]
