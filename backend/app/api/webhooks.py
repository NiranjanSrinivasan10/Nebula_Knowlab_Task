from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from typing import Dict, Any
import json
import base64
from app.services.gmail_service import GmailService
from app.services.pubsub_service import PubSubService
from app.api.auth import get_credentials
from app.config import settings

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

# Store active WebSocket connections for broadcasting
# In production, this should be a proper connection manager
active_connections = []


class ConnectionManager:
    """Manages WebSocket connections for broadcasting."""
    
    def __init__(self):
        self.active_connections = []
    
    async def connect(self, websocket):
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@router.post("/gmail")
async def gmail_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receive Pub/Sub push notifications from Gmail.
    
    The Pub/Sub message contains:
    - emailAddress: The email address of the user
    - historyId: The history ID of the change
    """
    try:
        # Parse Pub/Sub push message
        body = await request.json()
        
        # Pub/Sub messages are base64 encoded
        if 'message' not in body:
            raise HTTPException(status_code=400, detail="Invalid Pub/Sub message format")
        
        pubsub_message = body['message']
        data = pubsub_message.get('data', '')
        
        if data:
            # Decode base64 data
            decoded_data = base64.b64decode(data).decode('utf-8')
            message_data = json.loads(decoded_data)
            
            email_address = message_data.get('emailAddress')
            history_id = message_data.get('historyId')
            
            if not history_id:
                raise HTTPException(status_code=400, detail="No historyId in message")
            
            # Process the new email in background
            background_tasks.add_task(
                process_gmail_notification,
                history_id,
                email_address
            )
        
        return {"status": "received"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_gmail_notification(history_id: str, email_address: str):
    """
    Process Gmail notification and broadcast to connected clients.
    
    Args:
        history_id: The history ID from the notification
        email_address: The user's email address
    """
    try:
        # In a real implementation, you would:
        # 1. Get credentials for this user (from session storage)
        # 2. Use pubsub_service.get_history() to get changes
        # 3. Fetch new emails using gmail_service
        # 4. Broadcast to WebSocket connections
        
        # For now, we'll broadcast a notification
        notification = {
            "type": "gmail_notification",
            "history_id": history_id,
            "email_address": email_address,
            "message": "New email received"
        }
        
        await manager.broadcast(notification)
        
    except Exception as e:
        print(f"Error processing Gmail notification: {e}")


def get_connection_manager() -> ConnectionManager:
    """Get the connection manager instance."""
    return manager
