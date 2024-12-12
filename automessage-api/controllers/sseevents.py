import logging
import time
from flask import Blueprint, Response, request
from threading import Lock
import redis 

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Global variables
event_lock = Lock()

# Blueprint definition
events_blueprint = Blueprint('events', __name__)
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

# Ensure keyspace notifications are enabled
redis_client.config_set('notify-keyspace-events', 'KEA')

def listen_for_redis_changes(key_to_listen): 
    pubsub = redis_client.pubsub()
    pubsub.psubscribe('__keyspace@0__:*')
    logging.info(f'Subscribed to keyspace notifications for all keys')
    for message in pubsub.listen():
        logging.debug(f'Received message: {message}')
        if message['type'] == 'pmessage' and key_to_listen in message['channel'] and message['data'] == 'set':
            yield 'data: {"eventType": "update", "message": "Data Updated"}\n\n'
        else:
            yield 'data: {"eventType": "alert", "message": "No Updates"}\n\n'

def send_signal(key_to_listen):
    """Generates the SSE stream."""
    while True:
        for message in listen_for_redis_changes(key_to_listen):
            yield message
        time.sleep(1)  # Add sleep to reduce CPU usage

# Routes for the events
@events_blueprint.route('/events')
def events():
    """SSE endpoint that continuously checks for changes in the Redis key."""
    key_to_listen = request.args.get('key', default=None, type=str)
    if key_to_listen and redis_client.exists(key_to_listen):
        logging.info(f'Starting SSE stream for key: {key_to_listen}')
        return Response(send_signal(key_to_listen), content_type='text/event-stream')
    else:
        logging.warning('No Redis key provided or key does not exist')
        return Response("No redis key", content_type='text/event-stream')
