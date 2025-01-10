import time
from celery_workers.celerytasks import addScheduletoCeleryTask
from controllers.RedisController import saveScheduledMessage, getScheduleMessage, updateScheduleMessageByFields, updateScheduleMessageData, updateScheduledDB
from controllers.schedulercontroller import  run_scheduler, stop_schedule, update_scheduler
from controllers.sendscheduledmessages import handlesendingmessage
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import redis
import json
from datetime import datetime, timedelta
import pytz

scheduled_blueprint = Blueprint('schedulemessage', __name__)
manila_timezone = pytz.timezone('Asia/Manila')

# Initialize Redis client

redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

@scheduled_blueprint.route('/schedule-message', methods=['POST'])
@jwt_required()
def schedule_message():
    user_id = get_jwt_identity()

    try:
        # Get the data from the request
        data_scheduled_messages = request.get_json()
        if not data_scheduled_messages:
            return jsonify({"error": "No data provided"}), 400

        # Prepare responses
        responses = []
        redis_key = f"{user_id}-access-key"

        # Track if any message is scheduled for the future
        has_scheduled_message = False

        # Step 1: Check for duplicates before saving
        for message in data_scheduled_messages:
            print("Checking message:", message)
            save_response = saveScheduledMessage(message, redis_key)

            # If any message fails due to duplication, stop processing and return an error
            if save_response.get("status") != "success":
                if save_response.get("code") == 409:  # 409 is for duplicate
                    return jsonify({"error": save_response.get("error")}), 409
                else:
                    return jsonify({"error": save_response.get("error", "Failed to save message")}), 500

        # Step 2: Process messages and update status
        for message in data_scheduled_messages:
            update_data = {
                'page_id': message.get('page_id'),
                'access_token': message.get('access_token'),
                'max_workers': message.get('max_workers'),
                'message_title': message.get('message_title'),
                'start_date': message.get('start_date'),
                'end_date': message.get('end_date'),
                'start_time': message.get('start_time'),
                'end_time': message.get('end_time'),
                'schedule_date': message.get('schedule_date'),
                'schedule_time': message.get('schedule_time')
            }

            # If the message should run immediately, update its status
            if message.get('run_immediately') == True:
                for message in data_scheduled_messages:
                # Call handlesendingmessage for immediate execution
                    result = handlesendingmessage(redis_key,message)

                
                return result , 201

            else:
                # For scheduled messages, update the status as "Scheduled"
                has_scheduled_message = True
                update_data['status'] = 'Scheduled'
                updateScheduleMessageByFields(redis_key, update_data)

        # Step 3: Run the scheduler if there are scheduled messages
        if has_scheduled_message:
            scheduler_data = run_scheduler()

            # Filter jobs for the current Redis key
            scheduled_jobs = {}
            for category, category_jobs in scheduler_data.get("jobs", {}).items():
                if redis_key in category_jobs:
                    scheduled_jobs[category] = {redis_key: category_jobs[redis_key]}

            # Include scheduled jobs in the response
            if scheduled_jobs:
                responses.append({"scheduled_jobs": scheduled_jobs})

        return jsonify(responses), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scheduled_blueprint.route('/update-schedule-message', methods=['PUT'])
@jwt_required()
def update_schedule_message():
    user_id = get_jwt_identity()

    try:
        # Parse the incoming request data
        request_data = request.get_json()
        redis_key = f"{user_id}-access-key"

        # Extract `index` and `edited_schedule_data` from the request
        edited_schedule_data = request_data.get('edited_schedule_data')
        index = edited_schedule_data.get("index")

        # Validate required fields
        if not edited_schedule_data:
            return jsonify({'message': 'Edited data are required'}), 400

        # Check if the status is not "Scheduled"
        if edited_schedule_data.get("status") and edited_schedule_data["status"] != "Scheduled":
            return jsonify({'message': 'Only schedules with status "Scheduled" can be edited'}), 400
        
        task_id = edited_schedule_data.get("task_id")
        if task_id:
            stop_response = stop_schedule(task_id)
            
            if stop_response['status'] not in ['ABORTED', 'SUCCESS']:
                 # If task is not aborted or successful, do not update and return an error
                return jsonify({"error": "Failed to stop the task, update was not applied"}), 409

        # Step 1: Update the primary database
        db_update_response = updateScheduleMessageData(redis_key, index, edited_schedule_data)
        if db_update_response['status'] != 'success':
            return jsonify({"error": db_update_response.get("message", "Failed to update database")}), 500

        # Step 2: Update the Redis database and stop the existing task
        redis_update_response = updateScheduledDB(redis_key, edited_schedule_data)
        if redis_update_response['status'] != 'success':
            return jsonify({"error": redis_update_response.get("message", "Failed to update Redis database")}), 500
        
        updated_job = redis_update_response["updated_job"]

        # Step 4: Proceed to update the scheduler if task was aborted successfully
        rerun_response = update_scheduler(redis_key, updated_job)
        if rerun_response['status'] != 'success':
            return jsonify({"error": rerun_response.get("message", "Failed to rerun the scheduler")}), 500

        # Step 5: Return a successful response
        return jsonify({
            "status": "success",
            "message": "Schedule updated and re-scheduled successfully",
            "stop" : stop_response,
            # "updated job" : updated_job,
            # "updated_job": rerun_response["updated_job"]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@scheduled_blueprint.route('/get-schedule-message', methods=['GET'])
@jwt_required()
def get_schedule_message():
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
        fetch_response = getScheduleMessage(redis_key)

        # Check the response status
        if fetch_response["status"] != "success":
            return jsonify({"error": fetch_response.get("message", "Failed to fetch schedule message")}), 500

        return jsonify(fetch_response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scheduled_blueprint.route('/stop-schedule/<task_id>', methods=['POST'])
@jwt_required()
def stopschedule(task_id):
    try:
        # Call the stop_schedule logic
        response = stop_schedule(task_id)  # Assumes this returns a dict-like object
        task_status = response.get("status")
        task_result = response.get("result")

   
        return jsonify({
            "task_id": task_id,
            "status": task_status,
            "result": task_result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

