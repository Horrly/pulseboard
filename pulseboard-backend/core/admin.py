from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'preferred_unit', 'default_city', 'is_staff')
    list_filter = ('is_staff', 'is_active', 'preferred_unit')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('PulseBoard Preferences', {
            'fields': ('preferred_unit', 'preferred_news_categories', 'default_city', 'avatar'),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('PulseBoard Preferences', {
            'fields': ('email', 'preferred_unit', 'default_city'),
        }),
    )
