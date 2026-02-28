import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.supabase_client import get_client
from routers import machine, inspection, findings, report, escalation
from services import sync_queue

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s – %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  CAT Inspect AI Co-Pilot – Backend Starting Up")
    logger.info("=" * 60)
    supabase = get_client()
    if supabase:
        logger.info("✓ Supabase client initialised")
    else:
        logger.warning("⚠ Supabase client unavailable – running in offline/demo mode")
    yield
    logger.info("CAT Inspect AI Co-Pilot – Shutting down")


app = FastAPI(
    title="CAT Inspect AI Co-Pilot",
    description=(
        "AI-powered equipment inspection assistant for Caterpillar heavy machinery. "
        "Combines local LLM (LLaVA via Ollama), cloud AI (Amazon Bedrock — Claude 3.5 Sonnet), "
        "persistent memory (Supermemory), and offline-first sync (Supabase)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(machine.router, prefix="/machine", tags=["Machines"])
app.include_router(inspection.router, prefix="/inspection", tags=["Inspections"])
app.include_router(findings.router, prefix="/findings", tags=["Findings"])
app.include_router(report.router, prefix="/report", tags=["Reports"])
app.include_router(escalation.router, prefix="/escalation", tags=["Escalation"])


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    supabase_ok = get_client() is not None
    return {
        "status": "ok",
        "supabase_connected": supabase_ok,
        "offline_queue_size": sync_queue.get_queue_size(),
    }


@app.post("/sync", tags=["Sync"])
async def manual_sync():
    """Manually trigger a flush of the offline sync queue to Supabase."""
    supabase = get_client()
    synced = await sync_queue.flush_queue(supabase)
    remaining = sync_queue.get_queue_size()
    return {
        "synced": synced,
        "remaining_in_queue": remaining,
        "message": f"Flushed {synced} item(s); {remaining} item(s) remain in queue.",
    }
