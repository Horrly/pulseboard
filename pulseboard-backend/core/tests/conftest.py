import pytest
from rest_framework.test import APIClient
from core.tests.factories import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def auth_client(user):
    client = APIClient()
    resp = client.post('/api/auth/login/', {
        'email': user.email,
        'password': 'TestPass123!',
    })
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    return client
