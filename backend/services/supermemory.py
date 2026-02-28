import logging
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SUPERMEMORY_API_KEY = os.getenv("SUPERMEMORY_API_KEY", "")
SUPERMEMORY_BASE_URL = "https://api.supermemory.ai/v3"


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {SUPERMEMORY_API_KEY}",
        "Content-Type": "application/json",
    }


async def add_memory(content: str, tags: list[str]) -> dict:
    """Store an inspection finding in Supermemory."""
    if not SUPERMEMORY_API_KEY:
        logger.warning("SUPERMEMORY_API_KEY not set; skipping memory storage.")
        return {"status": "skipped", "reason": "no api key"}

    payload = {
        "content": content,
        "metadata": {tag: True for tag in tags},
        "tags": tags,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{SUPERMEMORY_BASE_URL}/memories",
                headers=_headers(),
                json=payload,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Supermemory add_memory HTTP error %s: %s", exc.response.status_code, exc)
        return {"status": "error", "code": exc.response.status_code}
    except Exception as exc:
        logger.error("Supermemory add_memory failed: %s", exc)
        return {"status": "error", "detail": str(exc)}


async def search_memory(query: str, tags: list[str] | None = None) -> list[dict]:
    """Retrieve relevant memories from Supermemory."""
    if not SUPERMEMORY_API_KEY:
        logger.warning("SUPERMEMORY_API_KEY not set; skipping memory search.")
        return []

    params: dict = {"q": query, "limit": 10}
    if tags:
        params["tags"] = ",".join(tags)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{SUPERMEMORY_BASE_URL}/memories/search",
                headers=_headers(),
                params=params,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", data) if isinstance(data, dict) else data
    except httpx.HTTPStatusError as exc:
        logger.error("Supermemory search HTTP error %s: %s", exc.response.status_code, exc)
        return []
    except Exception as exc:
        logger.error("Supermemory search_memory failed: %s", exc)
        return []


async def get_machine_history(asset_id: str) -> str:
    """Return a formatted string of past inspection findings for a machine."""
    results = await search_memory(
        query=f"inspection findings for asset {asset_id}",
        tags=[asset_id],
    )

    if not results:
        return ""

    lines: list[str] = [f"Previous inspection history for asset {asset_id}:"]
    for idx, item in enumerate(results[:5], start=1):
        content = item.get("content") or item.get("text") or str(item)
        lines.append(f"{idx}. {content}")

    return "\n".join(lines)
