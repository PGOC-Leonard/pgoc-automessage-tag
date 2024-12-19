from celery_workers.celerytasks import addTagScheduletoCelery
from controllers.TagRedisController import updateTagByFields

def run_tagscheduler( redis_key, taskData):
    
    
    schedule_tag = addTagScheduletoCelery.apply_async(args=[redis_key,taskData])
    taskData["task_id_schedule"] = schedule_tag.id
    taskData["status"] = "Scheduled"
    updateTagByFields(
                redis_key, taskData)
    
    response_data = {
            "message": "Scheduled Tag Task",
            "result": "Success",
            "task_id": schedule_tag.id
        }
    
    # taskData[]
    
    return response_data

def stop_tag_schedule(task_id):
    task = addTagScheduletoCelery.AsyncResult(task_id)
    task.abort()
    response = {
        "task_id": task_id,
        "status": task.status,
        "result": str(task.result) if task.result else None  # Ensure result is serializable
    }
    return response
# def update_scheduler(redis_key, updated_job):
#     """
#     Update scheduler function.
#     Finds the job by its index, adds the schedule to Celery to get a new task ID, task result, and status.
    
#     Args:
#         redis_key (str): The Redis key for the job list.
#         updated_job (dict): The updated job data (including index).
    
#     Returns:
#         dict: Status and result of the update process.
#     """
#     # Step 1: Fetch existing jobs from Redis
#     existing_data = scheduled_db.get(redis_key)
#     if existing_data:
#         existing_jobs = json.loads(existing_data)
#     else:
#         existing_jobs = []

#     # Step 2: Extract the updated message data (we need the index)
#     updated_message_data = updated_job.get("message_data", {})
#     updated_index = updated_message_data.get("index")
    
#     # Ensure index is provided
#     if updated_index is None:
#         return {"status": "error", "message": "Updated job is missing 'index' in message_data."}

#     # Step 3: Find the job to update by its index
#     job_found = False
#     for existing_job in existing_jobs:
#         existing_message_data = existing_job.get("message_data", {})
        
#         if existing_message_data.get("index") == updated_index:
#             job_found = True
#             # Step 4: Trigger Celery task to get the new task details (task_id, task_result, status)
#             task = addScheduletoCeleryTask.apply_async(args=[{redis_key: [existing_job]}])
#             time.sleep(1)  # Adjust sleep time if necessary

#             # Step 5: Update the job's task-related fields with the new task info
#             updated_message_data["task_id"] = task.id
#             updated_message_data["task_result"] = str(task.result)
#             updated_message_data["status"] = "Scheduled"

#             # Update both message_data and outer fields of the job
#             existing_job["message_data"]["task_id"] = updated_message_data["task_id"]
#             existing_job["message_data"]["task_result"] = updated_message_data["task_result"]
#             existing_job["message_data"]["status"] = updated_message_data["status"]

#             existing_job["task_id"] = updated_message_data["task_id"]
#             existing_job["task_result"] = updated_message_data["task_result"]
#             existing_job["status"] = updated_message_data["status"]

#             break

#     if not job_found:
#         return {
#             "status": "error",
#             "message": "Job with the specified index was not found.",
#         }

#     # Step 6: Save the updated job list back to Redis
#     scheduled_db.set(redis_key, json.dumps(existing_jobs))

#     # Optionally update the Redis controller or database with the updated fields
#     updateScheduleMessageData(redis_key, updated_index, updated_message_data)

#     return {
#         "status": "success",
#         "message": "Job task details updated successfully with new task information.",
#         "updated_job": updated_message_data,
#     }
