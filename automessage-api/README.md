RUN CELERY celery -A config.make_celery worker --concurrency=10 --loglevel=INFO

PURGE CELERY celery -A config.make_celery purge


CREATING DOCKER IMAGE docker build -f Dockerfile.api -t react-flask-app-api .


redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)