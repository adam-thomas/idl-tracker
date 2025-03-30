import os

import django_heroku
import dj_database_url

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEBUG = bool(int(os.environ.get("DEBUG", 0)))

ALLOWED_HOSTS = ["*"] if DEBUG else ["idl-tracker.herokuapp.com"]
BASE_URL = "https://idl-tracker.herokuapp.com"

INSTALLED_APPS = (
    "idl_tracker",

    "django_extensions",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
)

MIDDLEWARE = (
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
)

SECRET_KEY = "local_key" if DEBUG else os.environ.get("SECRET_KEY")

ROOT_URLCONF = "idl_tracker.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "idl_tracker.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default="postgres://localhost/idl_tracker",
    ),
}
DATABASES["default"]["ATOMIC_REQUESTS"] = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "en-gb"
USE_TZ = False

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATIC_URL = os.environ.get("STATIC_URL", "/static/")
STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
)

LOGIN_REDIRECT_URL = "/"
SECURE_SSL_REDIRECT = not DEBUG

DEBUG_PROPAGATE_EXCEPTIONS = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": ("%(asctime)s [%(process)d] [%(levelname)s] " +
                       "pathname=%(pathname)s lineno=%(lineno)s " +
                       "funcname=%(funcName)s %(message)s"),
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
        "simple": {
            "format": "%(levelname)s %(message)s"
        }
    },
    "handlers": {
        "null": {
            "level": "DEBUG",
            "class": "logging.NullHandler",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "verbose"
        }
    },
    "loggers": {
        "testlogger": {
            "handlers": ["console"],
            "level": "INFO",
        }
    }
}

# Activate Django-Heroku.
django_heroku.settings(locals())
