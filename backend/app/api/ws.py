import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        msg_str = json.dumps(message, default=str)
        dead: list = []
        for connection in self.active_connections:
            try:
                await connection.send_text(msg_str)
            except Exception as e:
                logger.warning("Caught exception in api/ws.py: %s", e)
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

manager = ConnectionManager()

@router.websocket("/ws/intel")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection success
        await websocket.send_text(json.dumps({"type": "CONNECTION_ESTABLISHED", "payload": {"status": "connected"}}))
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages from client (e.g., manual trigger)
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
