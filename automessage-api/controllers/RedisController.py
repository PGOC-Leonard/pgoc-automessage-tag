import os

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import redis
import json
from datetime import timedelta

# Initialize Redis client


redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
scheduled_db = redis.Redis(host='redis', port=6379, db=2, decode_responses=True)



def saveScheduledMessage(data, redis_key):
    """
    Save data to Redis as a list, appending unique messages to the existing list.
    Assign a unique index to each message and ensure the new message is inserted at the first index.
    If duplicates exist, return an error without saving new data.
    """
    try:
        # Ensure the data is a dictionary before processing
        if not isinstance(data, dict):
            raise ValueError("Data is not a dictionary. Received type: " + str(type(data)))

        # Check if the Redis key exists
        if not redis_client.exists(redis_key):
            # If the key doesn't exist, initialize it with an empty list
            redis_client.set(redis_key, json.dumps([]))

        # Fetch existing data from Redis
        existing_data = redis_client.get(redis_key)

        # Try loading the existing data as JSON
        try:
            existing_data = json.loads(existing_data)
            if not isinstance(existing_data, list):
                raise ValueError("Existing data is not a list")
        except (json.JSONDecodeError, ValueError):
            # If the data is not valid, reset it to an empty list
            existing_data = []

        # Check for duplicates in the existing data
        for existing_message in existing_data:
            is_duplicate = all(
                data.get(key) == existing_message.get(key)
                for key in [
                    "page_id", "access_token", "max_workers", "message_title",
                    "start_date", "end_date", "start_time", "end_time",
                    "schedule_date", "schedule_time"
                ]
            )
            if is_duplicate:
                return {"status": "error", "error": "Duplicate data found, message not saved.", "code": 409}

        # Assign a unique index to the new message (starting from 1)
        new_index = len(existing_data)
        data["index"] = new_index  # Assign the unique index to the new message

        # Insert the new message at the beginning of the list
        existing_data.insert(0, data)

        # Save updated data back to Redis as a JSON list
        redis_client.set(redis_key, json.dumps(existing_data))

        return {
            "status": "success",
            "message": "New message saved successfully.",
            "index": data["index"],
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}

    
def getScheduledJobs():
    try:
        # Get all keys in Redis
        keys = redis_client.keys('*')  # Adjust pattern to filter specific keys, if necessary

        scheduled_messages = {}

        for key in keys:
            # Check if the key is already a string, no need to decode
            redis_key = key if isinstance(key, str) else key.decode('utf-8')

            # Fetch data for each key
            data = redis_client.get(redis_key)

            try:
                # Parse data as JSON
                data_json = json.loads(data)

                # Ensure the data is a list of dictionaries
                if isinstance(data_json, list):
                    for message in data_json:
                        # Check if the message status is "Scheduled"
                        if message.get('status') == "Scheduled":
                            if redis_key not in scheduled_messages:
                                scheduled_messages[redis_key] = []  # Initialize a list for this key
                            # Add the relevant message data
                            scheduled_messages[redis_key].append({
                                "page_id": message.get("page_id", ""),
                                "access_token": message.get("access_token", ""),
                                "start_date": message.get("start_date", ""),
                                "end_date": message.get("end_date", ""),
                                "message_title": message.get("message_title", ""),
                                "text_message": message.get("text_message", ""),
                                "schedule_date": message.get("schedule_date", ""),
                                "schedule_time": message.get("schedule_time", ""),
                                "message_data": message
                            })
                else:
                    continue  # Skip if the data isn't in the expected format
            except json.JSONDecodeError:
                continue  # Skip if data isn't valid JSON

        return {
            "status": "success",
            "message": "Scheduled messages fetched successfully",
            "data": scheduled_messages
        } if scheduled_messages else {
            "status": "success",
            "message": "No scheduled messages found",
            "data": {}
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}

def getScheduleMessage(redis_key):
    try:
        # Check if the Redis key exists
        if not redis_client.exists(redis_key):
            return {"status": "error", "message": "Key not found or expired"}

        # Fetch the data from Redis
        data = redis_client.get(redis_key)

        # Ensure the data is a valid JSON list (a list of dictionaries)
        try:
            data_json = json.loads(data)  # Parse the JSON string into a Python list of dictionaries
            if isinstance(data_json, list):
                # If the data is a list, return it as expected
                return {"status": "success", "message": "Data fetched successfully", "data": data_json}
            else:
                # If the data is not a list, return an error message
                return {"status": "error", "message": "Data is not in expected format (list of dicts)"}
        except json.JSONDecodeError:
            return {"status": "error", "message": "Failed to decode data from Redis"}

    except Exception as e:
        return {"status": "error", "error": str(e)}

def updateScheduleMessageData(redis_key, target_index, edited_schedule_data):
    """
    Update a specific scheduled message in Redis based on its `index` field.
    """
    try:
        # Check if the Redis key exists
        if not redis_client.exists(redis_key):
            return {"status": "error", "message": "Redis key not found or expired"}

        # Fetch current data from Redis
        current_data = redis_client.get(redis_key)

        # Parse the current data from Redis into a list of dictionaries
        try:
            current_data = json.loads(current_data)
            if not isinstance(current_data, list):
                return {"status": "error", "message": "Data in Redis is not in the expected list format"}
        except (json.JSONDecodeError, ValueError):
            return {"status": "error", "message": "Invalid data format in Redis"}

        # Find the object with the matching `index` field
        message_to_update = next((msg for msg in current_data if msg.get("index") == target_index), None)

        if not message_to_update:
            return {"status": "error", "message": f"No message found with index {target_index}"}

        # Update the found message
        message_to_update.update(edited_schedule_data)

        # Save the updated list back to Redis
        redis_client.set(redis_key, json.dumps(current_data))

        # Return success with the updated message
        return {
            "status": "success",
            "message": "Message updated successfully",
            "updated_message": message_to_update,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}




