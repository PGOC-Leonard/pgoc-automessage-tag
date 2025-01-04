
import time
# Tag Execute
import requests
from datetime import datetime
from flask import jsonify

from controllers.TagRedisController import updateTagByFields

def stop_tagging(task_id):
    from celery_workers.celerytasks import TagConversationsCelery
    task = TagConversationsCelery.AsyncResult(task_id)
    task.abort()
    response = {
        "task_id": task_id,
        "status": task.status,
        "result": str(task.result) if task.result else None  # Ensure result is serializable
    }
    return response

def handle_tagging(redis_key, tagTask):
    from celery_workers.celerytasks import TagConversationsCelery
    print("custom throw")

    try:
        # Convert tagTask from list to dict if it's a list
        if isinstance(tagTask, list) and len(tagTask) > 0:
            tagTask = tagTask[0]
        
        page_id = tagTask.get("page_id")
        access_token = tagTask.get("access_token")
        tag_id_name = tagTask.get("tag_id_name")
        start_time_str = tagTask.get("start_time")
        end_time_str = tagTask.get("end_time")
        start_date = tagTask.get("start_date")
        end_date = tagTask.get("end_date")
        
        # Combine date and time into datetime objects
        start_datetime = datetime.strptime(f"{start_date} {start_time_str}", "%Y-%m-%d %H:%M:%S")
        end_datetime = datetime.strptime(f"{end_date} {end_time_str}", "%Y-%m-%d %H:%M:%S")

        # Convert to epoch time
        start_epoch_time = int(start_datetime.timestamp())
        end_epoch_time = int(end_datetime.timestamp())

        # Build API URL to retrieve tag info
        tag_info_api_url = f"https://pages.fm/api/v1/pages/{page_id}/settings?access_token={access_token}"
        
        # Fetch the tag info and map the needed values
        tag_index, tag_id = get_tag_info(tag_id_name, tag_info_api_url)   
        if tag_id is None or tag_index is None:
            return jsonify({
                "message": "Tag Task Added",
                "result": "Failed",
                "task_id": None,
                "error": "Tag information not found"
            })

        taggingtask = TagConversationsCelery.apply_async(args=[redis_key, tag_index, tag_id, tag_id_name, page_id, access_token, start_epoch_time, end_epoch_time , tagTask])
        time.sleep(1)

        # Update tagTask with task details
        tagTask["task_id"] = taggingtask.id
        tagTask["task_result"] = str(taggingtask.result)
        tagTask["status"] = "Ongoing"
        updateTagByFields(redis_key, tagTask)

        # Response data for success
        response_data = {
            "message": "Tag Task Added",
            "result": "Success",
            "task_id": taggingtask.id
        }
        return jsonify(response_data)

    except Exception as e:
        # Handle any unexpected errors
        response_data = {
            "message": "Tag Task Added",
            "result": "Failed",
            "task_id": None,
            "error": str(e)
        }
        return jsonify(response_data)



def  get_tag_info(tag_name, api_url):
        print("get_tag_info")
        try:
            # Make GET request to the API endpoint
            response = requests.get(api_url)
            
            # Check if the request was successful (status code 200)
            if response.status_code == 200:
                # Parse the JSON response
                data = response.json()
                
                # Check if 'settings' key is present in the response
                if 'settings' in data and 'tags' in data['settings']:
                    # Iterate through the tags and find the matching tag_name
                    for idx, tag in enumerate(data['settings']['tags']):
                        if tag.get('text', '').lower() == tag_name.lower():
                            return idx, tag.get('id')
                    
                    # If tag_name not found, return None
                    return None, None
                else:
                    return None, None
            else:
                return None, None
        except requests.exceptions.RequestException as e:
            if e:
                #progress_bar_label.config(text="Error")
                idx = "error"
                tag = "time_out"
                return idx, tag
    
    
# Get Conversation IDs
def get_conversation_ids(tagTask):
    try:
        # Extract the date and time fields
        page_id = tagTask.get("page_id")
        access_token = tagTask.get("access_token")
        start_date = tagTask.get("start_date")
        end_date = tagTask.get("end_date")
        start_time_str = tagTask.get("start_time")
        end_time_str = tagTask.get("end_time")

        # Combine date and time into datetime objects
        start_datetime = datetime.strptime(f"{start_date} {start_time_str}", "%Y-%m-%d %H:%M:%S")
        end_datetime = datetime.strptime(f"{end_date} {end_time_str}", "%Y-%m-%d %H:%M:%S")

        # Convert to epoch time
        start_epoch_time = int(start_datetime.timestamp())
        end_epoch_time = int(end_datetime.timestamp())

        print(f"Start Epoch Time: {start_epoch_time}, End Epoch Time: {end_epoch_time}")

        all_conversation_ids = set()
        current_count = 0

        while True:
            # Construct Pancake API URL
            pancake_api = (
                f"https://pages.fm/api/v1/pages/{page_id}/conversations?"
                f"type=NOPHONE,INBOX,CREATE_DATE:{start_epoch_time}+-+{end_epoch_time}&"
                f"mode=OR&from_platform=web&access_token={access_token}&current_count={current_count}"
            )

            print("Fetching URL:", pancake_api)

            try:
                response = requests.get(pancake_api)
                response.raise_for_status()
                data = response.json()

                conversations = data.get("conversations", [])
                print("Fetched Conversations:", conversations)

                if not conversations:
                    print("No more conversations to fetch.")
                    break

                # Add new conversation IDs to the set
                new_conversation_ids = [conv.get("id") for conv in conversations if conv.get("id")]
                all_conversation_ids.update(new_conversation_ids)

                # Increment current count
                current_count += len(conversations)

            except requests.RequestException as e:
                print("Request Error:", e)
                return {"status": "error", "message": str(e)}

            except ValueError as e:
                print("JSON Decode Error:", e)
                return {"status": "error", "message": "Invalid JSON response"}

            except Exception as e:
                print("An unexpected error occurred:", e)
                return {"status": "error", "message": str(e)}

        return list(all_conversation_ids)

    except ValueError as ve:
        print("Datetime Parsing Error:", ve)
        return {"status": "error", "message": str(ve)}

    except Exception as e:
        print("Unexpected Error:", e)
        return {"status": "error", "message": str(e)}