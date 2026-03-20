from baseapp.admin import admin_site
from django.urls import include, path

urlpatterns = [
    path("", include("baseapp.urls")),
    path("mailer/", include("mailer.urls")),
    path("accounts/", include("django.contrib.auth.urls")),
    path("admin/", admin_site.urls),
]

# Production. collectstatic.
# from django.conf.urls.static import static
# from koltaccount import settings --- from django.conf import settings
# urlpatterns = [...] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
