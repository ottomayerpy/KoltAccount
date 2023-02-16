import os
from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()

ENVIRONMENT = BASE_DIR.parent.parent.parent / 'settings/.env'
if os.path.exists(ENVIRONMENT):
    environ.Env.read_env(ENVIRONMENT)
else:
    raise FileNotFoundError("Файл {} не найден".format(ENVIRONMENT))

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    'crispy_forms',
    'axes',
    'dotenv',

    'home.apps.HomeConfig',
    'core.crypto.apps.CryptoConfig',
    'core.donation.apps.DonationConfig',
    'core.login_history.apps.LoginHistoryConfig',
    'core.site_settings.apps.SiteSettingsConfig',
    'core.accounts.apps.AccountsConfig',
]

STATIC_VERSION = 1
SITE_ID = 3
CRISPY_TEMPLATE_PACK = 'bootstrap4'
SITE_PROTOCOL = 'https'
AUTH_USER_MODEL = "baseapp.UserModel"

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# Почта поддержки
SUPPORT_EMAIL = env("SUPPORT_EMAIL")
YANDEX_MONEY_WALLET_NUMBER = env("YANDEX_MONEY_WALLET_NUMBER")
YANDEX_MONEY_DEFAULT_SUM = env("YANDEX_MONEY_DEFAULT_SUM")
DONATION_NOTIFICATION_SECRET_KEY = env(
    "DONATION_NOTIFICATION_SECRET_KEY")

###SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
###SECURE_SSL_REDIRECT = True

SESSION_COOKIE_SAMESITE = 'Lax'  # 'Strict' #'Lax'

# Защита XSS для старых браузеров
SECURE_BROWSER_XSS_FILTER = True

# Отказывать подключение к доменному имени через небезопасное
# соединение, в течение определенного периода времени (В секундах)
# SECURE_HSTS_SECONDS = 63072000 # 2 Года 63072000 # Час 3600 # Год 31536000
# Защита поддоменов
###SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# Добавить сайт в список предварительной загрузки браузера
###SECURE_HSTS_PRELOAD = True

# Cookie будут отправляться только через HTTPS,
# что защитит от перехвата не незашифрованный файл cookie
###SESSION_COOKIE_SECURE = True

# CSRF cookie будут отправляться только через HTTPS,
# что защитит от перехвата не незашифрованный файл CSRF cookie
###CSRF_COOKIE_SECURE = True

# Если True, перенаправляет все запросы, отличные от HTTPS, на HTTPS
###SECURE_SSL_REDIRECT = True

# Защита Content-Security-Policy для контента
CSP_DEFAULT_SRC = ("'none'",)
CSP_STYLE_SRC = ("'self'",)  # "'unsafe-inline'",
CSP_SCRIPT_SRC = ("'self'",)
CSP_FONT_SRC = ("'self'",)
CSP_IMG_SRC = ("'self'",)

# unsafe-inline разрешает встроенный CSS, например <h1 style = "margin-left: 30px;">
# Эта политика содержит 'unsafe-inline', что опасно в директиве style-src.


# CP (Crypto Param)
CP_KEY_ID = 1 # 256/8
CP_IV_ID = 2 # 128/8
CP_SALT_ID = 1

# CS (Crypto Settings)
DECRYPT_MP_SUBSTRING_START = env("DECRYPT_MP_SUBSTRING_START")
DECRYPT_MP_SUBSTRING_END = env("DECRYPT_MP_SUBSTRING_END")

DECRYPT_STR_SUBSTRING_START = env("DECRYPT_STR_SUBSTRING_START")
DECRYPT_STR_SUBSTRING_END = env("DECRYPT_STR_SUBSTRING_END")
CRYPT_STR_AES_PADDING = env("CRYPT_STR_AES_PADDING")
CRYPT_STR_AES_MODE = env("CRYPT_STR_AES_MODE")


# Защита Referrer-Policy для контента
PERMISSIONS_POLICY = {
    'autoplay': ['none', ],
    'camera': ['none', ],
    'microphone': ['none', ],
    'geolocation': ['none', ],
    'display-capture': ['none', ],
    'payment': ['none', ],
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'axes.middleware.AxesMiddleware',
    'core.middleware.BaseViewMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesBackend',
    'django.contrib.auth.backends.ModelBackend',
]

AXES_FAILURE_LIMIT = 70
AXES_COOLOFF_TIME = timedelta(hours=2)
AXES_LOCKOUT_TEMPLATE = 'ban.html'

ROOT_URLCONF = 'koltaccount.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'frontend/templates',],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'koltaccount.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR.parent.parent.parent / 'db/kolt-db/db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'

USE_I18N = True
USE_L10N = True
USE_TZ = True

STATICFILES_DIRS = (
    BASE_DIR / 'frontend/static',
)

STATIC_URL = '/frontend/static/'

MEDIA_ROOT = BASE_DIR / 'frontend/media/'
MEDIA_URL = '/frontend/media/'

EMAIL_USE_TLS = env("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env("EMAIL_USE_SSL", default=True)
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_PORT = env("EMAIL_PORT")
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
