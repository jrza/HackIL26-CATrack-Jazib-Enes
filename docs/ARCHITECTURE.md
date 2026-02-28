# CAT Inspect AI Co-Pilot — System Architecture

## Overview

CAT Inspect AI Co-Pilot is a field inspection tool that combines a React Native mobile frontend, a FastAPI backend with AI-powered analysis, and optional Meta Ray-Ban smart glasses integration. Technicians conduct walk-around inspections of heavy equipment (excavators, wheel loaders, motor graders, etc.), log findings via voice or camera, and receive real-time AI-generated severity assessments and escalation alerts.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAT Inspect AI Co-Pilot                             │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────┐        ┌──────────────────────────────────────────────┐
  │  Meta Ray-Ban     │        │               Mobile App (Expo)              │
  │  Smart Glasses    │        │                React Native + TypeScript     │
  │                   │        │                                              │
  │  ┌─────────────┐  │        │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
  │  │ Voice       │  │        │  │ Asset    │  │Inspection│  │ Report   │  │
  │  │ Transcript  │  │        │  │ List     │  │ Flow     │  │ Viewer   │  │
  │  └──────┬──────┘  │        │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
  │         │         │        │       │              │              │        │
  │  ┌──────▼──────┐  │        └───────┼──────────────┼──────────────┼────────┘
  │  │ Photo       │  │                │              │              │
  │  │ Capture     │  │                │   REST API / Local SQLite   │
  └──┼─────────────┼──┘                │              │              │
     │             │           ┌───────▼──────────────▼──────────────▼────────┐
     │  Webhook    │           │              FastAPI Backend                  │
     │  (HTTP POST)│           │                 Python 3.11+                 │
     │             │           │                                               │
  ┌──▼─────────────▼──┐        │  ┌────────────┐  ┌────────────┐             │
  │  Glasses Handlers  │        │  │  /inspection│  │ /findings  │             │
  │  voice_handler.py  │──────▶│  │  /machine  │  │ /report    │             │
  │  image_handler.py  │        │  │  /sync     │  │ /escalation│             │
  └────────────────────┘        │  └─────┬──────┘  └─────┬──────┘             │
                                │        │                │                    │
                                │  ┌─────▼────────────────▼──────┐            │
                                │  │        AI Engine             │            │
                                │  │  OpenAI GPT-4o Vision API    │            │
                                │  │  (image + text analysis)     │            │
                                │  └─────────────────────────────┘            │
                                │                                               │
                                │  ┌───────────────────────────────┐           │
                                │  │   SQLite (local persistence)  │           │
                                │  │   findings / inspections /    │           │
                                │  │   assets / reports            │           │
                                │  └───────────────────────────────┘           │
                                └───────────────────────────────────────────────┘
                                                    │
                                     ┌──────────────▼──────────────┐
                                     │     External Services        │
                                     │  • OpenAI API (GPT-4o)      │
                                     │  • Cat Central (optional)   │
                                     │  • Email/SMS escalation     │
                                     └─────────────────────────────┘
```

---

## Component Descriptions

### Frontend (`frontend/`)
- **Framework**: React Native with Expo (TypeScript)
- **Role**: Primary interface for field technicians. Guides the technician through inspection checklists, captures photos and voice findings, and displays AI analysis results and reports.
- **Key screens**: Asset List → New/Active Inspection → Checkpoint Detail → Finding Entry → Report View
- **Offline support**: Queues findings locally in SQLite via `expo-sqlite` and syncs when connectivity is restored using the `/sync` endpoint.

### Backend (`backend/`)
- **Framework**: FastAPI (Python 3.11+)
- **Role**: Orchestrates inspection data, calls the AI engine, persists findings, and generates PDF/JSON reports.
- **Database**: SQLite via `aiosqlite` / SQLAlchemy for lightweight field deployment with no external DB dependency.
- **AI integration**: Calls OpenAI GPT-4o Vision API to analyze images and voice transcripts, returning structured findings with issue description, severity (low / medium / high / critical), confidence score, and recommended action.

### Glasses (`glasses/`)
- **Language**: Python 3.11+
- **Role**: Thin webhook bridge between Meta Ray-Ban smart glasses (via the Meta View companion app) and the FastAPI backend.
- **`voice_handler.py`**: Receives voice transcript webhooks, parses commands, and calls backend REST endpoints.
- **`image_handler.py`**: Receives photo webhooks, validates and re-encodes images as data-URIs, and submits them to `/findings`.

### External Services
| Service | Purpose |
|---|---|
| OpenAI GPT-4o | Image and text analysis for AI findings |
| Meta View App | Companion app for glasses voice/photo relay |
| Cat Central (future) | Fleet management system integration |
| Email / SMS (future) | Escalation notification delivery |

---

## Offline-First Strategy

Field technicians often work in GPS-dead zones, underground mines, or remote sites with no cellular connectivity. The system is designed so that **all core inspection workflows function fully offline**:

1. **Local persistence**: The mobile app writes all findings, checkpoints, and inspection state directly to an on-device SQLite database (via `expo-sqlite`) before attempting any network call.
2. **Optimistic UI**: The app displays findings immediately from local state; network sync is a background operation.
3. **Sync queue**: Any mutations made while offline are queued and replayed via `POST /sync` when connectivity is detected.
4. **Backend sync endpoint**: `POST /sync` accepts a batch of offline-created records and merges them with the server database using client-provided timestamps and UUIDs.
5. **Conflict resolution**: Last-writer-wins by `updated_at` timestamp; client UUID de-duplicates records on re-sync.
6. **AI deferred**: AI analysis (OpenAI calls) that requires network access is queued server-side and applied to the finding once connectivity is restored; the finding is stored with `ai_status: "pending"` until then.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile frontend | React Native + Expo | SDK 51+ |
| Frontend language | TypeScript | 5.x |
| Local DB (mobile) | expo-sqlite | 14.x |
| Backend framework | FastAPI | 0.111+ |
| Backend language | Python | 3.11+ |
| Backend DB | SQLite via aiosqlite | 3.x |
| AI / Vision | OpenAI GPT-4o | API v1 |
| HTTP client (Python) | httpx | 0.27+ |
| Glasses bridge | Python stdlib + httpx | 3.11+ |
| Containerization | Docker / docker-compose | 24+ |
| CI/CD | GitHub Actions | — |
