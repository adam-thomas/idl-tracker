from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.generic import TemplateView, View


class MainView(LoginRequiredMixin, TemplateView):
    template_name = "idl_tracker/main.html"


class LoginHealthCheck(LoginRequiredMixin, View):
    """
    A basic healthcheck endpoint. The frontend can poll this, and will receive a redirect to the
    login page if the user's session has lapsed.
    """
    def get(self, request, *args, **kwargs):
        return JsonResponse({"success": True})
