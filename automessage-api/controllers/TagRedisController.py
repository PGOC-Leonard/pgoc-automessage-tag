import redis
import json

tag_redis = redis.Redis(host='redis', port=6379, db=3, decode_responses=True)
scheduled_tags = redis.Redis(host='redis', port=6379, db=4, decode_responses=True)

def saveTagsTask (data,redis_key):
    try:
        # Ensure the data is a dictionary before processing
        if not isinstance(data, dict):
            raise ValueError("Data is not a dictionary. Received type: " + str(type(data)))

        # Check if the Redis key exists
        if not tag_redis.exists(redis_key):
            # If the key doesn't exist, initialize it with an empty list
           tag_redis.set(redis_key, json.dumps([]))

        # Fetch existing data from Redis
        existing_data = tag_redis.get(redis_key)

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
                    "page_id", "access_token", "max_workers", "tag_id_name",
                    "start_date", "end_date", "start_time", "end_time",
                    "schedule_date", "schedule_time"
                ]
            )
            if is_duplicate:
                return {"status": "error", "error": "Duplicate data found, message not saved.", "code": 409}

        # Assign a unique index to the new message (starting from 1)
        new_index = len(existing_data)
        data["index"] = new_index
        data["Batch"] = f"Batch {new_index}" # Assign the unique index to the new message

        # Insert the new message at the beginning of the list
        existing_data.insert(0, data)

        # Save updated data back to Redis as a JSON list
        tag_redis.set(redis_key, json.dumps(existing_data))

        return {
            "status": "success",
            "message": "New message saved successfully.",
            "index": data["index"],
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
    
def getTagTasks(redis_key):
    try:
        # Check if the Redis key exists
        if not tag_redis.exists(redis_key):
            return {"status": "error", "message": "Key not found or expired"}

        # Fetch the data from Redis
        data = tag_redis.get(redis_key)

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
    
def updateTagData(redis_key, target_index, edited_tag_data):
    """
    Update a specific scheduled message in Redis based on its `index` field.
    """
    try:
        # Check if the Redis key exists
        if not tag_redis.exists(redis_key):
            return {"status": "error", "message": "Redis key not found or expired"}

        # Fetch current data from Redis
        current_data = tag_redis.get(redis_key)

        # Parse the current data from Redis into a list of dictionaries
        try:
            current_data = json.loads(current_data)
            if not isinstance(current_data, list):
                return {"status": "error", "message": "Data in Redis is not in the expected list format"}
        except (json.JSONDecodeError, ValueError):
            return {"status": "error", "message": "Invalid data format in Redis"}

        # Find the object with the matching `index` field
        tag_data_to_update = next((tags for tags in current_data if tags.get("index") == target_index), None)

        if not tag_data_to_update:
            return {"status": "error", "message": f"No message found with index {target_index}"}

        # Update the found message
        tag_data_to_update.update(edited_tag_data)

        # Save the updated list back to Redis
        tag_redis.set(redis_key, json.dumps(current_data))

        # Return success with the updated message
        return {
            "status": "success",
            "message": "Message updated successfully",
            "updated_message": tag_data_to_update,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
    
def updateTagByFields(redis_key, update_data):
    """
    Update a specific scheduled message in Redis based on multiple fields.
    """
    try:
        # Check if the Redis key exists
        if not tag_redis.exists(redis_key):
            return {"status": "error", "message": "Redis key not found or expired"}

        # Fetch current data from Redis
        current_data = tag_redis.get(redis_key)

        # Parse the current data from Redis into a list of dictionaries
        try:
            current_data = json.loads(current_data)
            if not isinstance(current_data, list):
                return {"status": "error", "message": "Data in Redis is not in the expected list format"}
        except (json.JSONDecodeError, ValueError):
            return {"status": "error", "message": "Invalid data format in Redis"}

        # Search for the message with matching fields
        updated_tag_message = None
        for tagdata in current_data:
            # Check if the message matches the criteria
            if (tagdata.get('page_id') == update_data.get('page_id') and
                tagdata.get('access_token') == update_data.get('access_token') and
                tagdata.get('max_workers') == update_data.get('max_workers') and
                tagdata.get('tag_id_name') == update_data.get('tag_id_name') and
                tagdata.get('start_date') == update_data.get('start_date') and
                tagdata.get('end_date') == update_data.get('end_date') and
                tagdata.get('start_time') == update_data.get('start_time') and
                tagdata.get('end_time') == update_data.get('end_time') and
                tagdata.get('schedule_date') == update_data.get('schedule_date') and
                tagdata.get('schedule_time') == update_data.get('schedule_time')):
                
                # Update the found message with the new data
                tagdata.update(update_data)
                updated_tag_message = tagdata
                break
        
        if updated_tag_message is None:
            return {"status": "error", "message": "No matching message found to update"}

        # Save the updated list back to Redis
        tag_redis.set(redis_key, json.dumps(current_data))

 
        # Return success with the updated message
        
        return {
            "status": "success",
            "message": "Message updated successfully",
            "updated_message": updated_tag_message,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
        

def removeTagDataByStatus(redis_key):
    """
    Remove data with specific statuses ('Success', 'Failed', 'No Conversations', 'Stopped') from Redis
    and update indexes and Batch fields for the remaining data.
    
    Args:
        redis_key (str): The Redis key to fetch data from.
    
    Returns:
        dict: Status and message of the operation, along with updated data.
    """
    try:
        # Check if the Redis key exists
        if not tag_redis.exists(redis_key):
            return {"status": "error", "message": "Redis key not found or expired"}

        # Fetch current data from Redis
        current_data = tag_redis.get(redis_key)

        # Parse the current data from Redis into a list of dictionaries
        try:
            current_data = json.loads(current_data)
            if not isinstance(current_data, list):
                return {"status": "error", "message": "Data in Redis is not in the expected list format"}
        except (json.JSONDecodeError, ValueError):
            return {"status": "error", "message": "Invalid data format in Redis"}

        # Statuses to automatically remove
        statuses_to_remove = ["Success", "Failed", "No Conversations", "STOPPED"]

        # Filter out objects with the specified statuses
        filtered_data = [tag for tag in current_data if tag.get("status") not in statuses_to_remove]

        # Update the `index` and `Batch` fields to maintain continuity
        for new_index, tag in enumerate(filtered_data):
            tag["index"] = new_index

        # Save the updated list back to Redis
        tag_redis.set(redis_key, json.dumps(filtered_data))

        # Return the updated data
        return {
            "status": "success",
            "message": "Data with specified statuses removed, and indexes updated successfully.",
            "updated_data": filtered_data,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}

