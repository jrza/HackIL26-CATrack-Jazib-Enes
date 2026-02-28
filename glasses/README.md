# Meta Glasses Integration

## Overview
This module bridges Meta Ray-Ban smart glasses with the CAT Inspect AI Co-Pilot backend.
Voice commands and images captured via the glasses are forwarded to the backend for AI analysis.

## Prerequisites
- Meta Ray-Ban smart glasses paired with the Meta View companion app
- Python 3.11+ on the host machine
- Backend server running at the configured URL

## Setup

### 1. Install Dependencies
```bash
pip install -r ../backend/requirements.txt
pip install websockets==12.0
```

### 2. Configure Environment
Copy `../backend/.env.example` to `../backend/.env` and set:
```
BACKEND_URL=http://localhost:8000
VOICE_WEBHOOK_PORT=8765
IMAGE_WEBHOOK_PORT=8766
```

### 3. Pair Your Glasses
1. Open Meta View app on your phone
2. Enable Live Caption and photo sharing
3. Configure webhook URL to point to this handler

### 4. Run the Handlers
```bash
python voice_handler.py   # Terminal 1
python image_handler.py   # Terminal 2
```

## Voice Commands
| Command | Action |
|---|---|
| `"Start inspection [asset ID]"` | Creates new inspection session |
| `"Check [component name]"` | Opens checkpoint for that component |
| `"I see [description]"` | Submits voice finding for current component |
| `"I notice [description]"` | Submits voice finding for current component |
| `"End inspection"` | Completes current inspection |

## Image Capture
Images are automatically forwarded when captured via glasses camera.
The image is base64-encoded and sent to `POST /findings` with the current inspection context.

## Architecture
```
Glasses → Meta Companion App → Webhook → voice_handler.py / image_handler.py → FastAPI Backend
```

## Port Reference
| Handler | Default Port | Env Variable |
|---|---|---|
| Voice webhook | 8765 | `VOICE_WEBHOOK_PORT` |
| Image webhook | 8766 | `IMAGE_WEBHOOK_PORT` |

## Troubleshooting
- **No active inspection error**: Ensure `voice_handler.py` is running and you have said `"Start inspection <asset_id>"` first.
- **Connection refused to backend**: Verify the backend is running and `BACKEND_URL` is correct.
- **413 Payload Too Large**: Images must be under 10 MB after decoding.
