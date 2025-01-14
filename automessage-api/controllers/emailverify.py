from flask import Blueprint, render_template, request, jsonify
import os
import mysql.connector
import redis
from flask_mail import Mail, Message
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

# Initialize Flask extensions
mail = Mail()
email_verification_bp = Blueprint('email_verification', __name__)

# Redis client for email verification (db=6)
redis_client_email = redis.Redis(host='redis', port=6379, db=6, decode_responses=True)

# Configure Flask-Mail
def configure_mail(app):
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False') == 'True'
    mail.init_app(app)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('MYSQL_HOST'),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        database=os.getenv('MYSQL_DB'),
        port=int(os.getenv('MYSQL_PORT', 3306))
    )

# Generate a unique verification code (UUID)
def generate_verification_code():
    return str(uuid.uuid4())

# Endpoint to request email verification
@email_verification_bp.route('/verify-email', methods=['POST'])
def send_verification_email():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('domain'):
        return jsonify({'message': 'Email and domain are required'}), 400

    email = data['email']
    domain = data['domain']

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Verify if email is already registered
        cursor.execute("SELECT * FROM users WHERE email = %s AND domain_url = %s", (email, domain))
        user = cursor.fetchone()
        if user:
            return jsonify({'message': 'Email is already registered'}), 400

        # Generate verification code and save in Redis (expires in 10 minutes)
        verification_code = generate_verification_code()[:6]  # Truncate UUID to first 6 characters for simplicity
        redis_client_email.setex(f"email_verification:{verification_code}", 300, email)  # 10-minute TTL

        # Send verification email
        try:
            msg = Message(
                subject="Email Verification Code",
                sender=os.getenv('MAIL_USERNAME'),
                recipients=[email],
                html=render_template(
                    'verification.html',
                    verification_code=verification_code,
                    domain=domain,
                    year=2025
                )
            )
            mail.send(msg)
        except Exception as e:
            return jsonify({'message': 'Failed to send email', 'error': str(e)}), 500

        return jsonify({'message': 'Verification email sent successfully'}), 200

    finally:
        cursor.close()
        connection.close()


# Endpoint to verify email token
@email_verification_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    # Check if the token exists in Redis
    email = redis_client_email.get(f"email_verification:{token}")
    if not email:
        return jsonify({'message': 'Invalid or expired verification token'}), 400

    # Token is valid, return success response
    return jsonify({'message': 'Token is valid. Email verified successfully.'}), 200
