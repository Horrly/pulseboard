"""
Tests for the weather caching layer.

Key invariant under test:
  A second call to /api/weather/current/ within 10 minutes must NOT trigger
  an external HTTP request to OpenWeatherMap.
"""
import pytest
from unittest.mock import patch, MagicMock
from django.utils import timezone
from datetime import timedelta

from core.models import WeatherCache, ForecastCache
from core.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

# ── Shared fixtures ───────────────────────────────────────────────────────────

FAKE_CURRENT_PAYLOAD = {
    'city': 'London',
    'country': 'GB',
    'temp': 15.0,
    'feels_like': 13.5,
    'humidity': 72,
    'wind_speed': 4.2,
    'description': 'Partly cloudy',
    'icon_code': '02d',
}

FAKE_OWM_CURRENT = {
    'name': 'London',
    'sys': {'country': 'GB'},
    'main': {'temp': 15.0, 'feels_like': 13.5, 'humidity': 72},
    'wind': {'speed': 4.2},
    'weather': [{'description': 'partly cloudy', 'icon': '02d'}],
}

FAKE_OWM_FORECAST = {
    'city': {'name': 'London'},
    'list': [
        {
            'dt_txt': '2024-01-15 09:00:00',
            'main': {'temp': 10.0},
            'weather': [{'description': 'cloudy', 'icon': '03d'}],
        },
        {
            'dt_txt': '2024-01-15 12:00:00',
            'main': {'temp': 14.0},
            'weather': [{'description': 'sunny', 'icon': '01d'}],
        },
        {
            'dt_txt': '2024-01-16 09:00:00',
            'main': {'temp': 8.0},
            'weather': [{'description': 'rainy', 'icon': '10d'}],
        },
        {
            'dt_txt': '2024-01-16 12:00:00',
            'main': {'temp': 11.0},
            'weather': [{'description': 'rainy', 'icon': '10d'}],
        },
    ],
}


@pytest.fixture
def auth_client(db):
    """Authenticated API client via JWT."""
    from rest_framework.test import APIClient
    user = UserFactory()
    client = APIClient()
    resp = client.post('/api/auth/login/', {
        'email': user.email,
        'password': 'TestPass123!',
    })
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    return client


def _mock_owm_response(json_data, status_code=200):
    mock = MagicMock()
    mock.status_code = status_code
    mock.json.return_value = json_data
    return mock


# ── /api/weather/current/ ─────────────────────────────────────────────────────

class TestWeatherCurrentCaching:

    def test_first_call_hits_owm_and_caches(self, auth_client, settings):
        """Fresh call with no cache entry should call OWM and store result."""
        settings.OWM_API_KEY = 'test-key'
        with patch('core.views.requests.get',
                   return_value=_mock_owm_response(FAKE_OWM_CURRENT)) as mock_get:
            resp = auth_client.get('/api/weather/current/?city=London')

        assert resp.status_code == 200
        mock_get.assert_called_once()
        assert WeatherCache.objects.filter(city_key='london').exists()
        data = resp.json()
        assert data['city'] == 'London'
        assert data['temp'] == 15.0
        assert data['icon_code'] == '02d'

    def test_second_call_within_10_min_does_not_hit_owm(self, auth_client, settings):
        """
        THE CORE CACHING TEST.
        A second call while the cache is fresh must return cached data
        without making any external HTTP request.
        """
        settings.OWM_API_KEY = 'test-key'

        # Pre-seed a fresh cache entry (fetched_at = now)
        WeatherCache.objects.create(
            city_key='london',
            data=FAKE_CURRENT_PAYLOAD,
            fetched_at=timezone.now(),
        )

        with patch('core.views.requests.get') as mock_get:
            resp = auth_client.get('/api/weather/current/?city=London')

        assert resp.status_code == 200
        # No external call should have been made
        mock_get.assert_not_called()
        assert resp.json()['city'] == 'London'

    def test_stale_cache_triggers_fresh_owm_fetch(self, auth_client, settings):
        """Cache older than 10 minutes must be refreshed via OWM."""
        settings.OWM_API_KEY = 'test-key'

        stale_time = timezone.now() - timedelta(minutes=11)
        WeatherCache.objects.create(
            city_key='london',
            data={'city': 'London (stale)', 'temp': 0.0},
            fetched_at=stale_time,
        )

        with patch('core.views.requests.get',
                   return_value=_mock_owm_response(FAKE_OWM_CURRENT)) as mock_get:
            resp = auth_client.get('/api/weather/current/?city=London')

        assert resp.status_code == 200
        mock_get.assert_called_once()
        # Cache should be updated with fresh data
        refreshed = WeatherCache.objects.get(city_key='london')
        assert refreshed.data['city'] == 'London'

    def test_cache_key_is_case_insensitive(self, auth_client, settings):
        """'london' and 'London' must share the same cache entry."""
        settings.OWM_API_KEY = 'test-key'

        WeatherCache.objects.create(
            city_key='london',
            data=FAKE_CURRENT_PAYLOAD,
            fetched_at=timezone.now(),
        )

        with patch('core.views.requests.get') as mock_get:
            resp = auth_client.get('/api/weather/current/?city=LONDON')

        assert resp.status_code == 200
        mock_get.assert_not_called()

    def test_city_not_found_returns_404(self, auth_client, settings):
        """OWM 404 should map to a 404 with a human-readable message."""
        settings.OWM_API_KEY = 'test-key'
        with patch('core.views.requests.get',
                   return_value=_mock_owm_response({}, status_code=404)):
            resp = auth_client.get('/api/weather/current/?city=NotARealCity123')

        assert resp.status_code == 404
        assert 'not found' in resp.json()['detail'].lower()

    def test_missing_city_param_returns_400(self, auth_client):
        """Omitting the city param should return 400 Bad Request."""
        resp = auth_client.get('/api/weather/current/')
        assert resp.status_code == 400

    def test_unauthenticated_request_returns_401(self):
        from rest_framework.test import APIClient
        resp = APIClient().get('/api/weather/current/?city=London')
        assert resp.status_code == 401


