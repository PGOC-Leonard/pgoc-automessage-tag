# Get conversation IDs
from datetime import datetime
import time

import requests


from datetime import datetime
import time
from celery.result import AsyncResult

from celery_workers.celerytasks import process_conversations_and_send_messages

def handlesendingmessage(redis_key,message_data):
    """
    Handles sending a message by creating an asynchronous Celery task.
    Returns task information immediately without waiting for task completion.
    """
    print("Got message data, handling send message")
    print("Trying to send message")

    # Start the Celery task
    sendtask = process_conversations_and_send_messages.apply_async(args=[redis_key,message_data])

    # Get task ID and status
    task_id = sendtask.id
    task_status = sendtask.status

    # Response data for success
    response_data = {
        "message": "Send Message Added",
        "result": "Success",
        "task_id": task_id,
        "status": task_status
    }

    print("Task created with ID:", task_id, "and status:", task_status)
    return response_data


