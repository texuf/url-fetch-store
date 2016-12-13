web: gunicorn project.app:app --log-file -
worker: celery worker --app=project.app.celery
