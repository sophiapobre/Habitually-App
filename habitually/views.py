from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from urllib.parse import urlencode

from .models import User, Category, Habit, Completion

import random
import datetime

DAYS_PER_WEEK = 7

HABIT_LIMIT = 10


# Homepage displaying video
def index(request):
    return render(request, "habitually/index.html")


# Main app view
def main_app(request):
    # Check if user is logged in
    if request.user.is_authenticated:
        categories = Category.objects.all()
        column_keys = list(reversed(range(0, 7)))
        user_habits = request.user.habits.all()

        # Create a list of the user's habits
        user_habits_list = request.user.habits.all().\
            values_list("name", flat=True)

        # Create a list of admin-created habits
        admin_habits = Habit.objects.filter(creator__in=[1, 2]).\
            values_list("name", flat=True)

        # Create a list of admin-created habits that  not in the user's habits
        not_user_habits = []
        for habit in admin_habits:
            if habit not in user_habits_list:
                not_user_habits.append(habit)

        # Create a list of 5 random habits to suggest to the user
        random.shuffle(not_user_habits)
        suggested_habits = not_user_habits[0:5]

        # Get error message parameter from add_habit()
        message = request.GET.get("message")
        # If message is None (no error), clear the variable
        if message is None:
            message = ""

        return render(request, "habitually/main_app.html", {
            "categories": categories,
            "column_keys": column_keys,
            "user_habits": user_habits,
            "suggested_habits": suggested_habits,
            "message": message
        })
    else:
        return render(request, "habitually/index.html")


