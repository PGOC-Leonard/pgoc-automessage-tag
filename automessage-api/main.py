from datetime import datetime, timezone 
import os
import json
import logging
from dotenv import load_dotenv
from flask import Flask, Response
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from controllers.schedulemessage import scheduled_blueprint
from controllers.sseevents import events_blueprint
from celery_workers.celery_routes import celery_blueprint
from controllers.tagController import tags_blueprint
from controllers.schedulercontroller import run_scheduler
from controllers.Login import change_profile_image, get_user_data_by_id, register, login
from config.config import Config
from config.celery_config import celery_init_app
import mysql.connector

load_dotenv()

def create_app():
    # Create the Flask application
    app = Flask(__name__)
    
    # Enable Cross-Origin Resource Sharing (CORS) globally
    CORS(app)

    # Set up logging for Flask
    app.logger.setLevel(logging.DEBUG)

    # Load configurations
    app.config.from_object(Config)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

    # Celery Configuration using environment variables and dictionary format
    app.config["CELERY"] = {
        "broker_url": os.getenv('CELERY_BROKER_URL', 'redis://localhost:6380/1'),
        "result_backend": os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6380/1'),
        "timezone": "Asia/Manila",
    }

    # Initialize Celery
    celery = celery_init_app(app)
    celery.set_default()

    # Initialize JWT
    jwt = JWTManager(app)

    # Run Scheduler
    run_scheduler()

    # Database setup and table creation
    def init_db():
        try:
            connection = mysql.connector.connect(
                host=app.config['MYSQL_HOST'],
                user=app.config['MYSQL_USER'],
                password=app.config['MYSQL_PASSWORD'],
                database=app.config['MYSQL_DB'],
                port=app.config['MYSQL_PORT']    
            )
            
            cursor = connection.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                gender ENUM('male', 'female') NOT NULL,  -- Gender column
                profile_image LONGBLOB,  -- Column to store profile image data
                user_status ENUM('activated', 'deactivated', 'banned' , 'pending') NOT NULL DEFAULT 'pending',  -- User status column
                domain_url VARCHAR(255),  -- Domain URL column to store associated URLs
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
            connection.commit()
            cursor.close()
            connection.close()
            app.logger.info("Database initialized successfully.")
        except mysql.connector.Error as e:
            app.logger.error(f"Database initialization failed: {e}")

    with app.app_context():
        init_db()

    # Default route
    @app.route('/')
    def serve_react_app():
        return "This is PGOC API"

    # Register routes
    app.route('/register', methods=['POST'])(register)
    app.route('/login', methods=['POST'])(login)
    app.route('/user', methods=['POST'])(get_user_data_by_id)
    app.route('/change-profile', methods=['PUT'])(change_profile_image)
    app.register_blueprint(scheduled_blueprint)
    app.register_blueprint(celery_blueprint)
    app.register_blueprint(events_blueprint)
    app.register_blueprint(tags_blueprint)

    return app
