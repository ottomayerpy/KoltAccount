# Generated by Django 4.0.3 on 2022-04-24 13:40

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0002_cryptoparam_alter_account_id_alter_donation_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cryptosetting',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Пользователь'),
        ),
    ]
