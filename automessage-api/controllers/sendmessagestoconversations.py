import requests

# Define global variables for tracking success/failure statuses.
success_unique_convid = []
failures_unique_convid = []
response_unique_convid = []

def send_message_to_conversations(conversation_ids, message_data):
    try:
        successes = 0
        failures = 0
        responses = []

        # Extract values from message_data
        page_id = message_data["page_id"]
        access_token = message_data["access_token"]
        message = message_data["text_message"]
        method_message = message_data["method_message"]     
        schedule_time = message_data["schedule_time"]
        # start_hour = message_data["start_hour"]
        # start_minute = message_data["start_minute"]
        # start_second = message_data["start_second"]
        # end_hour = message_data["end_hour"]
        # end_minute = message_data["end_minute"]
        # end_second = message_data["end_second"]
        # input_schedule_hour = message_data["input_schedule_hour"]
        # input_schedule_minute = message_data["input_schedule_minute"]
        # input_schedule_ampm = message_data["input_schedule_ampm"]
        message_title = message_data["message_title"]

        # Reply helpers
        if method_message == 1:
            reply_helper_url = f"https://pages.fm/api/v1/pages/{page_id}/settings?access_token={access_token}"
            try:
                helper_response = requests.get(reply_helper_url)
                helper_response.raise_for_status()
                reply_helper_data = helper_response.json()

                quick_replies = reply_helper_data['settings']['quick_replies']
                reply_helper_message = None

                for quick_reply in quick_replies:
                    shortcut = quick_reply['shortcut']
                    messages = quick_reply['messages']

                    if str(shortcut) == str(message).strip():
                        reply_helper_message = messages
                        break
                
                if reply_helper_message is None:
                    print(f"No reply helper found for {message_title}. Scheduled message for {schedule_time}.")
                
            except requests.exceptions.RequestException as e:
                # Error in processing the reply helper
                print(f"HTTP Request Error: {str(e)}")
                return {"status": "error", "message": f"Error in processing the reply helper: {str(e)}"}

        # Send the message to each conversation
        customer_id_count = 1 
        for conv_id in conversation_ids:
            url = f"https://pages.fm/api/v1/pages/{page_id}/conversations/{conv_id}/messages?access_token={access_token}"
            try:
                
                if method_message == 1 and reply_helper_message:
                    print(f"Sending quick message to conversation ID {conv_id}")
                    for message_helper in reply_helper_message:
                        files = []
                        headers = {}
                        payloadmessage = message_helper["message"]
                        
                       
                        photo_url = message_helper['photos'][0]['url'] if message_helper['photos'] else None
                        photo_data = message_helper['photos'][0]['image_data'] if message_helper['photos'] else None
                        photo_name = message_helper['photos'][0]['name'] if message_helper['photos'] else None
                        print("This is Photo",photo_url)
                        print("Text Message:", payloadmessage)
                        payload = {'action': 'reply_inbox', 'message': payloadmessage,'content_url':photo_url, 'image_data': photo_data, 'name':photo_name}
                                
                              
                                # Pass customer_id_count to send_message function
                                #futures.append(executor.submit(send_message, url, headers, payload, files, conv_id, customer_id_count, terminal_listbox))
                        customer_id_count += 1
                    
                        response = requests.post(url, data=payload, files=files, headers=headers)
                    if response.status_code == 200:
                        response_json = response.json()
                        responses.append(response_json)

                    if response_json["id"] not in response_unique_convid:
                        response_unique_convid.append(response_json["id"])

                    if response_json["success"]:
                        if response_json["id"] not in success_unique_convid:
                            successes += 1
                            success_unique_convid.append(response_json["id"])
                    else:
                        if response_json["id"] not in failures_unique_convid:
                            failures += 1
                            failures_unique_convid.append(response_json["id"])
                else:
                    print(f"Sending normal message to conversation ID {conv_id}")
                    payload = {'action': 'reply_inbox', 'message': message}
                    files = []
                    headers = {}
                    customer_id_count += 1
                    response = requests.post(url, data=payload, files=files, headers=headers)
                    if response.status_code == 200:
                        response_json = response.json()
                        responses.append(response_json)

                    if response_json["id"] not in response_unique_convid:
                        response_unique_convid.append(response_json["id"])

                    if response_json["success"]:
                        if response_json["id"] not in success_unique_convid:
                            successes += 1
                            success_unique_convid.append(response_json["id"])
                    else:
                        if response_json["id"] not in failures_unique_convid:
                            failures += 1
                            failures_unique_convid.append(response_json["id"])
            except requests.exceptions.RequestException as e:
                print(f"Request failed for conversation ID {conv_id}: {str(e)}")
                failures += 1

        # If no successes or failures, return a message indicating the issue
        if successes == 0 and failures == len(conversation_ids):
            return {"status": "error", "message": "Failed to send messages to all conversation IDs."}

        # Returning success and failure stats
        return {
            "status": "success",
            "responses": responses,
            "successes": successes,
            "failures": failures
        }

    except Exception as e:
        print(f"Error in sending message: {str(e)}")
        return {"status": "error", "message": f"Error in sending message: {str(e)}"}
