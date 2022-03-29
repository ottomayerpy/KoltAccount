from django.urls import path

from . import views

urlpatterns = [
    path('', views.support, name='support_url'),
    path('protection/', views.protection, name='protection_url'),
    path('donation/', views.donation, name='donation_url'),
    path('privacy/', views.privacy, name='privacy_url'),
    path('terms/', views.terms, name='terms_url'),
]
