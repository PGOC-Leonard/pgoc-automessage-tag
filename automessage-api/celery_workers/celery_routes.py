from celery.result import AsyncResult
from celery_workers.celerytasks import say_hello
from controllers.RedisController import getScheduledJobsData
from flask import Blueprint, jsonify , request
from controllers.TagConversations import handle_tagging
from controllers.sendscheduledmessages import handlesendingmessage
from flask_jwt_extended import jwt_required, get_jwt_identity

#### THIS IS FOR TESTING ONLY
# Create a Blueprint for Celery-related routes
celery_blueprint = Blueprint('celery', __name__)

@celery_blueprint.route('/test-hello', methods=['GET'])
def test_hello():
    time = "12:59 PM"
    task = say_hello.apply_async(args=[time])
    return jsonify({'task_id': task.id, 'message': f'Scheduled task for {time}'}), 202

@celery_blueprint.route('/test-tagging', methods=['POST'])
@jwt_required()
def test_tag():
    user_id = get_jwt_identity()
    redis_key = f"{user_id}-access-key"
    try:
        task_data = request.get_json()
        if not task_data:
            return jsonify({"error" : "No Data provided"}), 400
        
        result = handle_tagging(redis_key,task_data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status" : "error", "message": str(e)}), 500
        


    
@celery_blueprint.route('/test-sendingmessage', methods=['POST'])
@jwt_required()
def test_handlesendingmessage():
    user_id = get_jwt_identity()
    try:
        # Get redis_key from the request
        redis_key = f"{user_id}-access-key"
        # Get message data from the request body
        if not redis_key:
            return jsonify({'message': 'Redis key is required'}), 400

        # Validate Redis key belongs to the user
        expected_redis_key = redis_key
        
        if redis_key != expected_redis_key:
            return jsonify({'message': 'Unauthorized: Redis key does not match'}), 401
        message_data = request.get_json()
        if not message_data:
            return jsonify({"error": "No message data provided"}), 400

        # Call the main function and get the result
        result = handlesendingmessage(redis_key,message_data)

        # Return the result as JSON
        return result, 200
    except Exception as e:
        # Handle unexpected errors
        return jsonify({"status": "error", "message": str(e)}), 500

    

    
@celery_blueprint.route('/getscheduled', methods=['GET'])
@jwt_required()
def getscheduled():
    user_id = get_jwt_identity()
    try:
        # Get redis_key from the request
        redis_key = f"{user_id}-access-key"

        if not redis_key:
            return jsonify({'message': 'Redis key is required'}), 400

        # Validate Redis key belongs to the user
        expected_redis_key = redis_key
        if redis_key != expected_redis_key:
            return jsonify({'message': 'Unauthorized: Redis key does not match'}), 401

        # Fetch the data using the modified getScheduleMessage function
        fetch_response = getScheduledJobsData(redis_key)

        # Check the response status
        if fetch_response["status"] != "success":
            return jsonify({"error": fetch_response.get("message", "Failed to fetch schedule message")}), 500

        return jsonify(fetch_response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
   

# Route to get the result of a task
@celery_blueprint.route('/result/<task_id>', methods=['GET'])
def task_status(task_id):
    # Fetch task status and result
    task = AsyncResult(task_id)
    response = {
        "task_id": task_id,
        "status": task.status,
        "result": str(task.result) if task.result else None  # Ensure result is serializable
    }
    return jsonify(response)
