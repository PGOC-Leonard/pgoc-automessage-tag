from datetime import datetime, timedelta, timezone
import json
import time
from controllers.schedulemessage import scheduled_blueprint
from controllers.sseevents import events_blueprint
from celery_workers.celery_routes import celery_blueprint
from controllers.schedulercontroller import run_scheduler
from flask import Flask, Response
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import logging
from dotenv import load_dotenv
import os
from config.config import Config
from config.celery_config import celery_init_app
from models.models import db, bcrypt
from controllers.Login import register, login



load_dotenv()

def create_app():

    # Create the Flask application
    app = Flask(__name__)
  
    # Enable Cross-Origin Resource Sharing (CORS) globally
    CORS(app)
    # Set up logging for Flask
    app.logger.setLevel(logging.DEBUG)

    # Load other configurations
    app.config.from_object(Config)
    # JWT secret key setup from environment variables
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

    # Celery Configuration using environment variables and in the required dictionary format
    app.config["CELERY"] = {
        "broker_url": os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/1'),
        "result_backend": os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1'),
        'timezone': 'Asia/Manila', 
    }
 
    
    # Initialize Celery with the Flask app context
    celery = celery_init_app(app)
    celery.set_default()

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt = JWTManager(app)

    run_scheduler()
    # Flush Redis database at startup (optional)
    with app.app_context():
        db.create_all()
        # redis_client.flushall()  # Uncomment if you want to flush Redis at startup
        
 
    @app.route('/')
    def serve_react_app():
        return "This is PGOC API"
    
 
    # Register routes
    app.route('/register', methods=['POST'])(register)
    app.route('/login', methods=['POST'])(login)
    app.register_blueprint(scheduled_blueprint)
    app.register_blueprint(celery_blueprint)
    
    app.register_blueprint(events_blueprint)
        
    return app

