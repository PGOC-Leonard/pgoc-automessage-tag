import os

class Config:
    # Read database URI from environment variable (use a default if not set)
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///users.db')  # Default is SQLite
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable tracking modifications for performance
    
    # Read the secret key from environment variable (use a default if not set)
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')  # Default secret key (should not be used in production)
