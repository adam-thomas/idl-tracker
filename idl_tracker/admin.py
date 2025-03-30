from django.contrib import admin
from orderable.admin import OrderableAdmin

from .models import Task


admin.site.register(Task, OrderableAdmin)
