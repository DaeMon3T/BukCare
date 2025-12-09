from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        # Dictionary to store active connections: user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[str(user_id)] = websocket
        print(f"User {user_id} connected. Active users: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        if str(user_id) in self.active_connections:
            del self.active_connections[str(user_id)]
            print(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user"""
        if str(user_id) in self.active_connections:
            websocket = self.active_connections[str(user_id)]
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Send a message to everyone (e.g., 'Server going down')"""
        for connection in self.active_connections.values():
            await connection.send_json(message)

# Create a single global instance
manager = ConnectionManager()