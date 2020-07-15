from django.contrib.auth.models import User
from .models import Player
from django.forms import ModelForm
from django.contrib.auth.forms import UserCreationForm

class PlayerCreationForm (UserCreationForm):
    class Meta():
        model = User
        fields = ["username", "password1", "password2", "email"]