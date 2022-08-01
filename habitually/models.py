from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    def __str__(self):
        return f"{self.username}"


class Category(models.Model):
    category = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.category}"


class Habit(models.Model):
    creation_time = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User,
                                on_delete=models.CASCADE,
                                related_name="habits")
    name = models.CharField(max_length=21)
    category = models.ForeignKey(Category,
                                 on_delete=models.CASCADE,
                                 related_name="habits")

    def __str__(self):
        return f"{self.name}"


class Completion(models.Model):
    doer = models.ForeignKey(User, on_delete=models.CASCADE,
                             related_name="completion_status")
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE,
                              related_name="completion_status")
    time = models.DateField(auto_now_add=False)
    status = models.BooleanField(null=False)

    def __str__(self):
        return f"{self.status}"
