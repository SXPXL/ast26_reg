import asyncio
import json
import logging
from typing import Any, Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class PaymentVerificationWSManager:
    """
    Manages live WebSocket connections for the Verify Payments portal.
    Broadcasts new registrations and payment confirmations in real time
    so volunteers/admins see recently registered students at the top immediately.
    """

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.info(f"VerifyPayments WS connected. Active clients: {len(self._connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.info(f"VerifyPayments WS disconnected. Active clients: {len(self._connections)}")

    async def broadcast(self, event_type: str, payload: Dict[str, Any]) -> None:
        if not self._connections:
            return
        message = json.dumps({"event": event_type, "data": payload}, default=str)
        async with self._lock:
            targets = list(self._connections)

        stale: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(ws)

        if stale:
            async with self._lock:
                for ws in stale:
                    self._connections.discard(ws)


verify_payments_ws_manager = PaymentVerificationWSManager()
