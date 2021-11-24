from django.contrib import admin

from .models import User, Category, Habit, Completion

# Register your models here.
class HabitAdmin(admin.ModelAdmin):
    list_display = ("id", "creator", "category", "name")

class CompletionAdmin(admin.ModelAdmin):
    list_display = ("id", "doer", "habit", "status", "time")


admin.site.register(User)
admin.site.register(Category)
admin.site.register(Habit, HabitAdmin)
admin.site.register(Completion, CompletionAdmin)
