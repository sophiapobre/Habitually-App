from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Category, Habit, Completion

import random

import datetime

# Create your views here.

def index(request):
    # Check if user is logged in
    if request.user.is_authenticated:
        categories = Category.objects.all()
        column_keys = list(reversed(range(0, 7)))
        user_habits = request.user.habits.all()

        # Create a list of the user's habits
        user_habits_list = request.user.habits.all().values_list("name", flat=True)

        # Create a list of admin-created habits
        admin_habits = Habit.objects.filter(creator__in=[1, 2]).values_list("name", flat=True)

        # Create a list of admin-created habits that are not in the user's list of habits
        not_user_habits = []
        for habit in admin_habits:
            if habit not in user_habits_list:
                not_user_habits.append(habit)

        # Create a list of 5 random habits to suggest to the user
        random.shuffle(not_user_habits)
        suggested_habits = not_user_habits[0:5]

        return render(request, "habitually/index.html", {
            "categories": categories,
            "column_keys": column_keys,
            "user_habits": user_habits,
            "suggested_habits": suggested_habits
        })
    else:
        return render(request, "habitually/index.html")


def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "habitually/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "habitually/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "habitually/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "habitually/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "habitually/register.html")


# Add a new habit
@login_required
def add_habit(request):
    # Check if method is POST
    if request.method == "POST":
        # Display error message if user has previously added the habit
        user_habits = request.user.habits.all()
        for user_habit in user_habits:
            if request.POST["habit"].casefold() == user_habit.name.casefold():
                return render(request, "habitually/index.html", {
                    "categories": Category.objects.all(),
                    "user_habits": user_habits,
                    # TODO: Add suggested habits to this list, and refactor process from index?
                    "day_keys": list(reversed(range(0, 7))),
                    "message": "ERROR: You've already added this habit!"
                })

        # Store data in Habit model fields and save
        habit = Habit()
        habit.creator = request.user
        habit.name = request.POST["habit"]
        habit.category = Category.objects.get(category=request.POST["category"])
        habit.save()
    return HttpResponseRedirect(reverse("index"))


# Add suggested habits
@login_required
def add_suggested_habits(request):
    # Check if method is POST
    if request.method == "POST":
        # Get list of habits checked by the user
        habits = request.POST.getlist("habit")
        for habit in habits:
            # Get the category of the habit
            original_habit_obj = Habit.objects.get(name=habit, creator__in=[1, 2])
            category = original_habit_obj.category

            # Create a new habit for the user
            new_habit = Habit()
            new_habit.creator = request.user
            new_habit.name = habit
            new_habit.category = category
            new_habit.save()
    return HttpResponseRedirect(reverse("index"))


# Delete an existing habit
@login_required
def delete_habit(request, doer, habit_id):
    # Confirm that doer is current user
    if request.user.username == doer:
        try:
            habit = Habit.objects.get(pk=habit_id, creator=request.user)
            habit.delete()
            return JsonResponse({"message": "Habit deleted successfully."})
        except Habit.DoesNotExist:
            return JsonResponse({"error": "Habit not found."}, status=404)
    else:
        return JsonResponse({"error": "An error occurred."}, status=404)


# Get or toggle habit completion status
@login_required
def habit_completion_status(request, doer, habit_id, date, action):
    # Confirm that doer is current user
    if request.user.username == doer:
        try:
            # Check if Completion object for that habit, doer, and date already exists
            completion = Completion.objects.get(habit=habit_id, doer=request.user, time=date)

            # Check user's requested action
            if action == "get_status":
                return JsonResponse({"status": completion.status})
            elif action == "toggle_status":
                # Change status to opposite of current status
                completion.status = not completion.status
                completion.save()
        except Completion.DoesNotExist:

            # Check user's requested action
            if action == "get_status":
                return JsonResponse({"status": False})
            elif action == "toggle_status":
                # Create a new completion object and set status to True
                completion = Completion()
                completion.doer = request.user
                completion.habit = Habit.objects.get(pk=habit_id, creator=request.user)
                completion.time = date
                completion.status = True
                completion.save()
        return JsonResponse({"habit_id": habit_id, "date": completion.time, "status": completion.status})
    else:
        return JsonResponse({"error": "An error occurred."}, status=404)



@login_required
def overall_habit_completion_rate(request):
    completion_rates = []
    user_habits = request.user.habits.all().values_list("id", flat=True)

    for i in range(6, -1, -1):
        date = datetime.date.today() - datetime.timedelta(days=i)

        # Get date after date in focus for range (second argument in Python range is not included)
        # date_plus_one_day = date + datetime.timedelta(days=1)
        #habits_on_date = request.user.habits.filter(creation_time__range=["2021-11-15", date_plus_one_day]).values_list("id", flat=True)
        #habit_count_on_date = len(habits_on_date)

        # completion_rates.append(date)
        habits_completed_on_date = 0
        for habit_id in user_habits:
            try:
                completion = Completion.objects.get(habit=habit_id, doer=request.user, time=date)
                if completion.status == True:
                    habits_completed_on_date += 1
            except Completion.DoesNotExist:
                habits_completed_on_date += 0

        completion_rate = round(habits_completed_on_date / len(user_habits), 2)
        completion_rates.append(completion_rate)
    return JsonResponse(completion_rates, safe=False)
