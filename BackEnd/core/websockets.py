from fastapi import WebSocket

active_connections = []

async def connect(ws: WebSocket):
    await ws.accept()
    active_connections.append(ws)

async def disconnect(ws: WebSocket):
    active_connections.remove(ws)

async def broadcast(message: str):
    for ws in active_connections:
        await ws.send_text(message)
