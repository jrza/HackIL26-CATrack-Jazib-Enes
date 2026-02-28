import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db.supabase_client import get_client
from models.inspection import InspectionCreate, InspectionSession, InspectionStatus, InspectionUpdate

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory store for demo/offline mode
_sessions: dict[str, dict] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/", response_model=InspectionSession, status_code=201)
async def start_inspection(body: InspectionCreate):
    """Start a new inspection session."""
    session_id = str(uuid.uuid4())
    session_data = {
        "id": session_id,
        "asset_id": body.asset_id,
        "operator_id": body.operator_id,
        "status": InspectionStatus.ACTIVE,
        "started_at": _now_iso(),
        "completed_at": None,
        "template_id": None,
    }

    _sessions[session_id] = session_data

    supabase = get_client()
    if supabase:
        try:
            supabase.table("inspection_sessions").insert(
                {**session_data, "status": InspectionStatus.ACTIVE.value}
            ).execute()
        except Exception as exc:
            logger.warning("Could not persist session to Supabase (offline): %s", exc)

    return InspectionSession(**session_data)


@router.get("/{inspection_id}", response_model=InspectionSession)
async def get_inspection(inspection_id: str):
    """Get inspection session by ID."""
    if inspection_id in _sessions:
        return InspectionSession(**_sessions[inspection_id])

    supabase = get_client()
    if supabase:
        try:
            result = (
                supabase.table("inspection_sessions")
                .select("*")
                .eq("id", inspection_id)
                .execute()
            )
            if result.data:
                session = result.data[0]
                _sessions[inspection_id] = session
                return InspectionSession(**session)
        except Exception as exc:
            logger.error("Supabase query error: %s", exc)

    raise HTTPException(status_code=404, detail=f"Inspection '{inspection_id}' not found.")


@router.get("/active/{asset_id}", response_model=InspectionSession)
async def get_active_inspection(asset_id: str):
    """Get the active inspection session for an asset."""
    for session in _sessions.values():
        if session["asset_id"] == asset_id and session["status"] == InspectionStatus.ACTIVE:
            return InspectionSession(**session)

    supabase = get_client()
    if supabase:
        try:
            result = (
                supabase.table("inspection_sessions")
                .select("*")
                .eq("asset_id", asset_id)
                .eq("status", InspectionStatus.ACTIVE.value)
                .order("started_at", desc=True)
                .limit(1)
                .execute()
            )
            if result.data:
                session = result.data[0]
                _sessions[session["id"]] = session
                return InspectionSession(**session)
        except Exception as exc:
            logger.error("Supabase query error: %s", exc)

    raise HTTPException(
        status_code=404, detail=f"No active inspection found for asset '{asset_id}'."
    )


@router.patch("/{inspection_id}", response_model=InspectionSession)
async def update_inspection(inspection_id: str, body: InspectionUpdate):
    """Update inspection status or metadata."""
    session = _sessions.get(inspection_id)
    if not session:
        supabase = get_client()
        if supabase:
            try:
                result = (
                    supabase.table("inspection_sessions")
                    .select("*")
                    .eq("id", inspection_id)
                    .execute()
                )
                if result.data:
                    session = result.data[0]
                    _sessions[inspection_id] = session
            except Exception as exc:
                logger.error("Supabase query error: %s", exc)

    if not session:
        raise HTTPException(status_code=404, detail=f"Inspection '{inspection_id}' not found.")

    updates = body.model_dump(exclude_none=True)
    if "status" in updates and isinstance(updates["status"], InspectionStatus):
        updates["status"] = updates["status"].value
    if "completed_at" in updates and isinstance(updates["completed_at"], datetime):
        updates["completed_at"] = updates["completed_at"].isoformat()

    session.update(updates)
    _sessions[inspection_id] = session

    supabase = get_client()
    if supabase:
        try:
            supabase.table("inspection_sessions").update(updates).eq("id", inspection_id).execute()
        except Exception as exc:
            logger.warning("Could not update Supabase record: %s", exc)

    return InspectionSession(**session)


@router.post("/{inspection_id}/complete", response_model=InspectionSession)
async def complete_inspection(inspection_id: str):
    """Mark an inspection as completed."""
    update = InspectionUpdate(
        status=InspectionStatus.COMPLETED,
        completed_at=datetime.now(timezone.utc),
    )
    return await update_inspection(inspection_id, update)
