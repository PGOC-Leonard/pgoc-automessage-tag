import os
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


redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
# Register Route
def register():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'message': 'Username, email, and password required'}), 400
    
    # Check if the username already exists
    existing_user_by_username = User.query.filter_by(username=data['username']).first()
    if existing_user_by_username:
        return jsonify({'message': 'Username already exists'}), 400

    # Check if the email already exists
    existing_user_by_email = User.query.filter_by(email=data['email']).first()
    if existing_user_by_email:
        return jsonify({'message': 'Email already exists'}), 400

    # Hash the password before storing
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
       # Generate a random 10-digit user ID
    def generate_userid():
        return random.randint(1000000000, 9999999999)  # 10-digit random number

    # Ensure the user ID is unique
    userid = generate_userid()


    # Create and store the new user
    new_user = User(id = userid, username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

#LoginRoute
def login():
    data = request.get_json()

    if not data or (not data.get('username') and not data.get('email')) or not data.get('password'):
        return jsonify({'message': 'Username/email and password required'}), 400

    username_or_email = data.get('username') or data.get('email')

    def is_email(value):
        email_regex = r'^[a-zAZ0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        return re.match(email_regex, value) is not None

    # Query user by username or email
    if is_email(username_or_email):
        user = User.query.filter_by(email=username_or_email).first()
    else:
        user = User.query.filter_by(username=username_or_email).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        # Generate JWT token (identity as string)
        access_token = create_access_token(
            identity=str(user.id),  # Ensure identity is a string
            expires_delta=timedelta(minutes=30)
        )

        # Combine the username to form the base Redis key (without random access key)

        redis_key = f"{user.id}-access-key"

        print (redis_key)
        keys = redis_client.keys(f"*{redis_key}*")

        
       
        if keys:
            print(f"Redis key(s) found for username '{user.id}'")
        else: 
              print(f"No Redis key(s) found for username '{user.id}'")

        
       

        # Check if the Redis key exists (only base key, without random access key)
        existing_redis_key = keys

        if existing_redis_key:
            # If the Redis key exists, return the existing key (reuse it)
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'redis_key': redis_key  # Return the existing Redis key
            }), 200
        else:
            # If no Redis key exists for this user, generate a new random access key
            
            # Combine the username and generated access key to form the final Redis key
            redis_key = f"{user.id}-access-key"

            # Store the new Redis key in Redis and set it to expire in 60 seconds
            redis_value = user.username  # Store the username as value in Redis
            redis_client.setex(redis_key, timedelta(minutes=60), redis_value)  # Expire in 60 seconds

            # Update the user's last_active timestamp
            user.last_active = datetime.utcnow()
            db.session.commit()

            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'redis_key': redis_key  # Return the new Redis key
            }), 200

    return jsonify({'message': 'Invalid username/email or password'}), 401