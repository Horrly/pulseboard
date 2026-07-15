import pytest
from core.models import User
from core.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


# ── Registration ──────────────────────────────────────────────────────────────

def test_register_valid_returns_201_with_tokens(api_client):
    resp = api_client.post('/api/auth/register/', {
        'email': 'new@example.com',
        'password': 'S3cur3-Pass!',
        'first_name': 'Alice',
        'last_name': 'Smith',
    })
    assert resp.status_code == 201
    assert resp.data['user']['email'] == 'new@example.com'
    assert 'access' in resp.data
    assert 'refresh' in resp.data
    assert User.objects.filter(email='new@example.com').exists()


def test_register_duplicate_email_returns_400(api_client):
    UserFactory(email='dupe@example.com')
    resp = api_client.post('/api/auth/register/', {
        'email': 'dupe@example.com',
        'password': 'S3cur3-Pass!',
        'first_name': 'A',
        'last_name': 'B',
    })
    assert resp.status_code == 400


def test_register_weak_password_returns_400(api_client):
    resp = api_client.post('/api/auth/register/', {
        'email': 'weak@example.com',
        'password': '12345678',
        'first_name': 'A',
        'last_name': 'B',
    })
    assert resp.status_code == 400


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_correct_credentials_returns_200(api_client):
    UserFactory(email='login@example.com', password='CorrectPass123!')
    resp = api_client.post('/api/auth/login/', {
        'email': 'login@example.com',
        'password': 'CorrectPass123!',
    })
    assert resp.status_code == 200
    assert 'access' in resp.data
    assert 'refresh' in resp.data
    assert resp.data['user']['email'] == 'login@example.com'


def test_login_wrong_password_returns_401(api_client):
    UserFactory(email='login2@example.com')
    resp = api_client.post('/api/auth/login/', {
        'email': 'login2@example.com',
        'password': 'WrongPassword!',
    })
    assert resp.status_code == 401
    assert resp.data == {'detail': 'Invalid credentials.'}


def test_login_unknown_email_returns_401(api_client):
    resp = api_client.post('/api/auth/login/', {
        'email': 'nobody@example.com',
        'password': 'Whatever123!',
    })
    assert resp.status_code == 401


# ── /me ───────────────────────────────────────────────────────────────────────

def test_me_with_token_returns_user_data(auth_client, user):
    resp = auth_client.get('/api/auth/me/')
    assert resp.status_code == 200
    assert resp.data['email'] == user.email
    assert 'preferred_unit' in resp.data
    assert 'preferred_news_categories' in resp.data
    assert 'default_city' in resp.data


def test_me_without_token_returns_401(api_client):
    resp = api_client.get('/api/auth/me/')
    assert resp.status_code == 401


# ── Preferences ───────────────────────────────────────────────────────────────

def test_update_preferences_unit(auth_client, user):
    resp = auth_client.patch('/api/auth/preferences/', {'preferred_unit': 'F'})
    assert resp.status_code == 200
    assert resp.data['preferred_unit'] == 'F'
    user.refresh_from_db()
    assert user.preferred_unit == 'F'


def test_update_preferences_news_categories(auth_client, user):
    resp = auth_client.patch('/api/auth/preferences/', {
        'preferred_news_categories': ['technology', 'science'],
    })
    assert resp.status_code == 200
    assert set(resp.data['preferred_news_categories']) == {'technology', 'science'}


def test_update_preferences_invalid_category_returns_400(auth_client):
    resp = auth_client.patch('/api/auth/preferences/', {
        'preferred_news_categories': ['invalid_category'],
    })
    assert resp.status_code == 400


def test_update_preferences_default_city(auth_client, user):
    resp = auth_client.patch('/api/auth/preferences/', {'default_city': 'Tokyo'})
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.default_city == 'Tokyo'


def test_update_preferences_unauthenticated_returns_401(api_client):
    resp = api_client.patch('/api/auth/preferences/', {'preferred_unit': 'F'})
    assert resp.status_code == 401


# ── Token refresh ─────────────────────────────────────────────────────────────

def test_token_refresh_returns_new_access(api_client):
    UserFactory(email='refresh@example.com', password='RefreshPass123!')
    login_resp = api_client.post('/api/auth/login/', {
        'email': 'refresh@example.com',
        'password': 'RefreshPass123!',
    })
    refresh_token = login_resp.data['refresh']
    resp = api_client.post('/api/auth/token/refresh/', {'refresh': refresh_token})
    assert resp.status_code == 200
    assert 'access' in resp.data
