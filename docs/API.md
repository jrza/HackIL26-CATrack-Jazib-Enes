# CAT Inspect AI Co-Pilot — API Reference

Base URL (local dev): `http://localhost:8000`

All request and response bodies are JSON unless otherwise noted.
Timestamps follow ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`).

---

## Table of Contents
1. [Health](#1-health)
2. [Sync](#2-sync)
3. [Machine / Asset](#3-machine--asset)
4. [Inspections](#4-inspections)
5. [Findings](#5-findings)
6. [Reports](#6-reports)
7. [Escalations](#7-escalations)

---

## 1. Health

### `GET /health`
Returns service liveness status. Use this to verify the backend is reachable before starting a demo or running tests.

**Response**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## 2. Sync

### `POST /sync`
Batch-upload offline-queued records from the mobile client. Used when connectivity is restored after an offline session.

**Request Body**
```json
{
  "inspections": [ /* array of inspection objects */ ],
  "findings":    [ /* array of finding objects */ ]
}
```

Each record must include a client-generated `id` (UUID v4) and an `updated_at` timestamp. The server applies last-writer-wins merge by `updated_at`.

**Response**
```json
{
  "synced_inspections": 2,
  "synced_findings": 7,
  "conflicts": []
}
```

| Field | Type | Description |
|---|---|---|
| `synced_inspections` | integer | Number of inspection records merged |
| `synced_findings` | integer | Number of finding records merged |
| `conflicts` | array | IDs of records that could not be merged |

---

## 3. Machine / Asset

### `GET /machine/{asset_id}`
Retrieve machine profile and inspection history for a given asset.

**Path Parameter**
| Parameter | Type | Description |
|---|---|---|
| `asset_id` | string | CAT asset serial or fleet ID (e.g. `CAT-001`) |

**Response**
```json
{
  "asset_id": "CAT-001",
  "model": "CAT 336 Excavator",
  "year": 2021,
  "hours": 4320,
  "last_inspection": "2025-06-10T08:30:00Z",
  "inspection_count": 14
}
```

**Example**
```bash
curl http://localhost:8000/machine/CAT-001
```

---

## 4. Inspections

### `POST /inspection`
Create a new inspection session for an asset.

**Request Body**
```json
{
  "asset_id": "CAT-001",
  "technician_id": "tech-42",   // optional
  "notes": "Pre-shift check"    // optional
}
```

**Response** — `201 Created`
```json
{
  "id": "insp-uuid-1234",
  "asset_id": "CAT-001",
  "status": "active",
  "started_at": "2025-06-11T09:00:00Z",
  "technician_id": "tech-42",
  "notes": "Pre-shift check"
}
```

---

### `GET /inspection`
List all inspections, optionally filtered by asset or status.

**Query Parameters**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `asset_id` | string | — | Filter by asset |
| `status` | string | — | `active`, `completed`, or `escalated` |
| `limit` | integer | 20 | Max results |
| `offset` | integer | 0 | Pagination offset |

**Response**
```json
{
  "items": [ /* array of inspection objects */ ],
  "total": 42
}
```

---

### `GET /inspection/{id}`
Retrieve a single inspection by ID, including all associated findings.

**Path Parameter**
| Parameter | Type | Description |
|---|---|---|
| `id` | string | Inspection UUID |

**Response**
```json
{
  "id": "insp-uuid-1234",
  "asset_id": "CAT-001",
  "status": "active",
  "started_at": "2025-06-11T09:00:00Z",
  "completed_at": null,
  "findings": [ /* array of finding objects */ ]
}
```

---

### `GET /inspection/active/{asset_id}`
Return the currently active (in-progress) inspection for an asset, if one exists.

**Path Parameter**
| Parameter | Type | Description |
|---|---|---|
| `asset_id` | string | CAT asset serial or fleet ID |

**Response** — `200` with inspection object, or `404` if no active inspection.

---

### `POST /inspection/{id}/complete`
Mark an inspection as completed and trigger report generation.

**Path Parameter**
| Parameter | Type | Description |
|---|---|---|
| `id` | string | Inspection UUID |

**Request Body** — optional
```json
{
  "notes": "All checks passed, minor hydraulic leak noted."
}
```

**Response**
```json
{
  "id": "insp-uuid-1234",
  "status": "completed",
  "completed_at": "2025-06-11T10:15:00Z",
  "report_id": "rpt-uuid-5678"
}
```

---

## 5. Findings

### `POST /findings`
Submit a new finding for an active inspection. The backend calls the AI engine to analyze the finding and enrich it with severity, confidence, and recommended action.

**Request Body**
```json
{
  "inspection_id": "insp-uuid-1234",
  "component": "Hydraulic System",
  "voice_transcript": "I notice a slow leak on the left boom cylinder",
  "image_url": "data:image/jpeg;base64,/9j/4AAQ..."  // optional data-URI or HTTPS URL
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `inspection_id` | string | ✅ | Parent inspection UUID |
| `component` | string | ✅ | Machine component being inspected |
| `voice_transcript` | string | ✗ | Voice description of the finding |
| `image_url` | string | ✗ | Data-URI or HTTPS URL of captured photo |

**Response** — `201 Created`
```json
{
  "id": "fnd-uuid-9999",
  "inspection_id": "insp-uuid-1234",
  "component": "Hydraulic System",
  "issue": "Hydraulic fluid leak at boom cylinder seal",
  "severity": "high",
  "confidence": 0.91,
  "recommended_action": "Replace left boom cylinder seal before next shift. Monitor fluid level.",
  "voice_transcript": "I notice a slow leak on the left boom cylinder",
  "image_url": "data:image/jpeg;base64,...",
  "created_at": "2025-06-11T09:45:00Z",
  "ai_status": "complete"
}
```

| Field | Type | Description |
|---|---|---|
| `severity` | string | `low` / `medium` / `high` / `critical` |
| `confidence` | float | AI confidence score 0.0–1.0 |
| `recommended_action` | string | AI-generated remediation advice |
| `ai_status` | string | `complete` / `pending` (if offline queue) |

---

### `GET /findings`
List findings, optionally filtered by inspection.

**Query Parameters**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `inspection_id` | string | — | Filter by parent inspection |
| `severity` | string | — | Filter by severity level |
| `limit` | integer | 50 | Max results |
| `offset` | integer | 0 | Pagination offset |

**Response**
```json
{
  "items": [ /* array of finding objects */ ],
  "total": 7
}
```

---

## 6. Reports

### `GET /report/{inspection_id}`
Generate (or retrieve cached) the inspection report for a completed inspection.

**Path Parameter**
| Parameter | Type | Description |
|---|---|---|
| `inspection_id` | string | Parent inspection UUID |

**Response**
```json
{
  "report_id": "rpt-uuid-5678",
  "inspection_id": "insp-uuid-1234",
  "asset_id": "CAT-001",
  "generated_at": "2025-06-11T10:15:30Z",
  "summary": "3 findings identified: 1 high, 1 medium, 1 low.",
  "findings": [ /* array of finding objects */ ],
  "overall_severity": "high",
  "pdf_url": "/report/rpt-uuid-5678/pdf"
}
```

---

### `GET /report/{report_id}`
Retrieve a previously generated report by its report ID.

**Path Parameter**
| Parameter | Type | Description |
|---|---|---|
| `report_id` | string | Report UUID (returned by `/inspection/{id}/complete`) |

**Response** — same schema as `GET /report/{inspection_id}`.

---

## 7. Escalations

### `POST /escalation`
Manually create an escalation for a finding or inspection that requires immediate supervisor attention.

**Request Body**
```json
{
  "inspection_id": "insp-uuid-1234",
  "finding_id": "fnd-uuid-9999",    // optional — escalate specific finding
  "reason": "Critical hydraulic failure detected, machine must be grounded immediately.",
  "contact": "supervisor@caterpillar.com"  // optional override
}
```

**Response** — `201 Created`
```json
{
  "id": "esc-uuid-0001",
  "inspection_id": "insp-uuid-1234",
  "finding_id": "fnd-uuid-9999",
  "reason": "Critical hydraulic failure detected, machine must be grounded immediately.",
  "status": "sent",
  "created_at": "2025-06-11T09:46:00Z"
}
```

---

### `GET /escalation`
List all escalations, optionally filtered by inspection.

**Query Parameters**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `inspection_id` | string | — | Filter by parent inspection |
| `status` | string | — | `sent`, `acknowledged`, `resolved` |

**Response**
```json
{
  "items": [ /* array of escalation objects */ ],
  "total": 1
}
```

---

## Error Responses

All endpoints return standard error envelopes on failure:

```json
{
  "detail": "Inspection not found"
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid field |
| `404` | Resource not found |
| `413` | Payload too large (image upload) |
| `422` | Validation error (FastAPI) |
| `500` | Internal server error |
