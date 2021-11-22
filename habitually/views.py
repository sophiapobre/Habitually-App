from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Category, Habit, Completion

# Create your views here.

def index(request):
    categories = Category.objects.all()
    return render(request, "habitually/index.html", {
        "categories": categories
    })


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
    # For a POST request, create a new habit
    if request.method == "POST":
        # Store data in Habit model fields and save
        habit = Habit()
        habit.creator = request.user
        habit.name = request.POST["habit"]
        habit.category = Category.objects.get(category=request.POST["category"])
        habit.save()
    return HttpResponseRedirect(reverse("index"))