import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException

from db.supabase_client import get_client
from models.finding import FindingCreate, FindingResponse, Severity
from services import local_llm, supermemory, azure_openai, sync_queue

router = APIRouter()
logger = logging.getLogger(__name__)

_findings: dict[str, list[dict]] = {}


async def _escalate_in_background(finding_data: dict, asset_id: str) -> None:
    machine_history = await supermemory.get_machine_history(asset_id)
    result = await azure_openai.escalate_finding(finding_data, machine_history)
    logger.info(
        "Escalation complete for finding %s: validated_severity=%s",
        finding_data.get("id"),
        result.get("validated_severity"),
    )


@router.post("/", response_model=FindingResponse, status_code=201)
async def submit_finding(body: FindingCreate, background_tasks: BackgroundTasks):
    """Submit a new finding; classify with local LLM and queue for persistence."""
    # Resolve asset_id for machine history lookup from the inspection session.
    asset_id: str = body.inspection_id  # fallback if session lookup fails
    supabase = get_client()
    if supabase:
        try:
            session_result = (
                supabase.table("inspection_sessions")
                .select("asset_id")
                .eq("id", body.inspection_id)
                .execute()
            )
            if session_result.data:
                asset_id = session_result.data[0]["asset_id"]
        except Exception as exc:
            logger.warning("Could not resolve asset_id for inspection %s: %s", body.inspection_id, exc)

    machine_history = await supermemory.get_machine_history(asset_id)

    llm_result = await local_llm.classify_finding(
        voice_transcript=body.voice_transcript or "",
        image_url=body.image_url,
        component=body.component,
        machine_history=machine_history,
    )

    finding_id = str(uuid.uuid4())
    timestamp = llm_result.get("timestamp") or datetime.now(timezone.utc).isoformat()

    finding_data = {
        "id": finding_id,
        "inspection_id": body.inspection_id,
        "component": llm_result.get("component", body.component),
        "issue": llm_result.get("issue", "Unknown Issue"),
        "description": llm_result.get("description", ""),
        "severity": llm_result.get("severity", Severity.MONITOR.value),
        "confidence": float(llm_result.get("confidence", 0.5)),
        "recommended_action": llm_result.get("recommended_action", ""),
        "operational_impact": llm_result.get("operational_impact", ""),
        "timestamp": timestamp,
        "image_url": llm_result.get("image_url") or body.image_url,
        "voice_transcript": body.voice_transcript,
    }

    queued_item = {**finding_data, "_table": "findings"}
    sync_queue.enqueue(queued_item)

    if supabase:
        try:
            await _flush_single(supabase, finding_data)
        except Exception as exc:
            logger.warning("Supabase insert failed; item stays in queue: %s", exc)

    _findings.setdefault(body.inspection_id, []).append(finding_data)

    await supermemory.add_memory(
        content=(
            f"Asset inspection finding – component: {finding_data['component']}, "
            f"issue: {finding_data['issue']}, severity: {finding_data['severity']}, "
            f"description: {finding_data['description']}"
        ),
        tags=[asset_id, finding_data.get("component", "").lower()],
    )

    severity_val = finding_data["severity"]
    if severity_val in (Severity.MODERATE.value, Severity.CRITICAL.value):
        background_tasks.add_task(_escalate_in_background, finding_data, asset_id)

    return FindingResponse(**finding_data)


async def _flush_single(supabase_client, finding_data: dict) -> None:
    payload = {k: v for k, v in finding_data.items() if k != "_table"}
    supabase_client.table("findings").insert(payload).execute()


@router.get("/{inspection_id}", response_model=list[FindingResponse])
async def get_findings(inspection_id: str):
    """Get all findings for an inspection."""
    results: list[dict] = list(_findings.get(inspection_id, []))

    supabase = get_client()
    if supabase:
        try:
            db_result = (
                supabase.table("findings")
                .select("*")
                .eq("inspection_id", inspection_id)
                .execute()
            )
            if db_result.data:
                in_memory_ids = {f["id"] for f in results}
                for row in db_result.data:
                    if row["id"] not in in_memory_ids:
                        results.append(row)
        except Exception as exc:
            logger.warning("Supabase query failed; using in-memory data: %s", exc)

    return [FindingResponse(**f) for f in results]
