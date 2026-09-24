from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import json
from app.services.assistant_service import AssistantService
from app.api.webhooks import get_connection_manager

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
assistant_service = AssistantService()


@router.websocket("/ws")
async def assistant_websocket(
    websocket: WebSocket,
    current_view: str = Query("inbox", description="Current UI view"),
    open_email_id: Optional[str] = Query(None, description="Currently open email ID")
):
    """WebSocket endpoint for streaming assistant actions and receiving live updates."""
    manager = get_connection_manager()
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive user message from frontend
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            user_message = message_data.get("message", "")
            current_view = message_data.get("current_view", current_view)
            open_email_id = message_data.get("open_email_id", open_email_id)
            
            if not user_message:
                await websocket.send_json({
                    "type": "error",
                    "message": "No message provided"
                })
                continue
            
            # Process the request
            actions = assistant_service.process_request(
                user_message=user_message,
                current_view=current_view,
                open_email_id=open_email_id
            )
            
            # Stream actions to frontend
            await websocket.send_json({
                "type": "actions",
                "actions": actions
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("WebSocket disconnected")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        manager.disconnect(websocket)
