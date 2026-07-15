from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import User, NEWS_CATEGORY_CHOICES


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name')

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Full user representation including dashboard preferences."""

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'avatar', 'preferred_unit', 'preferred_news_categories',
            'default_city', 'date_joined',
        )
        read_only_fields = ('id', 'email', 'date_joined')


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Lightweight serializer for PATCH /api/auth/preferences/."""

    preferred_news_categories = serializers.ListField(
        child=serializers.ChoiceField(choices=NEWS_CATEGORY_CHOICES),
        required=False,
    )

    class Meta:
        model = User
        fields = ('preferred_unit', 'preferred_news_categories', 'default_city')
