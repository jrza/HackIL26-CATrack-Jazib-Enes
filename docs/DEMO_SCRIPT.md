# CAT Inspect AI Co-Pilot — Hackathon Demo Script

**Total runtime**: ~5 minutes  
**Audience**: Judges and observers unfamiliar with the system

---

## Pre-Demo Setup Checklist

Complete these steps **at least 15 minutes** before presenting:

- [ ] Backend running: `cd backend && uvicorn main:app --reload` — verify `GET /health` returns `{"status":"ok"}`
- [ ] Frontend running on device/emulator: `cd frontend && npx expo start`
- [ ] Demo asset seeded in DB: confirm `GET /machine/CAT-001` returns data
- [ ] `.env` set with valid `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (for Bedrock escalation)
- [ ] Phone/emulator on same Wi-Fi as laptop (or using Expo Go tunnel)
- [ ] Screen mirroring or emulator visible on projector
- [ ] Glasses (if demo-ing): voice_handler and image_handler running, webhook URL set in Meta View app
- [ ] Fallback slides ready (see [Fallback Plan](#fallback-plan-if-services-are-down) below)
- [ ] Browser tab open to `http://localhost:8000/docs` (FastAPI Swagger UI) as backup

---

## Step-by-Step Demo Flow (~5 minutes)

### Step 1 — Hook & Problem Statement (30 seconds)

> *"Every day, thousands of CAT machines need pre-shift safety inspections. Today, a technician walks around with a paper checklist, writes notes by hand, and then has to manually type up a report. That process is slow, error-prone, and can miss critical safety issues. We built CAT Inspect AI Co-Pilot to fix that."*

**Action**: Show the home screen of the mobile app with the asset list.

**Talking points**:
- Paper-based inspections miss ~23% of safety-critical findings (industry data)
- Technicians lose 30–45 minutes per shift on paperwork
- CAT machines cost $500K+; a missed hydraulic failure can cause total loss

---

### Step 2 — Start an Inspection (45 seconds)

> *"The technician opens the app, selects their machine — let's use CAT-001, a 336 Excavator — and starts a new inspection."*

**Action**:
1. Tap **CAT-001** on the asset list
2. Tap **Start Inspection**
3. Show the inspection checklist appearing with component checkpoints

**Talking points**:
- Checklist is pre-loaded from the machine profile — no setup needed
- Works fully offline; data is saved locally first, synced when back in range
- The app calls `POST /inspection` and returns an inspection ID immediately

---

### Step 3 — Submit a Voice Finding (60 seconds)

> *"Let's say the technician walks up to the boom and notices a hydraulic leak. They just tap the microphone and describe what they see."*

**Action**:
1. Tap the **Hydraulic System** checkpoint
2. Tap the microphone button, say: *"I notice a slow leak on the left boom cylinder"*
3. Watch the AI analysis spinner, then show the enriched finding card

**Talking points**:
- The voice transcript is sent to `POST /findings`
  - The backend calls Ollama/LLaVA locally for initial classification. If severity is MODERATE or CRITICAL it escalates to **Amazon Bedrock (Claude 3.5 Sonnet)**, which validates severity and recommends: *"Replace left boom cylinder seal before next shift"*
- The finding is stored with a confidence score — inspectors can see how certain the AI is
- This replaces 10 minutes of manual note-taking with a 10-second voice command

---

### Step 4 — Submit an Image Finding (45 seconds)

> *"Even better — the technician takes a photo directly from the app (or via glasses), and the AI visually analyzes the image."*

**Action**:
1. Tap the camera icon on the **Undercarriage** checkpoint
2. Select a pre-loaded demo photo of worn track pads
3. Show the AI-generated finding: severity **Medium**, issue *"Uneven track pad wear — replace within 200 hours"*

**Talking points**:
- Image is sent as a base64 data-URI to `POST /findings`
- GPT-4o Vision inspects the photo alongside any voice context
- Combines visual AI with domain-specific CAT component knowledge
- If using Meta Glasses: *"With our glasses integration, the technician never even touches the phone — they just look and speak"*

---

### Step 5 — Complete Inspection & View Report (45 seconds)

> *"Once the walk-around is done, the technician taps 'Complete Inspection'. Within seconds, a full PDF-ready report is generated."*

**Action**:
1. Tap **Complete Inspection**
2. Navigate to the **Reports** tab and open the generated report
3. Show the summary: total findings, severity breakdown, recommended actions

**Talking points**:
- Report calls `POST /inspection/{id}/complete` which triggers `GET /report/{inspection_id}`
- Report includes: overall machine health score, per-component findings, AI recommendations
- Can be shared with supervisor or uploaded to Cat Central in one tap
- Escalations (critical findings) are automatically flagged — `POST /escalation` sends an alert

---

### Step 6 — Offline Mode (30 seconds)

> *"And this all works in the field — even with no signal."*

**Action**:
1. Toggle phone to Airplane Mode
2. Submit another voice finding
3. Toggle Airplane Mode off
4. Show the sync badge and tap **Sync** — findings appear on backend

**Talking points**:
- All data written to local SQLite first via `expo-sqlite`
- `POST /sync` batch-replays offline queue when connectivity returns
- No data loss — technicians in mines or remote sites are fully covered

---

### Wrap-Up (30 seconds)

> *"In five minutes we've gone from a paper checklist to a fully AI-analyzed inspection report, with offline support, image vision, voice input, and smart glasses integration. This is CAT Inspect AI Co-Pilot."*

**Show** the architecture slide (from `docs/ARCHITECTURE.md`) if time permits.

---

## Key Talking Points Summary

| Theme | One-liner |
|---|---|
| **Problem** | Paper inspections are slow, error-prone, and miss critical safety issues |
| **AI Value** | GPT-4o Vision turns a photo into a structured, severity-ranked finding in seconds |
| **Offline First** | Works in GPS-dead zones, mines, and remote sites — no connectivity required |
| **Glasses Integration** | Hands-free inspection: look, speak, done — no phone needed |
| **Report Generation** | One tap produces a full PDF-ready report; no manual write-up |
| **Scalability** | REST API can be connected to Cat Central fleet management for fleet-wide insights |

---

## Fallback Plan if Services Are Down

If the backend or OpenAI API is unavailable during the demo:

### Option A — Offline Mode Demo
1. Keep the phone in Airplane Mode throughout
2. Show the full inspection flow using locally cached data and mock AI responses baked into the app
3. Explain: *"This is our offline mode — everything you see is running locally on the device"*
4. Re-enable connectivity and demonstrate the sync queue flushing

### Option B — Swagger UI Demo
1. Open `http://localhost:8000/docs` in the browser
2. Walk through the API endpoints directly:
   - `POST /inspection` → create session
   - `POST /findings` → submit a finding with a pre-prepared payload
   - `GET /report/{inspection_id}` → show the generated report JSON
3. Explain the mobile app is a UI layer on top of these APIs

### Option C — Static Screenshots
Keep a `demo-screenshots/` folder with:
- Asset list screen
- Active inspection with findings
- AI-enriched finding card (high severity)
- Completed report view

Present as a slide deck if the app itself cannot be shown live.

### Emergency Contacts
- Backend issues: check `backend/.env` for missing `OPENAI_API_KEY`
- Expo app not loading: run `npx expo start --tunnel` to bypass LAN issues
- Database empty: run `python backend/seed_data.py` to re-seed demo assets
