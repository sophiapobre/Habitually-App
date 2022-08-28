#!/bin/bash
python manage.py migrate --noinput
python manage.py loaddata base_data.json