def updateScheduleMessageByFields(redis_key, update_data):
    """
    Update a specific scheduled message in Redis based on multiple fields.
    """
    try:
        # Check if the Redis key exists
        if not redis_client.exists(redis_key):
            return {"status": "error", "message": "Redis key not found or expired"}

        # Fetch current data from Redis
        current_data = redis_client.get(redis_key)

        # Parse the current data from Redis into a list of dictionaries
        try:
            current_data = json.loads(current_data)
            if not isinstance(current_data, list):
                return {"status": "error", "message": "Data in Redis is not in the expected list format"}
        except (json.JSONDecodeError, ValueError):
            return {"status": "error", "message": "Invalid data format in Redis"}

        # Search for the message with matching fields
        updated_message = None
        for message in current_data:
            # Check if the message matches the criteria
            if (message.get('page_id') == update_data.get('page_id') and
                message.get('access_token') == update_data.get('access_token') and
                message.get('max_workers') == update_data.get('max_workers') and
                message.get('message_title') == update_data.get('message_title') and
                message.get('start_date') == update_data.get('start_date') and
                message.get('end_date') == update_data.get('end_date') and
                message.get('start_time') == update_data.get('start_time') and
                message.get('end_time') == update_data.get('end_time') and
                message.get('schedule_date') == update_data.get('schedule_date') and
                message.get('schedule_time') == update_data.get('schedule_time')):
                
                # Update the found message with the new data
                message.update(update_data)
                updated_message = message
                break
        
        if updated_message is None:
            return {"status": "error", "message": "No matching message found to update"}

        # Save the updated list back to Redis
        redis_client.set(redis_key, json.dumps(current_data))

 
        # Return success with the updated message
        
        return {
            "status": "success",
            "message": "Message updated successfully",
            "updated_message": updated_message,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
    
def updateScheduledDB(redis_key, update_data):
    """
    Update a specific scheduled job in Redis and stop its current Celery task if necessary.
    
    Args:
        redis_key (str): The Redis key for the scheduled database.
        update_data (dict): Data containing fields for identification and update (including `index`).
    
    Returns:
        dict: Status and updated data information.
    """
    try:
        # Check if the Redis key exists
        if not scheduled_db.exists(redis_key):
            return {"status": "error", "message": "Redis key not found or expired"}

        # Fetch current data from Redis
        current_data = scheduled_db.get(redis_key)

        # Parse the current data into a list of dictionaries
        try:
            current_data = json.loads(current_data)
            if not isinstance(current_data, list):
                return {"status": "error", "message": "Data in Redis is not in the expected list format"}
        except (json.JSONDecodeError, ValueError):
            return {"status": "error", "message": "Invalid data format in Redis"}

        # Ensure the index is provided
        index_to_update = update_data.get('index')
        if index_to_update is None:
            return {"status": "error", "message": "Index is required in the update data"}

        # Check if the index is valid
        if not isinstance(index_to_update, int):
            return {"status": "error", "message": "Index should be an integer"}

        # Define the list of outer fields to synchronize from message_data
        outer_fields = [
            "access_token", "end_date", "message_title", 
            "page_id", "schedule_date", "schedule_time", 
            "start_date", "text_message"
        ]

        # Search for the job by index inside `message_data` and update it
        updated_job = None
        for job in current_data:
            if isinstance(job, dict) and isinstance(job.get("message_data"), dict):
                if job["message_data"].get("index") == index_to_update:

                    # Sync specified fields from message_data to the outer job structure
                    for field in outer_fields:
                        if field in update_data:
                            job[field] = update_data[field]

                    # Update `message_data` with the new fields from `update_data`
                    job["message_data"].update(update_data)

                    updated_job = job
                    break

        if updated_job is None:
            return {"status": "error", "message": f"No job found with index {index_to_update}"}

        # Save the updated list back to Redis
        scheduled_db.set(redis_key, json.dumps(current_data))

        # Return success with the updated job
        return {
            "status": "success",
            "message": "Job updated successfully",
            "updated_job": updated_job,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}



#### TESTING FUNCTIONS
def getScheduledJobsData(redis_key):
    try:
        # Check if the Redis key exists
        if not scheduled_db.exists(redis_key):
            return {"status": "error", "message": "Key not found or expired"}

        # Fetch the data from Redis
        data = scheduled_db.get(redis_key)

        # Ensure the data is a valid JSON list (a list of dictionaries)
        try:
            data_json = json.loads(data)  # Parse the JSON string into a Python list of dictionaries
            if isinstance(data_json, list):
                # If the data is a list, return it as expected
                return {"status": "success", "message": "Data fetched successfully", "data": data_json}
            else:
                # If the data is not a list, return an error message
                return {"status": "error", "message": "Data is not in expected format (list of dicts)"}
        except json.JSONDecodeError:
            return {"status": "error", "message": "Failed to decode data from Redis"}

    except Exception as e:
        return {"status": "error", "error": str(e)}