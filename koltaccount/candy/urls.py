from django.urls import path

from . import views

urlpatterns = [
    path("create_candy/", views.create_candy),
    path("delete_candy/", views.delete_candy),
    path("clear_all_candies/", views.clear_all_candies),
    path("change_candy/", views.change_candy),
    path("import_candies/", views.import_candies),
    path("get_master_password/", views.get_master_password),
    path("save_master_password/", views.save_master_password),
    path(
        "master_password_reset/",
        views.master_password_reset,
        name="master_password_reset_url",
    ),
]
