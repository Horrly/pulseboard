from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

import requests
import logging
from django.conf import settings
from django.utils import timezone
from collections import defaultdict

from .models import User, WeatherCache, ForecastCache
from .serializers import RegisterSerializer, UserSerializer, UserPreferencesSerializer

logger = logging.getLogger(__name__)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _token_pair(user):
    """Return a dict with fresh access + refresh JWT strings for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _normalise_city(city: str) -> str:
    """Lowercase + strip so cache keys are consistent."""
    return city.strip().lower()


# ── Auth endpoints ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/auth/register/
    Body: { email, password, first_name, last_name }
    Returns: { user, access, refresh }
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {'user': UserSerializer(user).data, **_token_pair(user)},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    POST /api/auth/login/
    Body: { email, password }
    Returns: { user, access, refresh }
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.check_password(password):
        return Response(
            {'detail': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {'detail': 'Account is disabled.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response({'user': UserSerializer(user).data, **_token_pair(user)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """GET /api/auth/me/ — return the authenticated user's profile."""
    return Response(UserSerializer(request.user).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    """
    PATCH /api/auth/preferences/
    Body (all optional): { preferred_unit, preferred_news_categories, default_city }
    Updates user preferences and returns the full updated user object.
    """
    serializer = UserPreferencesSerializer(
        request.user,
        data=request.data,
        partial=True,
    )
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    POST /api/auth/logout/
    Body: { refresh }
    Blacklisting is not enabled by default; this endpoint simply confirms
    logout — the client should discard both tokens locally.
    """
    # We don't blacklist by default (keeps things simple), but the endpoint
    # is here so the frontend has a consistent logout target.
    return Response({'detail': 'Logged out successfully.'})


# ── Weather endpoints ─────────────────────────────────────────────────────────

OWM_BASE = 'https://api.openweathermap.org/data/2.5'


def _owm_params(extra: dict) -> dict:
    """Build common OWM query-string params."""
    return {'appid': settings.OWM_API_KEY, 'units': 'metric', **extra}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weather_current(request):
    """
    GET /api/weather/current/?city={city_name}
    Returns: { city, country, temp, feels_like, humidity, wind_speed,
               description, icon_code }
    Caches results for 10 minutes in WeatherCache.
    """
    city = request.query_params.get('city', '').strip()
    if not city:
        return Response({'detail': 'city query parameter is required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    key = _normalise_city(city)

    # ── Cache hit ─────────────────────────────────────────────────────────────
    try:
        cached = WeatherCache.objects.get(city_key=key)
        if not cached.is_stale():
            return Response(cached.data)
    except WeatherCache.DoesNotExist:
        cached = None

    # ── Cache miss / stale — fetch from OWM ──────────────────────────────────
    if not settings.OWM_API_KEY:
        return Response({'detail': 'Weather service is not configured.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        owm_resp = requests.get(
            f'{OWM_BASE}/weather',
            params=_owm_params({'q': city}),
            timeout=8,
        )
    except requests.RequestException as exc:
        logger.error('OWM current request failed: %s', exc)
        return Response({'detail': 'Could not reach the weather service.'},
                        status=status.HTTP_502_BAD_GATEWAY)

    if owm_resp.status_code == 404:
        return Response({'detail': f"City '{city}' not found. Please check the spelling."},
                        status=status.HTTP_404_NOT_FOUND)

    if owm_resp.status_code != 200:
        logger.error('OWM returned %s: %s', owm_resp.status_code, owm_resp.text)
        return Response({'detail': 'Weather data unavailable. Please try again later.'},
                        status=status.HTTP_502_BAD_GATEWAY)

    raw = owm_resp.json()
    payload = {
        'city':        raw['name'],
        'country':     raw['sys']['country'],
        'temp':        round(raw['main']['temp'], 1),
        'feels_like':  round(raw['main']['feels_like'], 1),
        'humidity':    raw['main']['humidity'],
        'wind_speed':  round(raw['wind']['speed'], 1),
        'description': raw['weather'][0]['description'].capitalize(),
        'icon_code':   raw['weather'][0]['icon'],
    }

    # Upsert cache
    if cached:
        cached.data = payload
        cached.fetched_at = timezone.now()
        cached.save(update_fields=['data', 'fetched_at'])
    else:
        WeatherCache.objects.create(city_key=key, data=payload)

    return Response(payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weather_forecast(request):
    """
    GET /api/weather/forecast/?city={city_name}
    Returns a list of up to 5 daily summaries:
      [ { date, min_temp, max_temp, description, icon_code }, … ]
    Caches results for 10 minutes in ForecastCache.
    """
    city = request.query_params.get('city', '').strip()
    if not city:
        return Response({'detail': 'city query parameter is required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    key = _normalise_city(city)

    # ── Cache hit ─────────────────────────────────────────────────────────────
    try:
        cached = ForecastCache.objects.get(city_key=key)
        if not cached.is_stale():
            return Response(cached.data)
    except ForecastCache.DoesNotExist:
        cached = None

    # ── Fetch from OWM ────────────────────────────────────────────────────────
    if not settings.OWM_API_KEY:
        return Response({'detail': 'Weather service is not configured.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        owm_resp = requests.get(
            f'{OWM_BASE}/forecast',
            params=_owm_params({'q': city, 'cnt': 40}),
            timeout=8,
        )
    except requests.RequestException as exc:
        logger.error('OWM forecast request failed: %s', exc)
        return Response({'detail': 'Could not reach the weather service.'},
                        status=status.HTTP_502_BAD_GATEWAY)

    if owm_resp.status_code == 404:
        return Response({'detail': f"City '{city}' not found. Please check the spelling."},
                        status=status.HTTP_404_NOT_FOUND)

    if owm_resp.status_code != 200:
        return Response({'detail': 'Forecast data unavailable. Please try again later.'},
                        status=status.HTTP_502_BAD_GATEWAY)

    raw = owm_resp.json()

    # Parse 3-hourly list → daily min/max
    daily: dict[str, dict] = defaultdict(lambda: {
        'temps': [], 'descriptions': [], 'icons': []
    })
    for entry in raw.get('list', []):
        date_str = entry['dt_txt'][:10]          # "YYYY-MM-DD"
        daily[date_str]['temps'].append(entry['main']['temp'])
        daily[date_str]['descriptions'].append(entry['weather'][0]['description'])
        daily[date_str]['icons'].append(entry['weather'][0]['icon'])

    forecast = []
    for date_str in sorted(daily.keys())[:5]:
        d = daily[date_str]
        # Pick the most common icon/description for the day (midday if possible)
        icon = d['icons'][len(d['icons']) // 2]
        desc = d['descriptions'][len(d['descriptions']) // 2].capitalize()
        forecast.append({
            'date':        date_str,
            'min_temp':    round(min(d['temps']), 1),
            'max_temp':    round(max(d['temps']), 1),
            'description': desc,
            'icon_code':   icon,
        })

    payload = {'city': raw.get('city', {}).get('name', city), 'forecast': forecast}

    # Upsert cache
    if cached:
        cached.data = payload
        cached.fetched_at = timezone.now()
        cached.save(update_fields=['data', 'fetched_at'])
    else:
        ForecastCache.objects.create(city_key=key, data=payload)

    return Response(payload)


# ── News endpoint ─────────────────────────────────────────────────────────────

NEWSAPI_BASE = 'https://newsapi.org/v2'

VALID_CATEGORIES = {
    'general', 'technology', 'business',
    'sports', 'health', 'entertainment', 'science',
}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def news_feed(request):
    """
    GET /api/news/?category={category}&country={country}

    Proxies NewsAPI top-headlines and returns a clean array of up to 9
    articles:  { title, description, url, image_url, source, published_at }

    Responses are cached for 10 minutes per (category, country) pair using
    the NewsCache model.
    """
    from .models import NewsCache   # local import avoids circular refs

    category = request.query_params.get('category', 'general').strip().lower()
    country  = request.query_params.get('country',  'ng').strip().lower()

    if category not in VALID_CATEGORIES:
        return Response(
            {'detail': f"Invalid category '{category}'. "
                       f"Choose from: {sorted(VALID_CATEGORIES)}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cache_key = f'{country}:{category}'

    # ── Cache hit ─────────────────────────────────────────────────────────────
    try:
        cached = NewsCache.objects.get(cache_key=cache_key)
        if not cached.is_stale():
            return Response(cached.data)
    except NewsCache.DoesNotExist:
        cached = None

    # ── Fetch from NewsAPI ────────────────────────────────────────────────────
    if not settings.NEWS_API_KEY:
        return Response(
            {'detail': 'News service is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        news_resp = requests.get(
            f'{NEWSAPI_BASE}/top-headlines',
            params={
                'apiKey':   settings.NEWS_API_KEY,
                'category': category,
                'country':  country,
                'pageSize': 9,
            },
            timeout=8,
        )
    except requests.RequestException as exc:
        logger.error('NewsAPI request failed: %s', exc)
        return Response(
            {'detail': 'Could not reach the news service. Please try again later.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if news_resp.status_code == 401:
        return Response(
            {'detail': 'News service authentication failed.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if news_resp.status_code == 429:
        return Response(
            {'detail': 'News service rate limit exceeded. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if news_resp.status_code != 200:
        logger.error('NewsAPI returned %s: %s', news_resp.status_code, news_resp.text)
        return Response(
            {'detail': 'News data unavailable. Please try again later.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    raw       = news_resp.json()
    articles  = raw.get('articles', [])

    payload = [
        {
            'title':        (a.get('title') or '').strip(),
            'description':  (a.get('description') or '').strip(),
            'url':          a.get('url', ''),
            'image_url':    a.get('urlToImage') or '',
            'source':       (a.get('source') or {}).get('name', 'Unknown'),
            'published_at': a.get('publishedAt', ''),
        }
        for a in articles
        if (a.get('title') or '').strip()        # skip articles with no title
        and a.get('url')                          # skip articles with no URL
        and '[Removed]' not in (a.get('title') or '')
    ][:9]

    # Upsert cache
    if cached:
        cached.data       = payload
        cached.fetched_at = timezone.now()
        cached.save(update_fields=['data', 'fetched_at'])
    else:
        NewsCache.objects.create(cache_key=cache_key, data=payload)

    return Response(payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def news_search(request):
    """
    GET /api/news/search/?q={query}

    Proxies NewsAPI /everything with a free-text query.
    Results are NOT cached (search is ad-hoc).
    Returns up to 9 clean articles:
      { title, description, url, image_url, source, published_at }
    """
    query = request.query_params.get('q', '').strip()
    if not query:
        return Response(
            {'detail': 'Query parameter "q" is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.NEWS_API_KEY:
        return Response(
            {'detail': 'News service is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        news_resp = requests.get(
            f'{NEWSAPI_BASE}/everything',
            params={
                'apiKey':   settings.NEWS_API_KEY,
                'q':        query,
                'language': 'en',
                'sortBy':   'publishedAt',
                'pageSize': 9,
            },
            timeout=8,
        )
    except requests.RequestException as exc:
        logger.error('NewsAPI search request failed: %s', exc)
        return Response(
            {'detail': 'Could not reach the news service. Please try again later.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if news_resp.status_code == 401:
        return Response(
            {'detail': 'News service authentication failed.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if news_resp.status_code == 429:
        return Response(
            {'detail': 'News rate limit exceeded. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if news_resp.status_code != 200:
        logger.error('NewsAPI search returned %s: %s', news_resp.status_code, news_resp.text)
        return Response(
            {'detail': 'News search unavailable. Please try again later.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    raw      = news_resp.json()
    articles = raw.get('articles', [])

    payload = [
        {
            'title':        (a.get('title') or '').strip(),
            'description':  (a.get('description') or '').strip(),
            'url':          a.get('url', ''),
            'image_url':    a.get('urlToImage') or '',
            'source':       (a.get('source') or {}).get('name', 'Unknown'),
            'published_at': a.get('publishedAt', ''),
        }
        for a in articles
        if (a.get('title') or '').strip()
        and a.get('url')
        and '[Removed]' not in (a.get('title') or '')
    ][:9]

    return Response(payload)