# Login view, adapted from previous CSCI E-33a projects
def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("main_app"))
        else:
            return render(request, "habitually/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "habitually/login.html")


# Logout view, adapted from previous CSCI E-33a projects
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


# Registration page for user, adapted from previous CSCI E-33a projects
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
        return HttpResponseRedirect(reverse("main_app"))
    else:
        return render(request, "habitually/register.html")


# Add a new habit
@login_required
def add_habit(request, type):
    # Check if method is POST
    if request.method == "POST":
        # Display habit limit message if user already has 10 habits
        user_habits = request.user.habits.all()
        habit_count = user_habits.count()
        if habit_count == HABIT_LIMIT:
            message = "You've already reached the habit limit \
                      of 10! You may only add another habit if \
                      you delete an existing one."
            return add_habit_error_message(message)

        # Check if the user is trying to add their own new habit
        if type == "new":
            # Display error message if user has previously added the habit
            for user_habit in user_habits:
                if request.POST["habit"].casefold() == user_habit.name\
                                                       .casefold():
                    message = "You've already added this habit!"
                    return add_habit_error_message(message)

            # Create a new habit, store data in model fields and save
            habit = Habit()
            habit.creator = request.user
            habit.name = request.POST["habit"]
            habit.category = Category.objects.get(category=request
                                                  .POST["category"])
            habit.save()
        # Check if the user is choosing from among the suggested habits
        elif type == "suggested":
            # Get list of habits checked by the user
            habits = request.POST.getlist("habit")

            # Calculate the number of habits the user can still add
            allowable_new_habits = HABIT_LIMIT - habit_count

            # Display error message if user tries to add more than the limit
            if len(habits) > allowable_new_habits:
                message = "You cannot select " + str(len(habits)) +\
                          " suggested habits because it goes over \
                          the habit limit of 10!" + " Please \
                          select only " + str(allowable_new_habits)\
                          + " or delete existing ones."
                return add_habit_error_message(message)

            # For each suggested habit selected by the user in the form
            for suggested_habit in habits:
                # Get the category of the habit
                original_habit_obj = Habit.objects.get(name=suggested_habit,
                                                       creator__in=[1, 2])
                category = original_habit_obj.category

                # Create a new habit, store data in model fields and save
                habit = Habit()
                habit.creator = request.user
                habit.name = suggested_habit
                habit.category = category
                habit.save()
    return HttpResponseRedirect(reverse("main_app"))


# Redirect to main_app view while passing error message parameter in URL
def add_habit_error_message(message):
    # Adapted from D. Hepper at https://realpython.com/django-\
    # redirects/#passing-parameters-with-redirects
    base_url = reverse("main_app")
    query_string = urlencode({"message": "ERROR: " + message})
    url = "{}?{}".format(base_url, query_string)
    return redirect(url)


# Delete an existing habit
@login_required
def delete_habit(request, doer, habit_id):
    # Confirm that doer is current user
    if request.user.username == doer:
        try:
            # Try to get the habit and delete it
            habit = Habit.objects.get(pk=habit_id, creator=request.user)
            habit.delete()
            return JsonResponse({"message": "Habit deleted successfully."})
        except Habit.DoesNotExist:
            # Return an error message if the habit is not found
            return JsonResponse({"error": "Habit not found."}, status=404)
    else:
        # Return an error message if the does does not match current user
        return JsonResponse({"error": "An error occurred."}, status=404)


# Get or toggle habit completion status
@login_required
def habit_completion_status(request, doer, habit_id, date, action):
    # Confirm that doer is current user
    if request.user.username == doer:
        try:
            # Check if Completion object for that habit, doer, \
            # and date already exists
            completion = Completion.objects.get(habit=habit_id,
                                                doer=request.user,
                                                time=date)

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
                completion.habit = Habit.objects.get(pk=habit_id,
                                                     creator=request.user)
                completion.time = date
                completion.status = True
                completion.save()
        return JsonResponse({"habit_id": habit_id,
                            "date": completion.time,
                             "status": completion.status})
    else:
        return JsonResponse({"error": "An error occurred."}, status=404)


# Returns a list of the user's overall habit completion rate in the last 7 days
@login_required
def overall_habit_completion_rate(request):
    # Create a list to store completion rates
    completion_rates = []

    # Get all of the user's habits
    user_habits = request.user.habits.all()

    # For each of the last 7 days
    for i in range(6, -1, -1):
        # Get the date i days ago
        date = get_date_i_days_ago(i)

        # Initially set the habits completed on that date to 0
        habits_completed_on_date = 0

        # For each of the user's habits
        for habit in user_habits:
            try:
                # Try to retrieve a Completion for that date
                completion = Completion.objects.get(habit=habit.id,
                                                    doer=request.user,
                                                    time=date)

                # If the habit was completed on that date
                if completion.status:
                    # Add to the number of habits completed on that date
                    habits_completed_on_date += 1
            except Completion.DoesNotExist:
                # If the Completion does not exist for that date, do nothing
                pass

        # Round up the completion rate and append to the list
        completion_rate = round(habits_completed_on_date
                                / len(user_habits) * 100, 1)
        completion_rates.append(completion_rate)
    return JsonResponse(completion_rates, safe=False)


# Get the date depending on the number of days ago
def get_date_i_days_ago(i):
    date = datetime.date.today() - datetime.timedelta(days=i)
    return date


# Returns a dict with habit names and completion rates over the last 7 days
@login_required
def seven_day_habit_completion_rates(request):
    # Get the IDs of the user's habits
    user_habits = request.user.habits.all()

    # Create a dict to store the user's habits and completion rates
    seven_day_completion_rates = {}
    for habit in user_habits:
        # Reset the times completed to 0
        times_completed_this_week = 0

        # For each of the past 7 days
        for i in range(0, 7):
            # Get the date i days ago
            date = get_date_i_days_ago(i)

            # Get completion status of this habit for the day
            try:
                completion = Completion.objects.get(habit=habit.id,
                                                    doer=request.user,
                                                    time=date)
                if completion.status:
                    times_completed_this_week += 1
            except Completion.DoesNotExist:
                # Pass if the day has no completion data
                pass

        # Assign the rate to each habit name in the dict
        seven_day_completion_rates[habit.name] =\
            round(times_completed_this_week / DAYS_PER_WEEK * 100, 1)

        # Sort the completion rates in descending order
        sorted_dict = {}
        sorted_rates = sorted(seven_day_completion_rates.values(),
                              reverse=True)

        # Match the habit names to their rates and add to the sorted_dict
        for rate in sorted_rates:
            for habit in seven_day_completion_rates.keys():
                if seven_day_completion_rates[habit] == rate:
                    sorted_dict[habit] = seven_day_completion_rates[habit]
    return JsonResponse(sorted_dict)


# Returns a dict with each habit's current or longest completion streak
@login_required
def completion_streaks_per_habit(request, streak):
    # Get the user's habits
    user_habits = request.user.habits.all()

    # Get current date and day after for date range
    current_date = datetime.date.today()
    current_date_plus_one = current_date + datetime.timedelta(days=1)

    # Create a dict to store the user's habits and completions treaks
    habit_streaks = {}

    # For each of the user's habits
    for habit in user_habits:

        # Get a sorted list of all dates with completion data
        full_completion_data =\
            sorted(list(Completion.objects
                        .filter(habit=habit.id, doer=request.user,
                                time__range=["2000-01-01",
                                             current_date_plus_one])
                        .values_list("time", "status")))

        # Initialize a habit_streak variable
        habit_streak = 0

        # Check if there is completion data
        if len(full_completion_data) != 0:

            # Create a list with only dates that have True completion statuses
            completion_dates_true = []
            for i in range(len(full_completion_data)):
                if full_completion_data[i][1] is True:
                    # Add to list and convert to ordinal for later comparison
                    completion_dates_true\
                        .append(full_completion_data[i][0].toordinal())

            # Check if there are any dates with True completion statuses
            if len(completion_dates_true) != 0:
                # Check if longest streak was requested
                if streak == "longest":
                    # Set longest and current streak variables to 1
                    longest_streak = 1
                    current_longest_streak = 1

                    # For each date with a True completion status
                    for i in range(len(completion_dates_true) - 1):
                        # Check if next date in list is a consecutive date
                        if completion_dates_true[i] + 1 ==\
                                completion_dates_true[i + 1]:
                            # Add to current streak
                            current_longest_streak += 1
                            # Check if longest streak is greater than current
                            if current_longest_streak > longest_streak:
                                # Update longest streak
                                longest_streak = current_longest_streak
                        else:
                            # Reset current streak to 1
                            current_longest_streak = 1
                    # Store longest streak in habit_streak variable
                    habit_streak = longest_streak
                # Check if current streak was requested
                elif streak == "current":
                    # Check if most recent date with "True" is not current date
                    if completion_dates_true[-1] != current_date.toordinal():
                        # Set to 0 because user does not have a current streak
                        habit_streak = 0
                    else:
                        # Set to 1 because user has a current streak
                        habit_streak = 1

                        # Starting from end of list of dates with "True"
                        for i in range(len(completion_dates_true) - 1, 0, -1):
                            # Check if the previous item is the previous date
                            if completion_dates_true[i] - 1 ==\
                                    completion_dates_true[i - 1]:
                                habit_streak += 1
                            else:
                                # Stop counting because the streak was broken
                                break
            else:
                # Set streak to 0 if there are no dates with True statuses
                habit_streak = 0
        else:
            # Set streak to 0 if there is no completion data
            habit_streak = 0

        # Add habit name and longest streak data to the streaks dict
        habit_streaks[habit.id] = habit_streak
    return JsonResponse(habit_streaks)


# Get the number of habits the user has
@login_required
def get_habit_count(request):
    habit_count = len(request.user.habits.all())
    return JsonResponse({"habit_count": habit_count})
