import json
import logging
from celery import shared_task
from celery.contrib.abortable import AbortableTask
from datetime import datetime
from flask import jsonify
import pytz
import time
import redis
import requests
from controllers.RedisController import updateScheduleMessageByFields
from controllers.TagRedisController import updateTagByFields
from controllers.TagConversations import handle_tagging
# Define the timezone for Asia/Manila

manila_timezone = pytz.timezone('Asia/Manila')

scheduled_db = redis.Redis(host='redis', port=6379,
                           db=2, decode_responses=True)


@shared_task(bind=True, default_retry_delay=1, max_retries=None)
def say_hello(self, target_time_am_pm):
    """
    This Celery task will print 'Hello, World!' at a specific time each day.
    The task will not succeed until the target time is reached.
    """
    # Convert target time from 12-hour AM/PM to 24-hour format
    target_time = datetime.strptime(
        target_time_am_pm, '%I:%M %p').strftime('%H:%M')
    # Example: '13:00' for 1:00 PM
    print(f"Target time in 24-hour format: {target_time}")

    while True:
        # Get the current time in Manila timezone
        current_time = datetime.now(manila_timezone).strftime('%H:%M')
        print(f"Current time in 24-hour format: {current_time}")

        # Check if the current time matches the target time
        if current_time == target_time:
            print("Hello, World!")
            return "Task completed"

        # Wait for 2 seconds before checking again
        time.sleep(2)


