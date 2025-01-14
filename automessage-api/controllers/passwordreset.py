from flask import Blueprint, render_template, request, jsonify
import os
import mysql.connector
import redis
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer as Serializer, BadSignature, SignatureExpired
from dotenv import load_dotenv
import uuid 
# To generate unique tokens

# Load environment variables
load_dotenv()

# Initialize Flask extensions
bcrypt = Bcrypt()
mail = Mail()
password_reset_bp = Blueprint('password_reset', __name__)

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

# Redis client for token management
redis_client = redis.Redis(host='redis', port=6379, db=5, decode_responses=True)

# Generate a unique token (UUID)
def generate_reset_token():
    return str(uuid.uuid4())

# Verify the token by checking if it exists in Redis
def verify_reset_token(token):
    # Check if the token exists in Redis
    passtoken = redis_client.get(f"reset_token:{token}")
    if not passtoken:
        return None  # Token not found or expired
    return passtoken

# Endpoint to request a password reset email
@password_reset_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('domain'):
        return jsonify({'message': 'Email and domain are required'}), 400

    email = data['email']
    domain = data['domain']

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Verify user existence
        cursor.execute("SELECT * FROM users WHERE email = %s AND domain_url = %s", (email, domain))
        user = cursor.fetchone()
        if not user:
            return jsonify({'message': 'User not found or domain mismatch'}), 404

        # Generate reset token and store in Redis (expires in 5 minutes)
        token = generate_reset_token()
        reset_link = f"http://{domain}/#/reset-password/{token}"
        redis_client.setex(f"reset_token:{token}", 300, email)  # Set TTL for 5 minutes

        # Send reset email using Flask-Mail
        try:
            msg = Message(
                subject="Password Reset Request",
                sender=os.getenv('MAIL_USERNAME'),
                recipients=[email],
                html= render_template('reset-template.html', reset_link=reset_link, domain=domain, year=2025)
                )
            mail.send(msg)
        except Exception as e:
            return jsonify({'message': 'Failed to send email', 'error': str(e)}), 500

        return jsonify({'message': 'Password reset email sent successfully'}), 200

    finally:
        cursor.close()
        connection.close()

# Endpoint to verify the reset token
@password_reset_bp.route('/reset-password/<token>', methods=['GET'])
def verify_reset_link(token):
    email = verify_reset_token(token)
    if email is None:
        return jsonify({'message': 'Invalid or expired reset token'}), 400

    return jsonify({'message': 'Token is valid. You can reset your password.'}), 200

# Endpoint to reset the user's password
@password_reset_bp.route('/new-password/<token>', methods=['POST'])
def reset_user_password(token):
    email = verify_reset_token(token)
    if email is None:
        return jsonify({'message': 'Invalid or expired reset token'}), 400

    data = request.get_json()
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({'message': 'New password is required'}), 400

    if len(new_password) < 8:  # Example password policy
        return jsonify({'message': 'Password must be at least 8 characters long'}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Hash and update password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        cursor.execute("""UPDATE users SET password = %s WHERE email = %s""", (hashed_password, email))
        connection.commit()

        # Delete the token from Redis after successful reset
        redis_client.delete(f"reset_token:{token}")

        return jsonify({'message': 'Password reset successfully'}), 200

    finally:
        cursor.close()
        connection.close()
