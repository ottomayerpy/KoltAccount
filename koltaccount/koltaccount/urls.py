#from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

#from koltaccount import settings

urlpatterns = [
    path('', include('home.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('admin/', admin.site.urls),
] #+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
