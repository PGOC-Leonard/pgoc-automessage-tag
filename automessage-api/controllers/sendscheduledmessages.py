from datetime import datetime
import json
import os
import time
import requests

from controllers.sendmessagestoconversations import send_message_to_conversations


def handlesendingmessage(message_data):
    print("Got message data, handling send message")
    print("Trying to send message")
    
    # Get conversation IDs based on the message data
    conversation_ids = get_conversation_ids(message_data)
    
    # Check if conversation_ids is a dictionary indicating an error
    if isinstance(conversation_ids, dict) and "status" in conversation_ids:
        return conversation_ids  # Return the error response
    
    # Send the messages
    response_data = send_messages(conversation_ids, message_data)
    
    # Add the total number of conversation IDs to the response
    response_data["total_conversations"] = len(conversation_ids)
    time.sleep(3)
    return response_data

    
# Get conversation IDs
def get_conversation_ids(message_data):
    print("Getting conversation ID")
    conversation_ids = get_all_conversation_ids (message_data)
    return conversation_ids


def get_all_conversation_ids(message_data):
    # Extract the date and time fields
    page_id = message_data['page_id']
    access_token = message_data['access_token']
    start_date = message_data['start_date']
    end_date = message_data['end_date']
    start_time_str = message_data['start_time']
    end_time_str = message_data['end_time']

    # Combine date and time into datetime objects
    start_datetime = datetime.strptime(f"{start_date} {start_time_str}", "%Y-%m-%d %H:%M:%S")
    end_datetime = datetime.strptime(f"{end_date} {end_time_str}", "%Y-%m-%d %H:%M:%S")

    # Convert to epoch time
    start_epoch_time = int(start_datetime.timestamp())
    end_epoch_time = int(end_datetime.timestamp())

    all_conversation_ids = set()
    current_count = 0

    print(f"Start Epoch Time: {start_epoch_time}, End Epoch Time: {end_epoch_time}")

    while True:
        # Construct Pancake API URL
        pancake_api = (
            f"https://pages.fm/api/v1/pages/{page_id}/conversations?type=NOPHONE,INBOX,"
            f"CREATE_DATE:{start_epoch_time}+-+{end_epoch_time}&mode=OR&from_platform=web&"
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

def send_messages(conversation_ids, message_data):
    print("Sending messages")
    response_data = send_message_to_conversations(conversation_ids, message_data)


    return response_data