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
from controllers.sendscheduledmessages import handlesendingmessage
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
                    try:
                        result = handlesendingmessage(message_data)
                        time.sleep(2)
                    except Exception as e:
                        message_data['task_done_time'] = datetime.now(
                            manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                        message_data['failure'] += 1
                        message_data['status'] = "Failed"
                        updateScheduleMessageByFields(redis_key, message_data)
                        continue

                    # Update status based on the result
                    if result.get("status") == "success":
                        conversation_ids = result.get("total_conversations")
                        successCounts = result.get("successes")
                        message_data['task_done_time'] = datetime.now(
                            manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                        message_data['successCounts'] = successCounts
                        message_data['conversation_ids'] = conversation_ids
                        message_data['status'] = "Success"
                    else:
                        message_data['task_done_time'] = datetime.now(
                            manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                        message_data['status'] = "Failed"
                        message_data['failure'] += 1  # Increment failure count

                    # Update the message in Redis
                    success = updateScheduleMessageByFields(
                        redis_key, message_data)
                    if not success:
                        raise ValueError(
                            "Failed to update message data in Redis after task execution.")

                    return "Task Done"

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
    schedule_weekly = taskData.get('schedule_weekly', [])  # List of weekdays (e.g., ['Sunday', 'Monday'])
    schedule_pattern = taskData.get('schedule_pattern', 'once')  # 'once', 'weekly', 'everyday'
    schedule_enddate = taskData.get('schedule_enddate')  # End date for the task

    try:
        # Convert schedule_time to 24-hour format
        schedule_time_24hr = datetime.strptime(schedule_time, '%I:%M %p').strftime('%H:%M')
        scheduled_datetime = datetime.strptime(f"{schedule_date} {schedule_time_24hr}", '%Y-%m-%d %H:%M')
        scheduled_datetime = manila_timezone.localize(scheduled_datetime)

        current_time = datetime.now(manila_timezone)

        # Validate necessary fields
        if not (page_id and access_token and schedule_date and schedule_time):
            taskData['task_done_time'] = current_time.strftime('%Y-%m-%d %H:%M:%S')
            updateTagByFields(redis_key, taskData)
            raise ValueError("Required fields are missing in task data.")

        # Handle task abortion
        if self.is_aborted():
            taskData['task_done_time'] = current_time.strftime('%Y-%m-%d %H:%M:%S')
            taskData['status'] = "STOPPED"
            if updateTagByFields(redis_key, taskData):
                return "Task stopped"
            return "Task was stopped but failed to update the schedule."

        # Check schedule end date
        if schedule_enddate:
            end_datetime = manila_timezone.localize(datetime.strptime(schedule_enddate, '%Y-%m-%d'))
            if current_time > end_datetime:
                taskData['task_done_time'] = current_time.strftime('%Y-%m-%d %H:%M:%S')
                return "Task ended as per the end date."

        # Check scheduling pattern
        if schedule_pattern == 'Once':
            if current_time >= scheduled_datetime:
                return process_task(self, redis_key, taskData)

        elif schedule_pattern == 'Weekly':
            current_weekday = current_time.strftime('%A')  # Get current day name
            if current_weekday in schedule_weekly and current_time >= scheduled_datetime:
                return process_task(self, redis_key, taskData)

        elif schedule_pattern == 'Everyday':
            if current_time.time() >= scheduled_datetime.time():
                return process_task(self, redis_key, taskData)

        # Retry until the scheduled time is reached
        raise self.retry(exc=Exception("Scheduled time not reached."), countdown=1)

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

        taskData['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
        updateTagByFields(redis_key, taskData)

        return response, 201
    except Exception as e:
        taskData['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
        updateTagByFields(redis_key, taskData)
        raise e



@shared_task(bind=True, base=AbortableTask)
def TagConversationsCelery(self, redis_key, tag_id, page_id, access_token, conversations, taskData):
    """
    Process the tagging of conversations and dynamically update progress, success, and failure counts.
    """
    time.sleep(2)

    if not conversations:
        taskData["status"] = "No Conversations"
        taskData["error"] = "No conversations found"
        updateTagByFields(redis_key, taskData)
        return {"status": "Failed", "error": "No conversations found"}

    total_conversations = len(conversations)
    taskData["tagged"] = []  # List of successfully tagged conversation IDs
    taskData["failtagged"] = []  # List of failed conversation IDs
    taskData["progress"] = 0 # Progress percentage
    taskData["status"] = "Ongoing"
    updateTagByFields(redis_key, taskData)  # Initial update
    
    tagged = []
    failtagged = []
    progress_step = 100 / total_conversations  # Progress increment per conversation

    for idx, conversation in enumerate(conversations, start=1):
        # Check for task abortion
        if self.is_aborted():
            taskData["task_done_time"] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
            taskData["status"] = "STOPPED"
            updateTagByFields(redis_key, taskData)
            
            return {
                "status": "Aborted",
                "tagged": tagged,
                "failtagged": failtagged,
                "progress": taskData["progress"],
                "message": "Task aborted by user"
            }
        
        from_id = conversation.get("from", {}).get("id")  # Safely access 'from.id'
        if not from_id:
            failtagged.append({"conversation_id": None, "error": "Missing 'from.id'"})
            continue

        conversation_id = f"{page_id}_{from_id}"
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
            tag_response.raise_for_status()  # Raise exception for HTTP errors
            tag = tag_response.json()

            if tag.get("success"):
                taskData["tagged"].append(conversation_id)
                tagged.append({"conversation_id": conversation_id, "status": "Success"})
            else:
                taskData["failtagged"].append(
                    {"conversation_id": conversation_id, "error": "Tagging failed"}
                )
                failtagged.append({"conversation_id": conversation_id, "status": "Failed"})
        except requests.exceptions.RequestException as e:
            failtagged.append({"conversation_id": conversation_id, "error": str(e)})
            taskData["failtagged"].append({"conversation_id": conversation_id, "error": str(e)})
        except Exception as e:
            failtagged.append({"conversation_id": conversation_id, "error": str(e)})
            taskData["failtagged"].append({"conversation_id": conversation_id, "error": str(e)})

        # Update progress dynamically
        taskData["progress"] = int((idx / total_conversations) * 100)
        taskData["status"] = "Ongoing"
        updateTagByFields(redis_key, taskData)

    # Determine final status based on results
    if len(taskData["tagged"]) == total_conversations:
        taskData["status"] = "Success"

    # Final update with all results
    updateTagByFields(redis_key, taskData)

    return {
        "status": taskData["status"],
        "tagged": tagged,
        "failtagged": failtagged,
        "progress": taskData["progress"],
    }
