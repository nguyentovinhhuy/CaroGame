from django.shortcuts import render, redirect
from django.http import HttpResponseForbidden, HttpResponseNotAllowed
from .models import Player
from .forms import PlayerCreationForm
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.contrib.auth.decorators import login_required
# Create your views here.

def IndexView (request):
    if (request.user.is_authenticated):
        player = Player.objects.get(user= request.user)
        return render(request, "core/index.html", context= {"user_authenticated": True, "player": player})
    return render(request, "core/index.html")

def LoginView (request):
    if request.method == "GET":
        return render(request, "user/login.html")
    elif request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username= username, password= password)
        if user is not None:
            login(request, user)
            return redirect("caro:index")
        else:
            messages.add_message(request, messages.INFO, "Invalid username or password, please try again")
            return redirect("caro:login")
    else:
        return HttpResponseNotAllowed

def RegisterView (request):
    if request.method == "GET":
        register_form = PlayerCreationForm()
        return render(request, "user/register.html", context= {"register_form": register_form})
    elif request.method == "POST":
        user_form = PlayerCreationForm(request.POST)
        if user_form.is_valid():
            logout(request)
            new_user = user_form.save()
            new_player = Player(user= new_user)
            new_player.save()
            login(request, new_user)
            return redirect("caro:index")
        else:
            messages.add_message(request, messages.INFO, "Something went wrong, please try again.")
            return redirect("caro:register")
    else:
        return HttpResponseNotAllowed

def LogoutView (request):
    logout(request)
    return redirect("caro:index")

@login_required
def LobbyView (request):
    if (request.user.is_authenticated):
        player = Player.objects.get(user= request.user)
        return render(request, "game/lobby.html", context= {"user_authenticated": True, "player": player})