@shared_task(bind=True, default_retry_delay=1, max_retries=None, base=AbortableTask)
def addScheduletoCeleryTask(self, new_jobs):
    """
    Process new jobs and send messages based on schedule_date and schedule_time.
    """
    from controllers.sendscheduledmessages import handlesendingmessage
    for redis_key, jobs in new_jobs.items():
        for job in jobs:
            # Extract message data
            message_data = job['message_data']
            index = message_data.get('index')
            page_id = message_data.get('page_id')
            access_token = message_data.get('access_token')
            schedule_date = message_data.get('schedule_date')
            schedule_time = message_data.get('schedule_time')

            # Convert schedule_time to 24-hour format
            schedule_time_24hr = datetime.strptime(
                schedule_time, '%I:%M %p').strftime('%H:%M')
            scheduled_datetime = datetime.strptime(
                f"{schedule_date} {schedule_time_24hr}", '%Y-%m-%d %H:%M')
            scheduled_datetime = manila_timezone.localize(scheduled_datetime)

            # Check current time
            current_time = datetime.now(manila_timezone)

            try:
                # Initialize or update failure count
                if 'failure' not in message_data:
                    message_data['failure'] = 0

                # Validate necessary fields
                if not (page_id and access_token and schedule_date and schedule_time):
                    message_data['failure'] += 1  # Increment failure count
                    message_data['task_done_time'] = datetime.now(
                        manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                    updateScheduleMessageByFields(redis_key, message_data)
                    raise ValueError(
                        "Required fields are missing in message data.")

                # Check for task abortion
                if self.is_aborted():
                    message_data['task_done_time'] = datetime.now(
                        manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                    message_data['status'] = "STOPPED"
                    success = updateScheduleMessageByFields(
                        redis_key, message_data)

                    if success:

                        return "Task stopped"
                    else:
                        return "Task was stopped but failed to update the schedule."

                # Check if it's time to process the task
                if current_time == scheduled_datetime or current_time >= scheduled_datetime:
                    
                    result = handlesendingmessage(redis_key,message_data)
                    time.sleep(2)
                    
                    return result

                raise self.retry(
                    exc=Exception("Scheduled time not reached."),
                    countdown=1  # Retry after 1 second
                )

            except Exception as e:
                # message_data['status'] = "Scheduled"
                # updateScheduleMessageByFields(redis_key, message_data)
                raise e  # Re-raise exception for Celery to log

    return "No jobs processed"


@shared_task(bind=True, default_retry_delay=1, max_retries=None, base=AbortableTask)
def addTagScheduletoCelery(self, redis_key, taskData):
    """
    Process new jobs and send messages based on schedule_date, schedule_time,
    schedule_weekly, schedule_pattern, and schedule_enddate.
    """
    from datetime import datetime, timedelta

    index = taskData.get('index')
    page_id = taskData.get('page_id')
    access_token = taskData.get('access_token')
    schedule_date = taskData.get('schedule_date')
    schedule_time = taskData.get('schedule_time')
    # List of weekdays (e.g., ['Sunday', 'Monday'])
    schedule_weekly = taskData.get('schedule_weekly', [])
    # 'once', 'weekly', 'everyday'
    schedule_pattern = taskData.get('schedule_pattern', 'once')
    schedule_enddate = taskData.get(
        'schedule_enddate')  # End date for the task

    try:
        # Convert schedule_time to 24-hour format
        schedule_time_24hr = datetime.strptime(
            schedule_time, '%I:%M %p').strftime('%H:%M')
        scheduled_datetime = datetime.strptime(
            f"{schedule_date} {schedule_time_24hr}", '%Y-%m-%d %H:%M')
        scheduled_datetime = manila_timezone.localize(scheduled_datetime)

        current_time = datetime.now(manila_timezone)

        # Validate necessary fields
        if not (page_id and access_token and schedule_date and schedule_time):
            taskData['task_done_time'] = current_time.strftime(
                '%Y-%m-%d %H:%M:%S')
            updateTagByFields(redis_key, taskData)
            raise ValueError("Required fields are missing in task data.")

        # Handle task abortion
        if self.is_aborted():
            taskData['task_done_time'] = current_time.strftime(
                '%Y-%m-%d %H:%M:%S')
            taskData['status'] = "STOPPED"
            if updateTagByFields(redis_key, taskData):
                return "Task stopped"
            return "Task was stopped but failed to update the schedule."

        # Check schedule end date
        if schedule_enddate:
            end_datetime = manila_timezone.localize(
                datetime.strptime(schedule_enddate, '%Y-%m-%d'))
            if current_time > end_datetime:
                taskData['task_done_time'] = current_time.strftime(
                    '%Y-%m-%d %H:%M:%S')
                return "Task ended as per the end date."

        # Check scheduling pattern
        if schedule_pattern == 'Once':
            if current_time >= scheduled_datetime:
                return process_task(self, redis_key, taskData)

        elif schedule_pattern == 'Weekly':
            current_weekday = current_time.strftime(
                '%A')  # Get current day name
            if current_weekday in schedule_weekly and current_time >= scheduled_datetime:
                return process_task(self, redis_key, taskData)

        elif schedule_pattern == 'Everyday':
            if current_time.time() >= scheduled_datetime.time():
                return process_task(self, redis_key, taskData)

        # Retry until the scheduled time is reached
        raise self.retry(exc=Exception(
            "Scheduled time not reached."), countdown=1)

    except Exception as e:
        raise e


def process_task(self, redis_key, taskData):
    """
    Handles task execution.
    """
    try:
        result = handle_tagging(redis_key, taskData)
        time.sleep(2)
        response = result.get_json()

        taskData['task_done_time'] = datetime.now(
            manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
        updateTagByFields(redis_key, taskData)

        return response, 201
    except Exception as e:
        taskData['task_done_time'] = datetime.now(
            manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
        updateTagByFields(redis_key, taskData)
        raise e


@shared_task(bind=True, base=AbortableTask)
def TagConversationsCelery(self, redis_key, tag_index, tag_id, tag_id_name, page_id, access_token, start_epoch_time, end_epoch_time, taskData):
    """
    Process the tagging of conversations and dynamically update progress, success, and failure counts.
    Handles multiple iterations of API calls until no more conversations are found.
    """
    time.sleep(2)
    max_retries = 20  # Maximum retries for fetching conversations
    retry_delay = 5
    tagged = []
    failtagged = []
    iteration = 1
    total_tagged = 0
    total_failed = 0
    processed_ids = set()
    grand_total_conversations = 0  # NEW: Cumulative conversation count
    taskData["client_messages"] = []
    taskData["tagged"] = []
    taskData["failtagged"] = []
    taskData["progress"] = 0
    taskData["total_tags"] = 0
    taskData["client_messages"] = [f"[{taskData.get('Batch', 'N/A')}] [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Start tagging conversations from page_id {
        page_id} with tag_id {tag_id_name}."]  # Initialize total_tags to track successful tags
    taskData["status"] = "Ongoing"

    updateTagByFields(redis_key, taskData)  # Initial update

    while True:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        taskData["client_messages"].append(
            f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Iteration {
                iteration} for tagging conversations on page_id {page_id} with tag {tag_id_name}."
        )

        # Construct URL for API call
        url = (
            f"https://pages.fm/api/v1/pages/{page_id}/conversations?"
            f"type=NOPHONE,INBOX,CREATE_DATE:{
                start_epoch_time}+-+{end_epoch_time}&mode=OR&tags=[]&"
            f"except_tags=[{tag_index}]&access_token={
                access_token}&from_platform=web"
        )
        
        try:
            for retry_attempt in range(max_retries):
                try:
                    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    taskData["client_messages"].append(
                        f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Attempt {retry_attempt + 1}/{max_retries} - Fetching conversations from API."
                    )
                    updateTagByFields(redis_key, taskData)

                    response = requests.get(url)
                    # Log the response success and message
                    logging.info(
                        f"[Attempt {retry_attempt + 1}] Response: success={response.json().get('success', 'N/A')}, message={response.json().get('message', 'N/A')}"
                    )
                    taskData["client_messages"].append(
                        f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Attempt {retry_attempt + 1}] Response: success={response.json().get('success', 'N/A')}, message={response.json().get('message', 'N/A')}"
                    )
                    updateTagByFields(redis_key, taskData)

                    # Proceed only if the status code is 200
                    if response.status_code == 200:
                        data = response.json()

                        # Check if the "success" key exists
                        if data.get("success", False):
                            data_conversations = data.get("conversations", [])

                            # Filter out conversations that already have the tag
                            conversations = [
                                conversation for conversation in data_conversations
                                if conversation.get("id") not in processed_ids and tag_id not in conversation.get("tags", [])
                            ]

                            if conversations:
                                taskData["client_messages"].append(
                                    f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Conversations found on attempt {retry_attempt + 1}."
                                )
                                updateTagByFields(redis_key, taskData)
                                break  # Exit retry loop if conversations are found

                            # Log absence of conversations for this attempt
                            taskData["client_messages"].append(
                                f"[{taskData.get('Batch', 'N/A')}] [{current_time}] No conversations found on attempt {retry_attempt + 1}. Retrying after {retry_delay} seconds."
                            )
                        else:
                            # Log the failure reason from the response
                            error_message = data.get("message", "Unknown error occurred.")
                            taskData["client_messages"].append(
                                f"[{taskData.get('Batch', 'N/A')}] [{current_time}] API response indicated failure on attempt {retry_attempt + 1}: {error_message}. Retrying..."
                            )
                            logging.error(
                                f"[Attempt {retry_attempt + 1}] API response failure: {error_message}"
                            )
                    else:
                        taskData["client_messages"].append(
                            f"[{taskData.get('Batch', 'N/A')}] [{current_time}] API returned status code {response.status_code}. Retrying..."
                        )
                        logging.error(
                            f"[Attempt {retry_attempt + 1}] API returned status code {response.status_code}: {response.text}"
                        )

                    updateTagByFields(redis_key, taskData)
                    time.sleep(retry_delay)

                except requests.exceptions.RequestException as e:
                    logging.error(
                        f"[Attempt {retry_attempt + 1}] Request Error: {e}. Retrying..."
                    )
                    taskData["client_messages"].append(
                        f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Error on attempt {retry_attempt + 1}: {str(e)}. Retrying after {retry_delay} seconds."
                    )
                    updateTagByFields(redis_key, taskData)

                    if retry_attempt == max_retries - 1:
                        taskData["client_messages"].append(
                            f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Max retries reached. Failing the task."
                        )
                        updateTagByFields(redis_key, taskData)
                        raise e  # Raise exception after max retries

                    time.sleep(retry_delay)

            if not conversations:
                if iteration == 1:
                    taskData["status"] = "No Conversations"
                    taskData["error"] = "No conversations found"
                    taskData['task_done_time'] = current_time
                    taskData["client_messages"].append(
                        f"[{taskData.get(
                            'Batch', 'N/A')}] [{current_time}] No Conversations found for tagging."
                    )
                    updateTagByFields(redis_key, taskData)
                    return {
                        "status": "Failed",
                        "error": "No conversations found",
                        "client_messages": taskData["client_messages"],
                    }
                else:
                    if iteration >= 2 and len(processed_ids) == grand_total_conversations:  # MODIFIED
                        total_tagged = len(taskData["tagged"])
                        total_failed = len(taskData["failtagged"])
                        taskData["status"] = "Success"
                        taskData['task_done_time'] = current_time
                        taskData["client_messages"].append(
                            f"[{taskData.get(
                                'Batch', 'N/A')}] [{current_time}] No more conversations to process. Tagging completed."
                        )
                        taskData["progress"] = 100
                    elif not taskData["tagged"]:
                        taskData['task_done_time'] = current_time
                        taskData["client_messages"].append(
                            f"[{taskData.get(
                                'Batch', 'N/A')}] [{current_time}] No conversations were successfully tagged."
                        )

                updateTagByFields(redis_key, taskData)
                break

            total_conversations = len(conversations)
            grand_total_conversations += total_conversations  # NEW: Update cumulative total
            progress_step = 100 / grand_total_conversations  # UPDATED

            for idx, conversation in enumerate(conversations, start=1):
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                if self.is_aborted():
                    taskData["task_done_time"] = datetime.now().strftime(
                        '%Y-%m-%d %H:%M:%S')
                    taskData["status"] = "STOPPED"
                    taskData["client_messages"].append(
                        f"[{taskData.get('Batch', 'N/A')
                            }] [{current_time}] Task aborted by user."
                    )
                    updateTagByFields(redis_key, taskData)
                    return {
                        "status": "Aborted",
                        "progress": taskData["progress"],
                        "client_messages": taskData["client_messages"],
                        "message": "Task aborted by user",
                    }

                from_id = conversation.get("from", {}).get("id")
                if not from_id:
                    failtagged.append(
                        {"conversation_id": None, "error": "Missing 'from.id'"})
                    taskData["failtagged"].append(
                        {"conversation_id": None, "error": "Missing 'from.id'"})
                    taskData["client_messages"].append(
                        f"[{taskData.get(
                            'Batch', 'N/A')}] [{current_time}] Failed to Tag: Missing 'from.id'."
                    )
                    total_failed += 1
                    continue

                conversation_id = f"{page_id}_{from_id}"
                processed_ids.add(conversation_id)
                toggle_tag_url = (
                    f"https://pages.fm/api/v1/pages/{page_id}/conversations/"
                    f"{conversation_id}/toggle_tag?access_token={access_token}"
                )
                payload = {
                    "tag_id": tag_id,
                    "value": 1,
                    "psid": from_id,
                    "tag[id]": tag_id,
                }

                try:
                    tag_response = requests.post(toggle_tag_url, data=payload)
                    tag_response.raise_for_status()
                    tag = tag_response.json()

                    if tag.get("success"):
                        taskData["tagged"].append(conversation_id)
                        tagged.append(
                            {"conversation_id": conversation_id, "status": "Success"})
                        taskData["total_tags"] += 1
                        taskData["client_messages"].append(
                            f"[{taskData.get(
                                'Batch', 'N/A')}] [{current_time}] Successfully tagged conversation_id {conversation_id}."
                        )
                    else:
                        taskData["failtagged"].append(
                            {"conversation_id": conversation_id,
                                "error": "Tagging failed"}
                        )
                        failtagged.append(
                            {"conversation_id": conversation_id, "status": "Failed"})
                        taskData["client_messages"].append(
                            f"[{taskData.get(
                                'Batch', 'N/A')}] [{current_time}] Failed to tag conversation_id {conversation_id}."
                        )
                except requests.exceptions.RequestException as e:
                    failtagged.append(
                        {"conversation_id": conversation_id, "error": str(e)})
                    taskData["failtagged"].append(
                        {"conversation_id": conversation_id, "error": str(e)})
                    taskData["client_messages"].append(
                        f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Failed to tag conversation_id {
                            conversation_id} due to error: {str(e)}."
                    )
                except Exception as e:
                    failtagged.append(
                        {"conversation_id": conversation_id, "error": str(e)})
                    taskData["failtagged"].append(
                        {"conversation_id": conversation_id, "error": str(e)})
                    taskData["client_messages"].append(
                        f"[{taskData.get('Batch', 'N/A')}] [{current_time}] Failed to tag conversation_id {
                            conversation_id} due to error: {str(e)}."
                    )

                taskData["progress"] = round(
                    min(100, (len(
                        taskData["tagged"]) + len(taskData["failtagged"])) * progress_step), 2
                )  # UPDATED to use cumulative progress
                updateTagByFields(redis_key, taskData)

            iteration += 1

        except Exception as e:
            taskData["status"] = "Error"
            taskData["error"] = str(e)
            taskData["client_messages"].append(
                f"[{taskData.get(
                    'Batch', 'N/A')}] [{current_time}] Error during tagging: {str(e)}."
            )
            updateTagByFields(redis_key, taskData)
            raise e

    return {
        "status": taskData["status"],
        "progress": taskData["progress"],
        "total_tags": total_tagged,
        "total_failed": total_failed,
    }


