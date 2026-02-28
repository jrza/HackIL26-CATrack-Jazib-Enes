GitHub Copilot Instructions — CAT Inspect AI Co-Pilot
Project Overview
This is a multimodal AI inspection co-pilot that bridges CAT Inspect and CAT AI Assistant. It enables any operator to perform expert-level equipment inspections using voice + image input via Meta glasses, a local LLM for offline-first processing, and cloud escalation for severe findings. All inspection history is persisted via Supermemory for machine-specific pattern recognition over time.
Repo Structure
/
├── backend/                        # Python FastAPI — owned by [YOUR NAME]
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example                # Environment variable template (never commit .env)
│   │
│   ├── routers/                    # API route handlers
│   │   ├── inspection.py           # Start/end inspection, get active session
│   │   ├── findings.py             # Submit finding (voice + image), get findings
│   │   ├── report.py               # Generate CAT Inspect formatted report
│   │   ├── machine.py              # QR scan → asset ID → inspection profile lookup
│   │   └── escalation.py          # Moderate/severe finding → CAT AI offsite
│   │
│   ├── services/                   # Business logic layer
│   │   ├── local_llm.py            # Ollama/LLaVA integration — vision + classification
│   │   ├── supermemory.py          # Supermemory read/write — machine history context
│   │   ├── bedrock.py         # Cloud escalation — AWS bedrock Anthropic integration
│   │   ├── report_generator.py     # CAT Inspect JSON/PDF report builder
│   │   └── sync_queue.py           # Offline sync queue — push to Supabase on reconnect
│   │
│   ├── models/                     # Pydantic data models
│   │   ├── inspection.py           # Inspection session schema
│   │   ├── finding.py              # Finding schema (component, severity, image, voice)
│   │   ├── machine.py              # Machine/asset schema
│   │   └── report.py               # Report output schema
│   │
│   ├── db/                         # Database layer
│   │   ├── supabase_client.py      # Supabase connection
│   │   └── schema.sql              # Postgres table definitions
│   │
│   └── prompts/                    # CAT-provided prompt templates
│       ├── baseline.py             # System prompt — certified inspector persona
│       ├── subsection/             # Per-component detection prompts
│       │   ├── tires_rims.py
│       │   ├── hydraulics.py
│       │   └── undercarriage.py
│       └── output_schema.py        # Structured JSON output format
│
├── frontend/                       # Expo React Native — owned by TEAMMATE
│   ├── app/                        # Expo Router pages
│   │   ├── index.tsx               # Entry — scan QR to start
│   │   ├── inspection/
│   │   │   ├── [id].tsx            # Active inspection flow
│   │   │   ├── checkpoint.tsx      # Single checkpoint — voice + image capture
│   │   │   └── complete.tsx        # Review + submit report
│   │   └── report/
│   │       └── [id].tsx            # View generated report
│   │
│   ├── components/
│   │   ├── QRScanner.tsx           # Asset ID scan → trigger inspection load
│   │   ├── VoiceInput.tsx          # Record voice, transcribe, send to backend
│   │   ├── ImageCapture.tsx        # Deliberate image capture + timestamp
│   │   ├── FindingCard.tsx         # Display single finding with severity color
│   │   ├── ProgressTracker.tsx     # Completeness — checked vs outstanding
│   │   └── ReportView.tsx          # Structured report display
│   │
│   ├── hooks/
│   │   ├── useInspection.ts        # Inspection session state
│   │   ├── useVoice.ts             # Voice recording + transcription
│   │   └── useSync.ts              # Offline sync state
│   │
│   ├── services/
│   │   ├── api.ts                  # Backend API client
│   │   └── storage.ts              # Local AsyncStorage for offline queue
│   │
│   └── constants/
│       └── severity.ts             # PASS/MONITOR/FAIL color + label constants
│
├── glasses/                        # Meta glasses integration — owned by TEAMMATE
│   ├── README.md                   # Setup instructions for Meta Companion App
│   ├── voice_handler.py            # Voice command receiver → forwards to backend
│   └── image_handler.py            # Image capture receiver → forwards to backend
│
├── docs/
│   ├── ARCHITECTURE.md             # System architecture + data flow diagram
│   ├── API.md                      # Backend endpoint documentation
│   └── DEMO_SCRIPT.md              # Hackathon demo walkthrough
│
├── .github/
│   └── CODEOWNERS                  # backend/* = @yourhandle, frontend/* = @teammate
│
├── .gitignore
└── README.md                       # Project overview + setup instructions

Ownership Split
backend/ → your name
frontend/ → teammate
glasses/ → teammate
docs/ → both contribute
Environment Variables Needed (backend/.env)
SUPABASE_URL=
SUPABASE_KEY=
SUPERMEMORY_API_KEY=
AWS_ACCESS_KEY_ID= 
AWS_SECRET_ACCESS_KEY= 
AWS_REGION=us-east-2
OLLAMA_BASE_URL=http://localhost:11434

Key Data Flow (for Copilot context)
QR scan → GET /machine/{asset_id} → returns machine profile + loads inspection template
Supermemory query → pulls this machine's inspection history → injected into local LLM context
Inspector voice + image → POST /findings → local LLM classifies → returns structured finding JSON
If severity MODERATE/CRITICAL → POST /escalation → AWS Bedrock Haiku with Supermemory context
Inspection complete → POST /report → generates CAT Inspect formatted report
All findings sync to Supabase + Supermemory for future inspections
Finding Severity Levels
PASS → green, logged locally
MONITOR → yellow, logged + flagged for next inspection
FAIL/MODERATE → orange, escalate to cloud
CRITICAL → red, escalate to cloud + flag for immediate human review
Output Schema (per CAT team prompt structure)
Every finding must return:
{
  "component": "",
  "issue": "",
  "description": "",
  "severity": "PASS | MONITOR | MODERATE | CRITICAL",
  "confidence": 0.0,
  "recommended_action": "",
  "operational_impact": "",
  "timestamp": "",
  "image_url": ""
}

Rules for Copilot
Never commit .env files
All backend responses must match the finding schema above
Severity thresholds: confidence > 0.9 = high (local only), 0.7-0.89 = medium (escalate), < 0.7 = flag for human
Prompts in /prompts/ are sourced from CAT team — do not modify baseline persona
Offline-first: every finding writes to local queue first, syncs to Supabase second

