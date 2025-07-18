# Generated by Django 5.2.3 on 2025-07-15 22:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Image",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(unique=True)),
                ("image", models.ImageField(upload_to="uploads/")),
            ],
        ),
        migrations.CreateModel(
            name="Object",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("user_id", models.CharField(max_length=100)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("GUIDE", "Guider"),
                            ("ALIGN", "Alignment"),
                            ("TARGET", "Target"),
                        ],
                        max_length=10,
                    ),
                ),
                ("right_ascension", models.FloatField()),
                ("declination", models.FloatField()),
                ("priority", models.IntegerField(default=0.0)),
                ("aux", models.JSONField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name="InstrumentConfig",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "instrument",
                    models.CharField(
                        choices=[("IMACS f/4", "Imacs F4"), ("IMACS f/2", "Imacs F2")],
                        max_length=20,
                    ),
                ),
                ("version", models.IntegerField()),
                ("filters", models.JSONField()),
                ("dispersers", models.JSONField()),
                ("aux", models.JSONField()),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        fields=("instrument", "version"),
                        name="unique_instrument_version",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="Mask",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=20)),
                ("user_id", models.CharField(max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("finalized", "Finalized (sent to be cut)"),
                            ("completed", "Completed (mask has been cut successfully)"),
                        ],
                        default="draft",
                        max_length=100,
                    ),
                ),
                ("features", models.JSONField()),
                ("instrument_version", models.IntegerField()),
                ("instrument_setup", models.JSONField()),
                (
                    "excluded_obj_list",
                    models.ManyToManyField(
                        blank=True,
                        related_name="objs_not_on_mask",
                        to="maskgen_api.object",
                    ),
                ),
                (
                    "objects_list",
                    models.ManyToManyField(
                        blank=True, related_name="objs_on_mask", to="maskgen_api.object"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ObjectList",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_id", models.CharField(max_length=100)),
                ("name", models.CharField(max_length=100)),
                (
                    "objects_list",
                    models.ManyToManyField(blank=True, to="maskgen_api.object"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField()),
                ("user_id", models.CharField()),
                ("center_ra", models.FloatField()),
                ("center_dec", models.FloatField()),
                ("images", models.ManyToManyField(blank=True, to="maskgen_api.image")),
                ("masks", models.ManyToManyField(blank=True, to="maskgen_api.mask")),
                (
                    "obj_list",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="maskgen_api.objectlist",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="mask",
            constraint=models.UniqueConstraint(
                fields=("user_id", "name"), name="unique_mask_name"
            ),
        ),
        migrations.AddConstraint(
            model_name="objectlist",
            constraint=models.UniqueConstraint(
                fields=("name", "user_id"), name="unique_obj_list_per_user"
            ),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(
                fields=("name", "user_id"), name="unique_project_per_user"
            ),
        ),
    ]
