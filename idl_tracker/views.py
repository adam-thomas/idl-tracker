from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import Http404, JsonResponse
from django.views.generic import FormView, TemplateView, View

from .forms import DeleteTaskForm, EditTaskForm, NewTaskForm, SetDoneTaskForm
from .models import Task


def task_to_dict(task):
    # We can't just use model_to_dict here because the User isn't JSON-serializable.
    # TODO: I should probably install DRF at some point
    return {
        "id": task.id,
        "parent": task.parent_id,
        "text": task.text,
        "sort_order": task.sort_order,
        "done": task.done,
    }


class MainView(LoginRequiredMixin, TemplateView):
    template_name = "idl_tracker/main.html"


class LoginHealthCheck(LoginRequiredMixin, View):
    """
    A basic healthcheck endpoint. The frontend can poll this, and will receive a redirect to the
    login page if the user's session has lapsed.
    """
    def get(self, request, *args, **kwargs):
        return JsonResponse({"success": True})


class GetAllTasksView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        tasks = list(Task.objects.filter(parent=None, users=request.user))
        new_tasks = tasks

        while len(new_tasks) > 0:
            new_tasks = Task.objects.filter(parent__in=new_tasks)
            tasks.extend(new_tasks)

        return JsonResponse({
            t.id: task_to_dict(t)
            for t in tasks
        })


class AjaxTaskView(LoginRequiredMixin, FormView):
    model = Task
    success_url = "/"
    template_name = ""

    def dispatch(self, request, *args, **kwargs):
        if not self.request.is_ajax():
            raise Http404

        self.request = request
        return super().dispatch(request, *args, **kwargs)

    def resolve_form(self, form):
        # Must set self.object.
        pass

    def form_invalid(self, form):
        return JsonResponse({"errors": form.errors})

    def form_valid(self, form):
        self.resolve_form(form)
        return JsonResponse(task_to_dict(self.object))


class NewTaskView(AjaxTaskView):
    form_class = NewTaskForm

    def resolve_form(self, form):
        self.object = form.save()
        self.object.users.add(self.request.user)


class DeleteTaskView(AjaxTaskView):
    form_class = DeleteTaskForm

    def resolve_form(self, form):
        self.object = self.model.objects.get(id=form.cleaned_data["id"])
        parent = self.object.parent
        self.object.delete()


class EditTaskView(AjaxTaskView):
    form_class = EditTaskForm

    def resolve_form(self, form):
        self.object = self.model.objects.get(id=form.cleaned_data["id"])
        data = form.cleaned_data

        if "text" in data:
            self.object.text = data["text"]

        if "parent" in data:
            self.object.parent_id = data["parent"]

        if "sort_order" in data:
            self.object.sort_order = data["sort_order"]

        self.object.save()


class SetDoneTaskView(AjaxTaskView):
    form_class = SetDoneTaskForm

    def resolve_form(self, form):
        self.object = self.model.objects.get(id=form.cleaned_data["id"])
        self.object.done = form.cleaned_data["done"]
        self.object.save()
