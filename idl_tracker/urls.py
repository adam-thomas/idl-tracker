from django.contrib import admin
from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from . import views


app_name = "idl_tracker"


urlpatterns = [
    path("admin/", admin.site.urls, name="admin"),
    path("accounts/", include("django.contrib.auth.urls")),

    path("health_check", views.LoginHealthCheck.as_view(), name="health_check"),

    path("", views.MainView.as_view(), name="main"),
]

urlpatterns += staticfiles_urlpatterns()
