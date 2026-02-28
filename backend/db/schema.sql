-- CAT Inspect AI Co-Pilot – PostgreSQL Schema

CREATE TABLE IF NOT EXISTS machines (
    asset_id               TEXT PRIMARY KEY,
    name                   TEXT NOT NULL,
    machine_type           TEXT NOT NULL,
    serial_number          TEXT,
    model_number           TEXT,
    last_inspection_date   TIMESTAMPTZ,
    inspection_template_id TEXT,
    location               TEXT
);

CREATE TABLE IF NOT EXISTS inspection_sessions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id     TEXT        NOT NULL REFERENCES machines(asset_id) ON DELETE CASCADE,
    operator_id  TEXT,
    status       TEXT        NOT NULL DEFAULT 'ACTIVE',
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    template_id  TEXT
);

CREATE INDEX IF NOT EXISTS idx_inspection_sessions_asset_id ON inspection_sessions(asset_id);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_status   ON inspection_sessions(status);

CREATE TABLE IF NOT EXISTS findings (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id      UUID        NOT NULL REFERENCES inspection_sessions(id) ON DELETE CASCADE,
    component          TEXT        NOT NULL,
    issue              TEXT        NOT NULL,
    description        TEXT        NOT NULL,
    severity           TEXT        NOT NULL,
    confidence         NUMERIC(4,3) NOT NULL DEFAULT 0.0,
    recommended_action TEXT        NOT NULL,
    operational_impact TEXT        NOT NULL,
    timestamp          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    image_url          TEXT,
    voice_transcript   TEXT
);

CREATE INDEX IF NOT EXISTS idx_findings_inspection_id ON findings(inspection_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity       ON findings(severity);

CREATE TABLE IF NOT EXISTS reports (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID        NOT NULL REFERENCES inspection_sessions(id) ON DELETE CASCADE,
    asset_id      TEXT        NOT NULL,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status        TEXT        NOT NULL DEFAULT 'DRAFT',
    summary       TEXT,
    pdf_url       TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_inspection_id ON reports(inspection_id);
