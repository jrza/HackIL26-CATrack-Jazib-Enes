# CAT Inspect AI Co-Pilot

AI-powered equipment inspection assistant for Caterpillar heavy machinery. Combines a React Native mobile app with a FastAPI backend, local LLM vision analysis (LLaVA via Ollama), cloud AI escalation (Amazon Bedrock), and offline-first sync (Supabase).

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installed
- Expo Go app on your phone (or an iOS/Android simulator)

---

## 1. Pull the LLaVA model

```bash
ollama pull llava:7b-v1.6-mistral-q4_K_M
```

Ollama starts automatically on macOS. If it isn't running:

```bash
ollama serve
```

---

## 2. Set up the backend

```bash
cd backend

# Create virtual environment and install dependencies
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
```

Edit `backend/.env`:

```env
SUPABASE_URL=your_supabase_url         # optional — app works offline without it
SUPABASE_KEY=your_supabase_anon_key    # optional
SUPERMEMORY_API_KEY=your_key           # optional — used for machine history memory
AWS_ACCESS_KEY_ID=your_key             # optional — needed for Bedrock escalation
AWS_SECRET_ACCESS_KEY=your_secret      # optional
AWS_REGION=us-east-2
BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20251001
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llava:7b-v1.6-mistral-q4_K_M
```

> All external services are optional. Without them the app runs in offline/demo mode using mock data and returns fallback AI results.

Start the backend:

```bash
venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` flag is required so your phone can reach the server over the local network.

API docs available at: `http://localhost:8000/docs`

---

## 3. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` with your machine's local IP address (so the phone can reach the backend):

```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000
```

Find your local IP:
```bash
ipconfig getifaddr en0   # macOS Wi-Fi
```

Start the app:

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## App Flow

```
Home (Fleet tab)
  └── Tap a machine
        └── Inspection created automatically
              ├── Walk Around  →  rate items → Done → findings submitted to AI
              ├── + Add Finding (from Inspections tab → tap inspection)
              │     └── Select component → voice description → Submit
              │           └── LLaVA classifies severity in real time
              └── Submit → Review findings → Generate Report
```

---

## How AI Classification Works

Every finding submission is automatically analyzed:

1. **Local LLM (LLaVA)** — classifies severity (PASS / MONITOR / MODERATE / CRITICAL), generates issue description, recommended action, and confidence score
2. **Confidence routing:**
   - `≥ 0.9` — high confidence, trust local result
   - `0.7–0.89` — escalated to **AWS Bedrock (Claude 3.5 Haiku)** for a second opinion
   - `< 0.7` — flagged for human review
3. **Fallback** — if Ollama is unreachable, a safe fallback result is returned so the app keeps working

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/                 # API route handlers
│   ├── services/
│   │   ├── local_llm.py         # LLaVA / Ollama integration
│   │   ├── bedrock.py           # AWS Bedrock escalation
│   │   └── supermemory.py       # Machine history memory
│   ├── models/                  # Pydantic data models
│   └── requirements.txt
├── frontend/
│   ├── app/                     # Expo Router screens
│   ├── components/              # Reusable UI components
│   ├── services/api.ts          # All backend API calls
│   └── hooks/                   # useInspection, useSync, useVoice
└── glasses/                     # Meta AI glasses companion scripts
```