@shared_task(bind=True, base=AbortableTask)
def process_conversations_and_send_messages(self, redis_key, message_data):
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    message_data["client_messages"] = []
    message_data["client_messages"].append(
                        f"[{current_time}] Getting Conversation Ids"
                    )
    message_data["status"] = "In Progress"
    updateScheduleMessageByFields(redis_key, message_data)
    print("Getting conversation IDs and sending messages")
    try:
        # Step 1: Get all conversation IDs
        conversation_ids = get_all_conversation_ids(message_data)
        if not conversation_ids:
            message_data["client_messages"].append(
                        f"[{current_time}] No conversation IDs Found between {message_data['start_date']} - {message_data['end_date']}"
                    )
            message_data["success"] = 0
            message_data["failed"] = 0
            message_data["status"] = "No Conversations"
            message_data["total_conversations"] = len(conversation_ids)
            updateScheduleMessageByFields(redis_key, message_data)
            time.sleep(1)
            message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
            updateScheduleMessageByFields(redis_key, message_data)
            return {"status": "error", "message": "No conversation IDs found"}
        
        # Step 2: Send messages to all conversation IDs using user's send_message_to_conversations logic
        response_data = send_message_to_conversations(
            redis_key, conversation_ids, message_data)
        return response_data

    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_all_conversation_ids(message_data):
    page_id = message_data['page_id']
    access_token = message_data['access_token']
    start_date = message_data['start_date']
    end_date = message_data['end_date']
    start_time_str = message_data['start_time']
    end_time_str = message_data['end_time']

    start_datetime = datetime.strptime(
        f"{start_date} {start_time_str}", "%Y-%m-%d %H:%M:%S")
    end_datetime = datetime.strptime(
        f"{end_date} {end_time_str}", "%Y-%m-%d %H:%M:%S")

    start_epoch_time = int(start_datetime.timestamp())
    end_epoch_time = int(end_datetime.timestamp())

    all_conversation_ids = set()
    current_count = 0

    print(f"Start Epoch Time: {
          start_epoch_time}, End Epoch Time: {end_epoch_time}")

    while True:
        pancake_api = (
            f"https://pages.fm/api/v1/pages/{
                page_id}/conversations?type=NOPHONE,INBOX,"
            f"CREATE_DATE:{
                start_epoch_time}+-+{end_epoch_time}&mode=OR&from_platform=web&"
            f"access_token={access_token}&current_count={current_count}"
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

            new_conversation_ids = [
                conv.get("id") for conv in conversations if conv.get("id")]
            all_conversation_ids.update(new_conversation_ids)

            current_count += len(conversations)

        except requests.RequestException as e:
            print("Request Error:", e)
            raise e

        except ValueError as e:
            print("JSON Decode Error:", e)
            raise ValueError("Invalid JSON response")

        except Exception as e:
            print("An unexpected error occurred:", e)
            raise e

    return list(all_conversation_ids)

