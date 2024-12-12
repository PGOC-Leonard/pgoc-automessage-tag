import json
import time
import redis
from celery_workers.celerytasks import addScheduletoCeleryTask
from controllers.RedisController import getScheduledJobs, updateScheduleMessageByFields, updateScheduleMessageData

# Connect to the Redis database for scheduled jobs

scheduled_db = redis.Redis(host='redis', port=6379, db=2, decode_responses=True)

def fetch_existing_jobs():
    """
    Fetch all existing scheduled jobs from Redis with status 'SCHEDULED'.
    """
    try:
        keys = scheduled_db.keys('*')  # Get all keys in Redis
        existing_jobs = {}
        
        for key in keys:
            data = scheduled_db.get(key)
            if data:  # Check if the data exists
                jobs = json.loads(data)  # Parse JSON data
                # Filter only jobs with status 'SCHEDULED'
                scheduled_jobs = [job for job in jobs if job.get('status') == 'Scheduled']
                if scheduled_jobs:  # Only add keys with scheduled jobs
                    existing_jobs[key] = scheduled_jobs

        return existing_jobs
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return {}


def compare_job_data(new_job, existing_job):
    """
    Compare two jobs based on their message_data fields.
    Returns True if the jobs are identical, False otherwise.
    """
    new_data = new_job["message_data"]
    existing_data = existing_job["message_data"]
    
    # Compare all the relevant fields (page_id, access_token, max_workers, etc.)
    return (
        new_data["page_id"] == existing_data["page_id"] and
        new_data["access_token"] == existing_data["access_token"] and
        new_data["max_workers"] == existing_data["max_workers"] and
        new_data["message_title"] == existing_data["message_title"] and
        new_data["start_date"] == existing_data["start_date"] and
        new_data["end_date"] == existing_data["end_date"] and
        new_data["start_time"] == existing_data["start_time"] and
        new_data["end_time"] == existing_data["end_time"] and
        new_data["schedule_date"] == existing_data["schedule_date"] and
        new_data["schedule_time"] == existing_data["schedule_time"]
    )
    
    
def stop_schedule(task_id):
    task = addScheduletoCeleryTask.AsyncResult(task_id)
    task.abort()
    response = {
        "task_id": task_id,
        "status": task.status,
        "result": str(task.result) if task.result else None  # Ensure result is serializable
    }
    return response



def run_scheduler():
 
    # Step 1: Fetch existing jobs from Redis
    existing_jobs = fetch_existing_jobs()

    # Step 2: Fetch new scheduled jobs
    scheduled_job = getScheduledJobs()  # Replace with your actual job-fetching logic
    if not scheduled_job or scheduled_job.get("status") != "success":
        print("No scheduled jobs fetched or fetch failed.")
        return {"status": "error", "message": "No scheduled jobs available"}

    new_jobs = scheduled_job["data"]
    newly_added_jobs = {}

    # Step 3: Process and add new jobs
    for key, jobs in new_jobs.items():
        # Fetch existing jobs for this key
        existing_data_for_key = scheduled_db.get(key)
        if existing_data_for_key:
            existing_data_for_key = json.loads(existing_data_for_key)
        else:
            existing_data_for_key = []

        # Prepare new jobs for the key
        new_jobs_for_key = []

        for job in jobs:
            # Check if this job is new by comparing it with existing jobs
            if not any(compare_job_data(job, existing_job) for existing_job in existing_data_for_key):
                new_jobs_for_key.append(job)
                existing_data_for_key.append(job)

        # If there are new jobs, process them
        if new_jobs_for_key:
            newly_added_jobs[key] = new_jobs_for_key

            # Trigger Celery tasks for the new jobs
            for job in new_jobs_for_key:
                task = addScheduletoCeleryTask.apply_async(args=[{key: [job]}])  # Pass job wrapped in a dict
                time.sleep(1)  # Adjust as necessary
                job["task_id"] = task.id
                job["task_result"] = str(task.result)
                job["status"] = str(task.result)

            # Update Redis with the latest job list
            message_data = job.get("message_data", {})
            index = message_data.get('index')
            message_data["task_id"] = task.id  # Add the task ID to message data
            message_data["task_status"] = str(task.result)
            print(index)
            
            
            scheduled_db.set(key, json.dumps(existing_data_for_key))

            updateScheduleMessageByFields(key, message_data)
            

    # Step 4: Return results
    result = {
        "jobs": {
            "newjobs": newly_added_jobs,  # Newly added jobs
            "scheduled_messages": existing_jobs,  # All existing jobs
        }
    }
    return result

def update_scheduler(redis_key, updated_job):
    """
    Update scheduler function.
    Finds the job by its index, adds the schedule to Celery to get a new task ID, task result, and status.
    
    Args:
        redis_key (str): The Redis key for the job list.
        updated_job (dict): The updated job data (including index).
    
    Returns:
        dict: Status and result of the update process.
    """
    # Step 1: Fetch existing jobs from Redis
    existing_data = scheduled_db.get(redis_key)
    if existing_data:
        existing_jobs = json.loads(existing_data)
    else:
        existing_jobs = []

    # Step 2: Extract the updated message data (we need the index)
    updated_message_data = updated_job.get("message_data", {})
    updated_index = updated_message_data.get("index")
    
    # Ensure index is provided
    if updated_index is None:
        return {"status": "error", "message": "Updated job is missing 'index' in message_data."}

    # Step 3: Find the job to update by its index
    job_found = False
    for existing_job in existing_jobs:
        existing_message_data = existing_job.get("message_data", {})
        
        if existing_message_data.get("index") == updated_index:
            job_found = True
            # Step 4: Trigger Celery task to get the new task details (task_id, task_result, status)
            task = addScheduletoCeleryTask.apply_async(args=[{redis_key: [existing_job]}])
            time.sleep(1)  # Adjust sleep time if necessary

            # Step 5: Update the job's task-related fields with the new task info
            updated_message_data["task_id"] = task.id
            updated_message_data["task_result"] = str(task.result)
            updated_message_data["status"] = "Scheduled"

            # Update both message_data and outer fields of the job
            existing_job["message_data"]["task_id"] = updated_message_data["task_id"]
            existing_job["message_data"]["task_result"] = updated_message_data["task_result"]
            existing_job["message_data"]["status"] = updated_message_data["status"]

            existing_job["task_id"] = updated_message_data["task_id"]
            existing_job["task_result"] = updated_message_data["task_result"]
            existing_job["status"] = updated_message_data["status"]

            break

    if not job_found:
        return {
            "status": "error",
            "message": "Job with the specified index was not found.",
        }

    # Step 6: Save the updated job list back to Redis
    scheduled_db.set(redis_key, json.dumps(existing_jobs))

    # Optionally update the Redis controller or database with the updated fields
    updateScheduleMessageData(redis_key, updated_index, updated_message_data)

    return {
        "status": "success",
        "message": "Job task details updated successfully with new task information.",
        "updated_job": updated_message_data,
    }
