"""finalproject URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from habitually import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.index, name="index"),
    path("tracker", views.main_app, name="main_app"),
    path("error", views.main_app, name="error"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("add_habit/<str:type>", views.add_habit, name="add_habit"),

    # API Routes
    path("habitually/<str:doer>/<int:habit_id>/<str:date>/<str:action>", views.habit_completion_status, name="habit_completion_status"),
    path("habitually/<str:doer>/<int:habit_id>/delete", views.delete_habit, name="delete_habit"),
    path("habitually/overall_habit_completion_rate", views.overall_habit_completion_rate, name="overall_habit_completion_rate"),
    path("habitually/seven_day_habit_completion_rates", views.seven_day_habit_completion_rates, name="seven_day_completion_rates"),
    path("habitually/completion_streaks_per_habit/<str:streak>", views.completion_streaks_per_habit, name="completion_streaks_per_habit"),
    path("habitually/get_habit_count", views.get_habit_count, name="get_habit_count")
]
