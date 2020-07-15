from django.urls import path
from . import views

app_name = "caro"

urlpatterns = [
    path('', views.IndexView, name= "index"),
    path('user/login/', views.LoginView, name= "login"),
    path('user/register/', views.RegisterView, name= "register"),
    path('user/logout/', views.LogoutView, name= "logout"),
    path('lobby/', views.LobbyView, name= "lobby"),
]