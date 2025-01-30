import os
from dotenv import load_dotenv
from flask import request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta, datetime
import re
from models.models import db, bcrypt, User
from flask_jwt_extended import get_jwt_identity
import redis
import random
import string
import json
import mysql.connector
import shutil
import base64
from werkzeug.utils import secure_filename
from PIL import Image
import io

load_dotenv()

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
tag_redis = redis.Redis(host='redis', port=6379, db=3, decode_responses=True)
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('MYSQL_HOST'),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        database=os.getenv('MYSQL_DB'),
        port=os.getenv('MYSQL_PORT')
    )
    
def register():
    data = request.get_json()

    # Validate input fields
    if not data or not data.get('username') or not data.get('password') or not data.get('email') or not data.get('gender') or not data.get('domain'):
        return jsonify({'message': 'Username, email, password, gender, and domain are required'}), 400

    # Gender validation (either male or female)
    gender = data['gender'].lower()
    if gender not in ['male', 'female']:
        return jsonify({'message': 'Gender must be either male or female'}), 400

    # Determine the image path based on gender
    image_path = 'assets/male.png' if gender == 'male' else 'assets/female.png'

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Check if the username already exists
        cursor.execute("SELECT * FROM users WHERE username = %s", (data['username'],))
        if cursor.fetchone():
            return jsonify({'message': 'Username already exists'}), 400

        # Check if the email already exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({'message': 'Email already exists'}), 400

        # Hash the password before storing
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

        # Generate a random 10-digit user ID
        userid = random.randint(1000000000, 9999999999)

        # Open the image file and read it as binary
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()

        # Insert the new user into the database with `user_status` set to 'pending' and save the domain
        cursor.execute(
            """
            INSERT INTO users (id, username, email, password, gender, profile_image, user_status, domain_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (userid, data['username'], data['email'], hashed_password, gender, image_data, 'pending', data['domain'])
        )
        connection.commit()

        return jsonify({'message': 'User registered successfully'}), 201

    finally:
        cursor.close()
        connection.close()

def login():
    data = request.get_json()

    if not data or (not data.get('username') and not data.get('email')) or not data.get('password') or not data.get('domain'):
        return jsonify({'message': 'Username/email, password, and domain are required'}), 400

    username_or_email = data.get('username') or data.get('email')
    domain = data.get('domain')

    def is_email(value):
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        return re.match(email_regex, value) is not None

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Query user by username or email
        if is_email(username_or_email):
            cursor.execute("SELECT * FROM users WHERE email = %s", (username_or_email,))
        else:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username_or_email,))

        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Invalid username/email'}), 401
        
        # Validate password
        if not bcrypt.check_password_hash(user['password'], data['password']):
            return jsonify({'message': 'Password does not match'}), 401

        # Check domain
        db_domain = user['domain_url']
        
        # Allow specific domain exception for local login
        if db_domain != domain and not (db_domain == "pgoc-automessage-tag.vercel.app" and domain == "192.168.0.19"):
            return jsonify({'message': 'Your account cannot be found in this domain. Please log in to your dedicated domain.'}), 403

        # Check user status
        user_status = user['user_status']
        if user_status == 'pending':
            return jsonify({'message': 'Your account is still waiting for activation.'}), 403
        elif user_status == 'deactivated':
            return jsonify({'message': 'Your account is deactivated. Proceed with payment to continue using the service.'}), 403
        elif user_status == 'banned':
            return jsonify({'message': 'Your account is banned.'}), 403

        # Generate JWT token
        access_token = create_access_token(
            identity=str(user['id']),  # Ensure identity is a string
            expires_delta=timedelta(days=2)
        )

        redis_key = f"{user['id']}-access-key"

        keys = redis_client.keys(f"*{redis_key}*")
        if keys:
            print(f"Redis key(s) found for user ID '{user['id']}'")
        else:
            print(f"No Redis key(s) found for user ID '{user['id']}'")

        existing_redis_key = keys
        if existing_redis_key:
            return jsonify({
                'message': 'Login successful',
                'user_id': user['id'],  # Return user ID
                'access_token': access_token,
                'redis_key': redis_key
            }), 200
        else:
            redis_value = user['username']
            redis_client.setex(redis_key, timedelta(days=7), redis_value)
            tag_redis.setex(redis_key, timedelta(days=7), redis_value)

            # Update the user's last_active timestamp
            cursor.execute(
                "UPDATE users SET last_active = %s WHERE id = %s",
                (datetime.utcnow(), user['id'])
            )
            connection.commit()

            return jsonify({
                'message': 'Login successful',
                'user_id': user['id'],  # Return user ID
                'access_token': access_token,
                'redis_key': redis_key
            }), 200

    finally:
        cursor.close()
        connection.close()

            
def get_user_data_by_id():
    data = request.get_json()

    if not data or not data.get('user_id'):
        return jsonify({'message': 'User ID required'}), 400

    user_id = data.get('user_id')

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Fetch user data by user ID
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if user:

            # Convert the profile_image (binary data) to Base64 string
            if user['profile_image']:
                profile_image_base64 = base64.b64encode(user['profile_image']).decode('utf-8')
            else:
                profile_image_base64 = None  # In case there's no image

            # Prepare user data
            user_data = {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'gender': user['gender'],
                'last_active': user['last_active'],
                'profile_image': profile_image_base64  # Now sending a Base64 encoded string
            }

            return jsonify({
                'message': 'User authenticated successfully',
                'user_data': user_data
            }), 200

        return jsonify({'message': 'User not found'}), 404

    finally:
        cursor.close()
        connection.close()

# Helper function to check image size
def allowed_image_size(image):
    if len(image) > MAX_IMAGE_SIZE:
        return False
    return True

def change_profile_image():
    data = request.form.to_dict()  # To handle form-data
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400
    
    # Check if file is in the request
    if 'profile_image' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['profile_image']

    # Check if the file is an image and within size limit
    if file:
        file.seek(0)  # Reset file pointer before reading
        if not allowed_image_size(file.read()):
            return jsonify({'message': 'File is too large. Maximum size is 10MB.'}), 400
        file.seek(0)  # Reset file pointer for image processing

        try:
            # Open the image with PIL to check its type (optional)
            image = Image.open(file)
            image_format = image.format.lower()

            # Check if the image format is valid
            if image_format not in ['jpeg', 'png', 'jpg']:
                return jsonify({'message': 'Invalid image format. Only JPEG, JPG, or PNG are allowed.'}), 400

            # Reduce the resolution of the image to a smaller size (optional)
            max_dimension = 800  # Set a max dimension for width or height
            image.thumbnail((max_dimension, max_dimension))  # Resize to fit within max_dimension x max_dimension

            # Convert the image to a byte array
            image_byte_array = io.BytesIO()
            image.save(image_byte_array, format=image_format)

            # Get the binary data of the image
            image_data = image_byte_array.getvalue()

            # Check if the image size is within allowed limits
            if not allowed_image_size(image_data):
                return jsonify({'message': 'Resized image is too large. Maximum size is 10MB.'}), 400

            # Connect to database and update the profile image as BLOB
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            try:
                # Update the profile image in the database as BLOB
                cursor.execute(
                    "UPDATE users SET profile_image = %s WHERE id = %s",
                    (image_data, user_id)
                )
                connection.commit()

                return jsonify({'message': 'Profile image updated successfully'}), 200

            finally:
                cursor.close()
                connection.close()
        
        except Exception as e:
            return jsonify({'message': f'Error processing the image: {str(e)}'}), 500
    
    else:
        return jsonify({'message': 'No file uploaded or invalid file.'}), 400