import factory
from factory.django import DjangoModelFactory
from core.models import User


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    username = factory.LazyAttribute(lambda o: o.email)
    first_name = factory.Sequence(lambda n: f'First{n}')
    last_name = factory.Sequence(lambda n: f'Last{n}')
    preferred_unit = 'C'
    preferred_news_categories = factory.LazyFunction(list)
    default_city = 'London'
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop('password', 'TestPass123!')
        manager = cls._get_manager(model_class)
        user = manager.create_user(*args, **kwargs)
        user.set_password(password)
        user.save(update_fields=['password'])
        return user
