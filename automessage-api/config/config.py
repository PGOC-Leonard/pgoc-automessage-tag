import os

from dotenv import load_dotenv

load_dotenv()

class Config:
    # MySQL Database URI
    MYSQL_HOST = os.getenv('MYSQL_HOST', '192.168.0.19')  # Use the service name 'mysql' from docker-compose.yml
    MYSQL_USER = os.getenv('MYSQL_USER', 'PGOCADMIN')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '@_PGOCEncrypted54.')
    MYSQL_DB = os.getenv('MYSQL_DB', 'automessage_tag_db')
    MYSQL_PORT = os.getenv('MYSQL_PORT', '3308')

    # SQLAlchemy Database URI
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable SQLAlchemy modification tracking

    # Other configurations
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/1')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/1')
