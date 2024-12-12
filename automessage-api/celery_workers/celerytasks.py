import json
import logging
from celery import shared_task
from celery.contrib.abortable import AbortableTask
from datetime import datetime
import pytz
import time
import redis
from controllers.RedisController import updateScheduleMessageByFields
from controllers.sendscheduledmessages import handlesendingmessage
# Define the timezone for Asia/Manila

manila_timezone = pytz.timezone('Asia/Manila')

scheduled_db = redis.Redis(host='redis', port=6379, db=2, decode_responses=True)


@shared_task(bind=True, default_retry_delay=1, max_retries=None)
def say_hello( self,target_time_am_pm):
    """
    This Celery task will print 'Hello, World!' at a specific time each day.
    The task will not succeed until the target time is reached.
    """
    # Convert target time from 12-hour AM/PM to 24-hour format
    target_time = datetime.strptime(target_time_am_pm, '%I:%M %p').strftime('%H:%M')
    print(f"Target time in 24-hour format: {target_time}")  # Example: '13:00' for 1:00 PM

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
            schedule_time_24hr = datetime.strptime(schedule_time, '%I:%M %p').strftime('%H:%M')
            scheduled_datetime = datetime.strptime(f"{schedule_date} {schedule_time_24hr}", '%Y-%m-%d %H:%M')
            scheduled_datetime = manila_timezone.localize(scheduled_datetime)

            # Check current time
            current_time = datetime.now(manila_timezone)

            try:
                  # Initialize or update failure count
                if 'failure' not in message_data:
                    message_data['failure'] = 0

                # Validate necessary fields
                if not (page_id and access_token and schedule_date and schedule_time):
                    message_data['failure'] += 1 # Increment failure count
                    message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                    updateScheduleMessageByFields(redis_key, message_data)
                    raise ValueError("Required fields are missing in message data.")
                
                # Check for task abortion
                if self.is_aborted():
                    message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                    message_data['status'] = "STOPPED"
                    success = updateScheduleMessageByFields(redis_key, message_data)
                    
                    if success:
               
                        return "Task stopped"
                    else:
                        return "Task was stopped but failed to update the schedule."

                # Check if it's time to process the task
                if current_time == scheduled_datetime or current_time >= scheduled_datetime:
                    try:
                        result = handlesendingmessage(message_data)
                    except Exception as e:
                        message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                        message_data['failure'] += 1
                        message_data['status'] = "Failed"
                        updateScheduleMessageByFields(redis_key, message_data)
                        continue
                        
 
                    # Update status based on the result
                    if result.get("status") == "success":
                        conversation_ids = result.get("total_conversations")
                        successCounts = result.get("successes")
                        message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                        message_data['successCounts'] = successCounts
                        message_data['conversation_ids'] = conversation_ids
                        message_data['status'] = "Success"
                    else:
                        message_data['task_done_time'] = datetime.now(manila_timezone).strftime('%Y-%m-%d %H:%M:%S')
                        message_data['status'] = "Failed"
                        message_data['failure'] += 1  # Increment failure count

                    # Update the message in Redis
                    success = updateScheduleMessageByFields(redis_key, message_data)
                    if not success:
                        raise ValueError("Failed to update message data in Redis after task execution.")
                    
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
