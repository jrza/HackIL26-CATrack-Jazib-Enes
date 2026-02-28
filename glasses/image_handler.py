"""
Meta Glasses Image Handler
Receives images from Meta glasses via webhook and forwards to backend findings endpoint.
"""
import os
import base64
import json
import logging
import asyncio
import re
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
IMAGE_WEBHOOK_PORT = int(os.getenv("IMAGE_WEBHOOK_PORT", "8766"))

# Shared state set by voice_handler (or set directly for testing), protected by _state_lock
_state_lock = threading.Lock()
_current_inspection_id: Optional[str] = None
_current_component: Optional[str] = None

# Allowed image content types
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


async def forward_image_to_backend(image_b64: str, content_type: str) -> dict:
    """
    Upload a base64-encoded image to the backend and submit it as a finding.
    The image is sent as a data-URI so no external URL is needed.
    """
    with _state_lock:
        inspection_id = _current_inspection_id
        component = _current_component or "General"

    if not inspection_id:
        return {"status": "error", "message": "No active inspection. Use voice handler to start one."}
    data_uri = f"data:{content_type};base64,{image_b64}"
    payload = {
        "inspection_id": inspection_id,
        "component": component,
        "image_url": data_uri,
        "voice_transcript": f"Image captured for {component} inspection",
    }

    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=60.0) as client:
        resp = await client.post("/findings", json=payload)
        resp.raise_for_status()
        finding = resp.json()
        logger.info(
            "Image finding submitted: %s (severity=%s, confidence=%.2f)",
            finding.get("issue"),
            finding.get("severity"),
            finding.get("confidence", 0),
        )
        return {"status": "ok", "finding": finding}


class ImageWebhookHandler(BaseHTTPRequestHandler):
    """
    HTTP handler that receives captured images from Meta Companion App webhook.

    Expected JSON payload:
    {
        "image": "<base64-encoded image data>",
        "content_type": "image/jpeg",   # optional, defaults to image/jpeg
        "inspection_id": "...",         # optional override
        "component": "..."              # optional override
    }
    """

    def log_message(self, format_str, *args):  # suppress default HTTP logging
        logger.debug(format_str, *args)

    def do_POST(self):  # noqa: N802
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > _MAX_IMAGE_BYTES + 1024:  # allow small overhead for JSON framing
            self._respond(413, {"error": "Payload too large"})
            return

        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._respond(400, {"error": "Invalid JSON"})
            return

        image_b64 = payload.get("image", "").strip()
        if not image_b64:
            self._respond(400, {"error": "Missing 'image' field"})
            return

        # Validate base64 — only allow standard alphabet + padding
        if not re.fullmatch(r"[A-Za-z0-9+/]*={0,2}", image_b64):
            self._respond(400, {"error": "Invalid base64 encoding"})
            return

        content_type = payload.get("content_type", "image/jpeg").strip()
        if content_type not in _ALLOWED_CONTENT_TYPES:
            self._respond(400, {"error": f"Unsupported content type: {content_type}"})
            return

        # Validate decoded size
        try:
            decoded = base64.b64decode(image_b64, validate=True)
        except Exception:
            self._respond(400, {"error": "Failed to decode base64 image"})
            return

        if len(decoded) > _MAX_IMAGE_BYTES:
            self._respond(413, {"error": "Decoded image too large (max 10 MB)"})
            return

        # Allow per-request override of inspection context
        if payload.get("inspection_id") or payload.get("component"):
            with _state_lock:
                if payload.get("inspection_id"):
                    _current_inspection_id = str(payload["inspection_id"])
                if payload.get("component"):
                    _current_component = str(payload["component"])

        logger.info(
            "Received image (%s, %d bytes) for inspection=%s component=%s",
            content_type,
            len(decoded),
            _current_inspection_id,
            _current_component,
        )

        result = asyncio.run(forward_image_to_backend(image_b64, content_type))
        status_code = 200 if result.get("status") == "ok" else 500
        self._respond(status_code, result)

    def _respond(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = HTTPServer(("0.0.0.0", IMAGE_WEBHOOK_PORT), ImageWebhookHandler)
    logger.info("Image webhook listening on port %d", IMAGE_WEBHOOK_PORT)
    logger.info("Backend URL: %s", BACKEND_URL)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down image handler.")
        server.server_close()


if __name__ == "__main__":
    main()
