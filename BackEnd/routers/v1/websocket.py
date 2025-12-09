from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.socket_manager import manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, userId: str):
    # Connect the user
    await manager.connect(websocket, userId)
    
    try:
        while True:
            # Keep the connection open and listen for messages (optional)
            # We mostly use this for SENDING from server -> client
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(userId)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(userId)