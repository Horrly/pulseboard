from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/', views.register, name='auth-register'),
    path('auth/login/', views.login, name='auth-login'),
    path('auth/logout/', views.logout, name='auth-logout'),
    path('auth/me/', views.me, name='auth-me'),
    path('auth/preferences/', views.update_preferences, name='auth-preferences'),
    # SimpleJWT token refresh (used by the frontend Axios interceptor)
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── Weather ───────────────────────────────────────────────────────────────
    path('weather/current/', views.weather_current, name='weather-current'),
    path('weather/forecast/', views.weather_forecast, name='weather-forecast'),

    # ── News ──────────────────────────────────────────────────────────────────
    path('news/', views.news_feed, name='news-feed'),
]