# ── /api/weather/forecast/ ────────────────────────────────────────────────────

class TestWeatherForecastCaching:

    def test_first_call_hits_owm_and_caches_forecast(self, auth_client, settings):
        settings.OWM_API_KEY = 'test-key'
        with patch('core.views.requests.get',
                   return_value=_mock_owm_response(FAKE_OWM_FORECAST)) as mock_get:
            resp = auth_client.get('/api/weather/forecast/?city=London')

        assert resp.status_code == 200
        mock_get.assert_called_once()
        assert ForecastCache.objects.filter(city_key='london').exists()
        data = resp.json()
        assert 'forecast' in data
        assert len(data['forecast']) == 2  # 2 unique dates in FAKE_OWM_FORECAST

    def test_second_forecast_call_uses_cache(self, auth_client, settings):
        """Second forecast call within 10 min must NOT hit OWM."""
        settings.OWM_API_KEY = 'test-key'

        ForecastCache.objects.create(
            city_key='london',
            data={'city': 'London', 'forecast': []},
            fetched_at=timezone.now(),
        )

        with patch('core.views.requests.get') as mock_get:
            resp = auth_client.get('/api/weather/forecast/?city=London')

        assert resp.status_code == 200
        mock_get.assert_not_called()

    def test_forecast_parses_daily_min_max(self, auth_client, settings):
        """Verify min/max temps are correctly parsed from 3-hourly data."""
        settings.OWM_API_KEY = 'test-key'
        with patch('core.views.requests.get',
                   return_value=_mock_owm_response(FAKE_OWM_FORECAST)):
            resp = auth_client.get('/api/weather/forecast/?city=London')

        forecast = resp.json()['forecast']
        jan15 = next(d for d in forecast if d['date'] == '2024-01-15')
        assert jan15['min_temp'] == 10.0
        assert jan15['max_temp'] == 14.0

    def test_forecast_missing_city_returns_400(self, auth_client):
        resp = auth_client.get('/api/weather/forecast/')
        assert resp.status_code == 400


# ── WeatherCache model unit tests ─────────────────────────────────────────────

class TestWeatherCacheModel:

    def test_is_stale_returns_false_when_fresh(self):
        cache = WeatherCache(fetched_at=timezone.now())
        assert cache.is_stale() is False

    def test_is_stale_returns_true_when_old(self):
        cache = WeatherCache(fetched_at=timezone.now() - timedelta(minutes=11))
        assert cache.is_stale() is True

    def test_is_stale_just_under_10_min_is_not_stale(self):
        """
        9 minutes 59 seconds old is NOT stale.
        (Tests the sub-threshold boundary without a race-condition on exact 600 s.)
        """
        cache = WeatherCache(fetched_at=timezone.now() - timedelta(minutes=9, seconds=59))
        assert cache.is_stale() is False

    def test_is_stale_exactly_10_min_is_stale(self):
        """
        Exactly 600 s is considered stale in practice because real clock time
        always pushes the age fractionally past the threshold by the time
        is_stale() runs.  This test documents the observed boundary behaviour.
        """
        cache = WeatherCache(fetched_at=timezone.now() - timedelta(minutes=10))
        # By the time is_stale() evaluates timezone.now(), elapsed > 600 s
        assert cache.is_stale() is True
