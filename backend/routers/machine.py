import logging

from fastapi import APIRouter, HTTPException

from db.supabase_client import get_client
from models.machine import Machine, MachineType, InspectionTemplate

router = APIRouter()
logger = logging.getLogger(__name__)

MOCK_TEMPLATES: dict[str, InspectionTemplate] = {
    "tmpl_excavator": InspectionTemplate(
        id="tmpl_excavator",
        name="CAT Excavator Standard Inspection",
        checkpoints=[
            "Engine Oil Level",
            "Coolant Level",
            "Hydraulic Fluid Level",
            "Boom Cylinder Seals",
            "Stick Cylinder Seals",
            "Bucket Cylinder Seals",
            "Hydraulic Hoses",
            "Undercarriage – Left Track Tension",
            "Undercarriage – Right Track Tension",
            "Sprocket Wear",
            "Track Rollers",
            "Front Idler",
            "Rear Idler",
            "Track Pads",
            "Swing Bearing",
            "Cab Glass",
            "Lights & Signals",
            "ROPS/FOPS Structure",
            "Bucket Teeth & Adapters",
            "Quick Coupler",
        ],
    ),
    "tmpl_wheel_loader": InspectionTemplate(
        id="tmpl_wheel_loader",
        name="CAT Wheel Loader Standard Inspection",
        checkpoints=[
            "Engine Oil Level",
            "Coolant Level",
            "Hydraulic Fluid Level",
            "Transmission Fluid Level",
            "Front Tires – Tread & Pressure",
            "Rear Tires – Tread & Pressure",
            "Rim Condition – All Wheels",
            "Lug Nuts – All Wheels",
            "Lift Cylinder Seals",
            "Tilt Cylinder Seals",
            "Hydraulic Hoses",
            "Articulation Joint",
            "Bucket Cutting Edge",
            "Bucket Teeth & Adapters",
            "Cab Glass",
            "Lights & Signals",
            "Braking System",
            "Steering System",
            "ROPS Structure",
        ],
    ),
}

MOCK_MACHINES: dict[str, dict] = {
    "CAT-320-001": {
        "asset_id": "CAT-320-001",
        "name": "CAT 320 Excavator",
        "machine_type": MachineType.EXCAVATOR,
        "serial_number": "CAT0320EXCA001",
        "model_number": "320",
        "last_inspection_date": None,
        "inspection_template_id": "tmpl_excavator",
        "location": "Site A – North Pit",
    },
    "CAT-950-001": {
        "asset_id": "CAT-950-001",
        "name": "CAT 950 Wheel Loader",
        "machine_type": MachineType.WHEEL_LOADER,
        "serial_number": "CAT0950WLDR001",
        "model_number": "950",
        "last_inspection_date": None,
        "inspection_template_id": "tmpl_wheel_loader",
        "location": "Site B – Loading Dock",
    },
}


@router.get("/{asset_id}")
async def get_machine(asset_id: str):
    """Return machine profile and inspection template."""
    supabase = get_client()

    if supabase:
        try:
            result = supabase.table("machines").select("*").eq("asset_id", asset_id).execute()
            if result.data:
                machine_data = result.data[0]
                template_id = machine_data.get("inspection_template_id")
                template = None
                if template_id:
                    tmpl_result = (
                        supabase.table("inspection_templates")
                        .select("*")
                        .eq("id", template_id)
                        .execute()
                    )
                    if tmpl_result.data:
                        template = InspectionTemplate(**tmpl_result.data[0])
                    else:
                        template = MOCK_TEMPLATES.get(template_id)
                return {
                    "machine": Machine(**machine_data),
                    "template": template,
                }
        except Exception as exc:
            logger.warning("Supabase query failed, falling back to mock data: %s", exc)

    if asset_id in MOCK_MACHINES:
        machine_data = MOCK_MACHINES[asset_id]
        template_id = machine_data.get("inspection_template_id")
        template = MOCK_TEMPLATES.get(template_id) if template_id else None
        return {
            "machine": Machine(**machine_data),
            "template": template,
        }

    raise HTTPException(status_code=404, detail=f"Machine '{asset_id}' not found.")


@router.get("/")
async def list_machines():
    """Return all available machines (mock + Supabase)."""
    supabase = get_client()

    if supabase:
        try:
            result = supabase.table("machines").select("*").execute()
            if result.data:
                return {"machines": [Machine(**m) for m in result.data]}
        except Exception as exc:
            logger.warning("Supabase query failed, falling back to mock data: %s", exc)

    return {"machines": [Machine(**m) for m in MOCK_MACHINES.values()]}
