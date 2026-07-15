from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# Valid temperature units
UNIT_CHOICES = [('C', 'Celsius'), ('F', 'Fahrenheit')]

# Standard NewsAPI categories
NEWS_CATEGORY_CHOICES = [
    'business', 'entertainment', 'general',
    'health', 'science', 'sports', 'technology',
]


class User(AbstractUser):
    """
    Extended user model with PulseBoard-specific preferences.

    preferred_unit         — temperature display unit (°C or °F).
    preferred_news_categories — ordered list of NewsAPI categories the user
                              cares about, stored as a JSON array.
                              e.g. ["technology", "science", "health"]
    default_city           — the city shown on first load of the weather widget.
    avatar                 — optional profile picture.
    """

    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    preferred_unit = models.CharField(
        max_length=1,
        choices=UNIT_CHOICES,
        default='C',
        help_text='Temperature display unit: C (Celsius) or F (Fahrenheit).',
    )

    # Stored as a JSON list so we avoid a PostgreSQL-only ArrayField and keep
    # SQLite compatibility during local development.
    preferred_news_categories = models.JSONField(
        default=list,
        blank=True,
        help_text='Ordered list of NewsAPI category strings the user prefers.',
    )

    default_city = models.CharField(
        max_length=100,
        default='London',
        help_text='City name used for the default weather lookup.',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def save(self, *args, **kwargs):
        # Keep username in sync with email so the admin works cleanly.
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    def clean_preferred_news_categories(self):
        """Validate that all supplied categories are known NewsAPI categories."""
        invalid = [c for c in self.preferred_news_categories if c not in NEWS_CATEGORY_CHOICES]
        if invalid:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                f'Invalid news categories: {invalid}. '
                f'Choose from: {NEWS_CATEGORY_CHOICES}'
            )


# ── Weather cache ─────────────────────────────────────────────────────────────

class WeatherCache(models.Model):
    """
    Stores the last OWM current-weather response for a city.
    city_key is normalised (lower-cased, stripped) so 'London' and 'london'
    share the same cache entry.
    """
    city_key = models.CharField(max_length=150, unique=True)
    data = models.JSONField()
    fetched_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Weather Cache'
        verbose_name_plural = 'Weather Caches'

    def is_stale(self, max_age_minutes=10):
        """Return True if the cached entry is older than max_age_minutes."""
        age = timezone.now() - self.fetched_at
        return age.total_seconds() > max_age_minutes * 60

    def __str__(self):
        return f'WeatherCache({self.city_key}) @ {self.fetched_at:%Y-%m-%d %H:%M}'


class ForecastCache(models.Model):
    """
    Stores the last OWM 5-day/3-hour forecast response for a city,
    parsed into daily summaries.
    """
    city_key = models.CharField(max_length=150, unique=True)
    data = models.JSONField()
    fetched_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Forecast Cache'
        verbose_name_plural = 'Forecast Caches'

    def is_stale(self, max_age_minutes=10):
        age = timezone.now() - self.fetched_at
        return age.total_seconds() > max_age_minutes * 60

    def __str__(self):
        return f'ForecastCache({self.city_key}) @ {self.fetched_at:%Y-%m-%d %H:%M}'


class NewsCache(models.Model):
    """
    Stores the last NewsAPI top-headlines response for a (country, category)
    pair, e.g. cache_key = 'ng:technology'.
    Cached for 10 minutes to avoid hammering the free-tier rate limit.
    """
    cache_key = models.CharField(max_length=80, unique=True)
    data = models.JSONField()
    fetched_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'News Cache'
        verbose_name_plural = 'News Caches'

    def is_stale(self, max_age_minutes=10):
        age = timezone.now() - self.fetched_at
        return age.total_seconds() > max_age_minutes * 60

    def __str__(self):
        return f'NewsCache({self.cache_key}) @ {self.fetched_at:%Y-%m-%d %H:%M}'


