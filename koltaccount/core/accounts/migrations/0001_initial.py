# Generated by Django 4.1.6 on 2023-02-16 09:13

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Account',
            fields=[
                ('created_time', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('modified_time', models.DateTimeField(auto_now=True, verbose_name='Модифицировано')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='UUID')),
                ('site', models.CharField(max_length=255, verbose_name='Сайт')),
                ('description', models.CharField(max_length=255, verbose_name='Описание')),
                ('login', models.CharField(max_length=255, verbose_name='Логин')),
                ('password', models.CharField(max_length=255, verbose_name='Пароль')),
            ],
            options={
                'verbose_name': 'Аккаунт',
                'verbose_name_plural': 'Аккаунты',
            },
        ),
    ]