def send_message_to_conversations(redis_key, conversation_ids, message_data):
    try:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        message_data["client_messages"].append(
            f"[{current_time}] Sending Message to conversation Ids"
        )
        # Initialize total counts for success, failure, and total conversations
        total_conversations = len(conversation_ids)
        message_data["total_conversations"] = total_conversations
        message_data["success"] = 0
        message_data["failed"] = 0
        message_data["status"] = "Sending..."
        updateScheduleMessageByFields(redis_key, message_data)

        failed_ids = set()  # Track conversation IDs that failed
        processed_ids = set()  # Track successfully processed conversation IDs

        # Deduplicate conversation IDs
        conversation_ids = list(set(conversation_ids))
        print(f"[DEBUG] Deduplicated conversation IDs: {conversation_ids}")

        # Extract values from message_data
        page_id = message_data["page_id"]
        access_token = message_data["access_token"]
        message = message_data["text_message"]
        method_message = message_data["method_message"]
        schedule_time = message_data["schedule_time"]
        message_title = message_data["message_title"]

        # Initialize success and failure counters
        successes = 0
        failures = 0

        # Reply helpers
        reply_helper_message = None
        if method_message == 1:
            reply_helper_url = f"https://pages.fm/api/v1/pages/{page_id}/settings?access_token={access_token}"
            try:
                helper_response = requests.get(reply_helper_url)
                helper_response.raise_for_status()
                reply_helper_data = helper_response.json()

                quick_replies = reply_helper_data['settings']['quick_replies']
                for quick_reply in quick_replies:
                    shortcut = quick_reply['shortcut']
                    messages = quick_reply['messages']

                    if str(shortcut) == str(message).strip():
                        reply_helper_message = messages
                        break

                if not reply_helper_message:
                    print(f"[DEBUG] No reply helper found for {message_title}. Scheduled message for {schedule_time}.")
                    message_data["client_messages"].append(
                    f"[{current_time}] No Quick Message found for {message_title}."
                    )
                    message_data["status"] = "Failed"
                    updateScheduleMessageByFields(redis_key, message_data)
            except requests.exceptions.RequestException as e:
                message_data["client_messages"].append(
                f"[{current_time}] Error in processing the reply helper: {str(e)}."
                )
                message_data["status"] = "Failed"
                updateScheduleMessageByFields(redis_key, message_data)
                print(f"[DEBUG] HTTP Request Error: {e}")
                return {"status": "error", "message": f"Error in processing the reply helper: {str(e)}"}

        # Send the message to each conversation
        for conv_id in conversation_ids:
            if conv_id in processed_ids or conv_id in failed_ids:
                print(f"[DEBUG] Skipping already processed or failed conv_id: {conv_id}")
                continue

            print(f"[DEBUG] Processing conv_id: {conv_id}")
            url = f"https://pages.fm/api/v1/pages/{page_id}/conversations/{conv_id}/messages?access_token={access_token}"
            try:
                if method_message == 1 and reply_helper_message:
                    print(f"[DEBUG] Sending quick message to conversation ID {conv_id}")
                    
                    for message_helper in reply_helper_message:
                        payload_message = message_helper["message"]

                        # Extract photo data
                        photo_url = message_helper['photos'][0]['url'] if message_helper.get('photos') else None

                        payload = {
                            'action': 'reply_inbox',
                            'message': payload_message,
                            'content_url': photo_url,
                        }

                        response = requests.post(url, data=payload)
                        print(f"[DEBUG] Response for conv_id {conv_id}: {response.status_code}, {response.text}")
                        successes, failures = process_response(
                            redis_key, response, conv_id, [], successes, failures, failed_ids, processed_ids)
                else:
                    print(f"[DEBUG] Sending normal message to conversation ID {conv_id}")
                    payload = {'action': 'reply_inbox', 'message': message}
                    response = requests.post(url, data=payload)
                    print(f"[DEBUG] Response for conv_id {conv_id}: {response.status_code}, {response.text}")
                    successes, failures = process_response(
                        redis_key, response, conv_id, [], successes, failures, failed_ids, processed_ids)

                # After each processed conversation ID, update the success/failure counts and save progress
                progress = ((successes + failures) / total_conversations) * 100
                message_data["progress"] = round(progress, 2)
                message_data["success"] = successes
                message_data["failed"] = failures
                updateScheduleMessageByFields(redis_key, message_data)  # Save progress during the loop

            except requests.exceptions.RequestException as e:
                if conv_id not in failed_ids:
                    print(f"[DEBUG] Request failed for conv_id {conv_id}: {e}")
                    failures += 1
                    failed_ids.add(conv_id)

        # Final message update
        message_data["client_messages"].append(
            f"[{current_time}] All Conversation Ids Done"
        )
        message_data["success"] = successes
        message_data["failed"] = failures
        message_data["status"] = "Success"
        updateScheduleMessageByFields(redis_key, message_data)
        time.sleep(1)
        message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
        updateScheduleMessageByFields(redis_key, message_data)

        # If no successes or failures, return a message indicating the issue
        if successes == 0 and failures == len(conversation_ids):
            message_data["status"] = "Failed"
            message_data["client_messages"].append(
            f"[{current_time}]  Failed to send messages to all conversation IDs."
            )
            updateScheduleMessageByFields(redis_key, message_data)
            return {"status": "error", "message": "Failed to send messages to all conversation IDs."}

        return {
            "status": "Task Done",
            "total_conversations": total_conversations,
            "progress": 100.0,
            "successes": successes,
            "failures": failures,
            "message": "Message sending completed with the above results."
        }

    except Exception as e:
        print(f"[DEBUG] Error in sending message: {str(e)}")
        message_data["status"] = "Failed"
        message_data["client_messages"].append(
        f"[{current_time}] Error in sending message: {str(e)}"
        )
        updateScheduleMessageByFields(redis_key, message_data)
        return {"status": "error", "message": f"Error in sending message: {str(e)}"}


