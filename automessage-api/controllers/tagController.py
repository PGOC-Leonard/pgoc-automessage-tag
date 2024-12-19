from datetime import datetime
import redis
import json
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import pytz
import requests
from controllers.TagConversations import handle_tagging
from controllers.TagRedisController import saveTagsTask, getTagTasks, updateTagByFields, updateTagData
from controllers.TagScheduler import run_tagscheduler, stop_tag_schedule

tags_blueprint = Blueprint('tagscheduler', __name__)

manila_timezone = pytz.timezone('Asia/Manila')

tag_redis = redis.Redis(host='redis', port=6379, db=3, decode_responses=True)



@tags_blueprint.route('/schedule-tag', methods =['POST'])
@jwt_required()
def schedule_tags():
    user_id = get_jwt_identity()
    try:
        # Get the data from the request
        data_scheduled_tag = request.get_json()
        if not data_scheduled_tag:
            return jsonify({"error": "No data provided"}), 400

        # Prepare responses
        responses = []
        redis_key = f"{user_id}-access-key"

        # Track if any message is scheduled for the future
        has_scheduled_message = False

        # Step 1: Check for duplicates before saving
        for tagData in data_scheduled_tag:
            print("Checking Data:",tagData)
            save_response = saveTagsTask(tagData, redis_key)

            # If any message fails due to duplication, stop processing and return an error
            if save_response.get("status") != "success":
                if save_response.get("code") == 409:  # 409 is for duplicate
                    return jsonify({"error": save_response.get("error")}), 409
                else:
                    return jsonify({"error": save_response.get("error", "Failed to save message")}), 500

        # Step 2: Process messages and update status
        for tagData in data_scheduled_tag:
            update_data = {
                'page_id': tagData.get('page_id'),
                'access_token': tagData.get('access_token'),
                'max_workers': tagData.get('max_workers'),
                'tag_id_name': tagData.get('tag_id_name'),
                'start_date': tagData.get('start_date'),
                'end_date': tagData.get('end_date'),
                'start_time': tagData.get('start_time'),
                'end_time': tagData.get('end_time'),
                'schedule_date': tagData.get('schedule_date'),
                'schedule_time': tagData.get('schedule_time'),
                'num_iterations': tagData.get('num_iterations'),
                'schedule_weekly': tagData.get('schedule_weekly'),
                'schedule_weekly': tagData.get('schedule_weekly'),
                'schedule_pattern': tagData.get('schedule_pattern'),
            }

            # If the message should run immediately, update its status
            if tagData.get('run_immediately') == True:
                
                result = handle_tagging(redis_key,tagData)
                response = result.get_json()
                if response.get('result') == "Success":
                    tagData['status'] = "Ongoing"
                else:
                    tagData['status'] = "Failed"
                
                updateTagByFields(redis_key, tagData)
                return response , 201      
            else:
                
                has_scheduled_message = True
                update_data['status'] = 'Scheduled'
                updateTagByFields(redis_key, tagData)
    
        if has_scheduled_message:
            responses = run_tagscheduler(redis_key,tagData)
        return jsonify(responses), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@tags_blueprint.route('/get-tags-data', methods =['GET'])
@jwt_required()
def get_tags_data():
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
        fetch_response = getTagTasks(redis_key)

        # Check the response status
        if fetch_response["status"] != "success":
            return jsonify({"error": fetch_response.get("message", "Failed to fetch schedule message")}), 500

        return jsonify(fetch_response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        

@tags_blueprint.route('/get-tags-list', methods =['GET'])
def get_tag_list():
    """
    Fetch tag texts from the API's settings section.
    """
    # Extract query parameters for page_id and access_token
    page_id = request.args.get('page_id')
    access_token = request.args.get('access_token')

    # Validate required query parameters
    if not page_id or not access_token:
        return jsonify({"error": "page_id and access_token are required"}), 400

    # API endpoint URL
    api_url = f"https://pages.fm/api/v1/pages/{page_id}/settings?access_token={access_token}"
    try:
        # Make GET request to the API endpoint
        response = requests.get(api_url)

        # Check if the request was successful
        if response.status_code == 200:
            # Parse JSON response
            data = response.json()

            # Navigate to "settings" and then "tags"
            tags = data.get("settings", {}).get("tags", [])

            # Extract the "text" from each tag object
            tag_texts = [tag.get("text") for tag in tags if "text" in tag]

            return jsonify({"tag_texts": tag_texts}), 200

        else:
            # If the API request failed, return an error
            return jsonify({"error": f"Failed to fetch data: {response.status_code}"}), response.status_code

    except requests.exceptions.RequestException as e:
        # Handle connection errors or exceptions
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
                

@tags_blueprint.route('/update-tag-data', methods = ['PUT'])
@jwt_required()
def update_tag_data ():
    user_id = get_jwt_identity()
    try:
        request_data = request.get_json()
        redis_key = f"{user_id}-access-key"   
        edited_tag_data = request_data    
        # Validate required fields
        if not edited_tag_data:
            return jsonify({'message': 'Edited data are required'}), 400
             
        index = edited_tag_data.get("index")
    # Check if the status is not "Scheduled"
        if edited_tag_data.get("status") and edited_tag_data["status"] != "Scheduled":
            return jsonify({'message': 'Only schedules with status "Scheduled" can be edited'}), 400
        
        task_id = edited_tag_data.get("task_id_schedule")
        if task_id:
            stop_response = stop_tag_schedule(task_id)
            
            if stop_response['status'] not in ['ABORTED', 'SUCCESS']:
                 # If task is not aborted or successful, do not update and return an error
                return jsonify({"error": "Failed to stop the task, update was not applied"}), 409
        
        db_update_response = updateTagData(redis_key, index, edited_tag_data)
        if db_update_response['status'] != 'success':
            return jsonify({"error": db_update_response.get("message", "Failed to update database")}), 500
        
        re_run = run_tagscheduler(redis_key,edited_tag_data)
         # Step 5: Return a successful response
        return jsonify({
            "status": "success",
            "message": "Schedule updated and re-scheduled successfully",
            "update_response" : db_update_response,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@tags_blueprint.route('/stop-tag-schedule/<task_id>', methods = ['POST'])
@jwt_required()
def stopTaskchedule(task_id):
    try:
        # Call the stop_schedule logic
        response = stop_tag_schedule(task_id)  # Assumes this returns a dict-like object
        task_status = response.get("status")
        task_result = response.get("result")

   
        return jsonify({
            "task_id": task_id,
            "status": task_status,
            "result": task_result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@tags_blueprint.route('/stop-tagging/<task_id>', methods = ['POST'])
@jwt_required()
def stopTagging(task_id):
    try:
        # Call the stop_schedule logic
        response = stop_tag_schedule(task_id)  # Assumes this returns a dict-like object
        task_status = response.get("status")
        task_result = response.get("result")

   
        return jsonify({
            "task_id": task_id,
            "status": task_status,
            "result": task_result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500