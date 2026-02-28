import logging

from fastapi import APIRouter, HTTPException

from db.supabase_client import get_client
from routers.findings import _findings as in_memory_findings
from services import report_generator
from routers.machine import MOCK_MACHINES

router = APIRouter()
logger = logging.getLogger(__name__)

_reports: dict[str, dict] = {}


@router.post("/{inspection_id}", status_code=201)
async def generate_report(inspection_id: str):
    """Generate a report for a completed inspection."""
    findings = list(in_memory_findings.get(inspection_id, []))

    supabase = get_client()
    if supabase:
        try:
            findings_result = (
                supabase.table("findings")
                .select("*")
                .eq("inspection_id", inspection_id)
                .execute()
            )
            if findings_result.data:
                in_memory_ids = {f["id"] for f in findings}
                for row in findings_result.data:
                    if row["id"] not in in_memory_ids:
                        findings.append(row)
        except Exception as exc:
            logger.warning("Supabase findings query failed: %s", exc)

    asset_id: str = "unknown"
    machine: dict = {}
    if supabase:
        try:
            session_result = (
                supabase.table("inspections")
                .select("asset_id")
                .eq("id", inspection_id)
                .execute()
            )
            if session_result.data:
                asset_id = session_result.data[0]["asset_id"]
                machine_result = (
                    supabase.table("machines").select("*").eq("asset_id", asset_id).execute()
                )
                if machine_result.data:
                    machine = machine_result.data[0]
        except Exception as exc:
            logger.warning("Supabase machine lookup failed: %s", exc)

    if not machine:
        machine = MOCK_MACHINES.get(asset_id) or next(iter(MOCK_MACHINES.values()), {"asset_id": "unknown", "name": "Unknown Machine"})

    report = await report_generator.generate_report(
        inspection_id=inspection_id,
        findings=findings,
        machine=machine,
    )

    _reports[report["id"]] = report

    if supabase:
        try:
            supabase.table("reports").insert(
                {
                    "id": report["id"],
                    "inspection_id": report["inspection_id"],
                    "asset_id": report["asset_id"],
                    "generated_at": report["generated_at"],
                    "status": report["status"],
                    "summary": report["summary"],
                    "pdf_url": report.get("pdf_url"),
                }
            ).execute()
        except Exception as exc:
            logger.warning("Could not persist report to Supabase: %s", exc)

    return report


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get a generated report by ID."""
    if report_id in _reports:
        return _reports[report_id]

    supabase = get_client()
    if supabase:
        try:
            result = (
                supabase.table("reports").select("*").eq("id", report_id).execute()
            )
            if result.data:
                report_data = result.data[0]
                findings_result = (
                    supabase.table("findings")
                    .select("*")
                    .eq("inspection_id", report_data["inspection_id"])
                    .execute()
                )
                report_data["findings"] = findings_result.data if findings_result.data else []
                report_data.setdefault("critical_count", 0)
                report_data.setdefault("moderate_count", 0)
                report_data.setdefault("monitor_count", 0)
                report_data.setdefault("pass_count", 0)
                _reports[report_id] = report_data
                return report_data
        except Exception as exc:
            logger.error("Supabase report query failed: %s", exc)

    raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