def process_response(redis_key, response, conv_id, responses, successes, failures, failed_ids, processed_ids):
    """
    Helper function to process responses for each conversation ID.
    """
    try:
        # Check if the conversation ID is already processed or failed
        if conv_id in processed_ids or conv_id in failed_ids:
            print(f"[DEBUG] Skipping conv_id {conv_id} as it was already processed or failed.")
            return successes, failures  # Skip further processing for this conversation ID

        if response.status_code == 200:
            response_json = response.json()
            responses.append(response_json)

            # Check if the response indicates success
            if response_json.get("success"):
                successes += 1
                processed_ids.add(conv_id)  # Mark as processed
                print(f"Message sent successfully to conversation ID {conv_id}")
            else:
                # If failed to send, mark as failed
                if conv_id not in failed_ids:
                    failures += 1
                    failed_ids.add(conv_id)
                print(f"Failed to send message to conversation ID {conv_id}")
        else:
            # If HTTP request was not successful
            if conv_id not in failed_ids:
                failures += 1
                failed_ids.add(conv_id)
            print(f"HTTP error for conversation ID {conv_id}: {response.status_code}")
    except Exception as e:
        # If there is an exception during processing, mark as failed
        if conv_id not in failed_ids:
            failures += 1
            failed_ids.add(conv_id)
        print(f"Error processing response for conversation ID {conv_id}: {str(e)}")

    return successes, failures
