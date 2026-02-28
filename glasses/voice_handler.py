"""
Meta Glasses Voice Handler
Receives voice commands from Meta glasses via webhook and forwards to backend.
"""
import os
import asyncio
import logging
from typing import Optional
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import re
import threading

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
VOICE_WEBHOOK_PORT = int(os.getenv("VOICE_WEBHOOK_PORT", "8765"))

# In-memory state for current inspection context (protected by _state_lock)
_state_lock = threading.Lock()
_current_inspection_id: Optional[str] = None
_current_component: Optional[str] = None


def parse_voice_command(transcript: str) -> dict:
    """
    Parse voice command transcript into structured command.
    Returns dict with 'command' and optional 'args'.
    """
    transcript_lower = transcript.lower().strip()
    
    # "start inspection <asset_id>"
    m = re.match(r"start inspection\s+(\S+)", transcript_lower)
    if m:
        return {"command": "start_inspection", "asset_id": m.group(1).upper()}
    
    # "check <component>"
    m = re.match(r"check\s+(.+)", transcript_lower)
    if m:
        return {"command": "check_component", "component": m.group(1).strip()}
    
    # "i see <description>" or "i notice <description>"
    m = re.match(r"(?:i see|i notice)\s+(.+)", transcript_lower)
    if m:
        return {"command": "submit_finding", "description": m.group(1).strip()}
    
    # "end inspection"
    if re.match(r"end inspection", transcript_lower):
        return {"command": "end_inspection"}
    
    # Generic — treat as finding description
    return {"command": "submit_finding", "description": transcript.strip()}


async def handle_command(command: dict) -> dict:
    """Execute parsed voice command by calling backend API."""
    global _current_inspection_id, _current_component

    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=30.0) as client:
        cmd = command["command"]

        if cmd == "start_inspection":
            asset_id = command["asset_id"]
            resp = await client.post("/inspection", json={"asset_id": asset_id})
            resp.raise_for_status()
            data = resp.json()
            with _state_lock:
                _current_inspection_id = data["id"]
                inspection_id = _current_inspection_id
            logger.info("Started inspection %s for asset %s", inspection_id, asset_id)
            return {"status": "ok", "inspection_id": inspection_id, "asset_id": asset_id}

        if cmd == "check_component":
            with _state_lock:
                _current_component = command["component"]
                component = _current_component
            logger.info("Current component set to: %s", component)
            return {"status": "ok", "component": component}

        if cmd == "submit_finding":
            with _state_lock:
                inspection_id = _current_inspection_id
                component = _current_component or "General"
            if not inspection_id:
                return {"status": "error", "message": "No active inspection. Say 'start inspection <asset_id>' first."}
            payload = {
                "inspection_id": inspection_id,
                "component": component,
                "voice_transcript": command["description"],
            }
            resp = await client.post("/findings", json=payload)
            resp.raise_for_status()
            finding = resp.json()
            logger.info("Finding submitted: %s (severity=%s)", finding.get("issue"), finding.get("severity"))
            return {"status": "ok", "finding": finding}

        if cmd == "end_inspection":
            with _state_lock:
                inspection_id = _current_inspection_id
            if not inspection_id:
                return {"status": "error", "message": "No active inspection."}
            resp = await client.post(f"/inspection/{inspection_id}/complete")
            resp.raise_for_status()
            logger.info("Inspection %s completed.", inspection_id)
            with _state_lock:
                _current_inspection_id = None
                _current_component = None
            return {"status": "ok", "inspection_id": inspection_id}

    return {"status": "error", "message": "Unknown command"}


class VoiceWebhookHandler(BaseHTTPRequestHandler):
    """HTTP handler that receives voice transcripts from Meta Companion App webhook."""

    def log_message(self, format_str, *args):  # suppress default HTTP logging
        logger.debug(format_str, *args)

    def do_POST(self):  # noqa: N802
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._respond(400, {"error": "Invalid JSON"})
            return

        transcript = payload.get("transcript", "").strip()
        if not transcript:
            self._respond(400, {"error": "Missing 'transcript' field"})
            return

        logger.info("Received voice transcript: %r", transcript)
        command = parse_voice_command(transcript)
        result = asyncio.run(handle_command(command))
        self._respond(200, result)

    def _respond(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = HTTPServer(("0.0.0.0", VOICE_WEBHOOK_PORT), VoiceWebhookHandler)
    logger.info("Voice webhook listening on port %d", VOICE_WEBHOOK_PORT)
    logger.info("Backend URL: %s", BACKEND_URL)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down voice handler.")
        server.server_close()


if __name__ == "__main__":
    main()
