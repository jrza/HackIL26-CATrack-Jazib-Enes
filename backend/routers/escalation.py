import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import bedrock, supermemory
from routers.findings import _findings as in_memory_findings

router = APIRouter()
logger = logging.getLogger(__name__)

_escalations: dict[str, dict] = {}


class EscalationRequest(BaseModel):
    finding_id: str
    inspection_id: str


@router.post("/", status_code=201)
async def escalate_finding(body: EscalationRequest):
    """Escalate a finding to cloud AI for expert analysis."""
    findings = in_memory_findings.get(body.inspection_id, [])
    finding_data = next((f for f in findings if f["id"] == body.finding_id), None)

    if not finding_data:
        from db.supabase_client import get_client

        supabase = get_client()
        if supabase:
            try:
                result = (
                    supabase.table("findings")
                    .select("*")
                    .eq("id", body.finding_id)
                    .execute()
                )
                if result.data:
                    finding_data = result.data[0]
            except Exception as exc:
                logger.error("Supabase finding lookup failed: %s", exc)

    if not finding_data:
        raise HTTPException(
            status_code=404,
            detail=f"Finding '{body.finding_id}' not found in inspection '{body.inspection_id}'.",
        )

    # Resolve the asset_id for accurate machine history lookup.
    asset_id: str = body.inspection_id  # fallback
    from db.supabase_client import get_client as _get_client

    supabase = _get_client()
    if supabase:
        try:
            session_result = (
                supabase.table("inspections")
                .select("asset_id")
                .eq("id", body.inspection_id)
                .execute()
            )
            if session_result.data:
                asset_id = session_result.data[0]["asset_id"]
        except Exception as exc:
            logger.warning("Could not resolve asset_id for inspection %s: %s", body.inspection_id, exc)

    machine_history = await supermemory.get_machine_history(asset_id)

    escalation_result = await bedrock.escalate_finding(finding_data, machine_history)
    escalation_result["finding_id"] = body.finding_id
    escalation_result["inspection_id"] = body.inspection_id
    escalation_result.setdefault("escalation_timestamp", datetime.now(timezone.utc).isoformat())

    _escalations[body.finding_id] = escalation_result

    await supermemory.add_memory(
        content=(
            f"Escalation result for finding {body.finding_id}: "
            f"validated_severity={escalation_result.get('validated_severity')}, "
            f"root_cause={escalation_result.get('root_cause_analysis', '')[:200]}"
        ),
        tags=[body.inspection_id, "escalation"],
    )

    return escalation_result


@router.get("/{finding_id}")
async def get_escalation(finding_id: str):
    """Get the escalation result for a specific finding."""
    if finding_id in _escalations:
        return _escalations[finding_id]

    raise HTTPException(
        status_code=404,
        detail=f"No escalation result found for finding '{finding_id}'.",
    )
