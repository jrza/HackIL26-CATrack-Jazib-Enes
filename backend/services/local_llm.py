import ipaddress
import json
import logging
import os
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

from prompts.baseline import BASELINE_SYSTEM_PROMPT
from prompts.output_schema import OUTPUT_SCHEMA_PROMPT
from prompts.subsection.tires_rims import TIRES_RIMS_PROMPT
from prompts.subsection.hydraulics import HYDRAULICS_PROMPT
from prompts.subsection.undercarriage import UNDERCARRIAGE_PROMPT

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = "llava"

COMPONENT_PROMPTS: dict[str, str] = {
    "tires": TIRES_RIMS_PROMPT,
    "rims": TIRES_RIMS_PROMPT,
    "wheels": TIRES_RIMS_PROMPT,
    "hydraulics": HYDRAULICS_PROMPT,
    "hydraulic": HYDRAULICS_PROMPT,
    "cylinder": HYDRAULICS_PROMPT,
    "hose": HYDRAULICS_PROMPT,
    "undercarriage": UNDERCARRIAGE_PROMPT,
    "track": UNDERCARRIAGE_PROMPT,
    "sprocket": UNDERCARRIAGE_PROMPT,
    "roller": UNDERCARRIAGE_PROMPT,
    "idler": UNDERCARRIAGE_PROMPT,
}


def _is_safe_url(url: str) -> bool:
    """Return True only for http/https URLs pointing to non-private, non-loopback hosts."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname or ""
        if not hostname:
            return False
        # Block loopback and link-local names
        if hostname in ("localhost",) or hostname.endswith(".local"):
            return False
        try:
            addr = ipaddress.ip_address(hostname)
            if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved:
                return False
        except ValueError:
            pass  # hostname is a domain name – allow it
        return True
    except Exception:
        return False



    component_lower = component.lower()
    for keyword, prompt in COMPONENT_PROMPTS.items():
        if keyword in component_lower:
            return prompt
    return ""


def _build_prompt(
    voice_transcript: str,
    component: str,
    machine_history: str,
    image_provided: bool,
) -> str:
    component_prompt = _pick_component_prompt(component)
    history_section = (
        f"\n## Relevant Machine History\n{machine_history}\n" if machine_history else ""
    )
    image_note = (
        "\nAn image has been provided alongside this report. Analyse it carefully.\n"
        if image_provided
        else "\nNo image was provided; base your analysis solely on the voice description.\n"
    )
    return (
        BASELINE_SYSTEM_PROMPT
        + component_prompt
        + OUTPUT_SCHEMA_PROMPT
        + history_section
        + image_note
        + f"\n## Operator Voice Report\nComponent: {component}\nDescription: {voice_transcript}\n"
    )


def _fallback_finding(component: str, voice_transcript: str, image_url: str | None) -> dict:
    return {
        "component": component,
        "issue": "Manual Review Required",
        "description": voice_transcript or "No description provided.",
        "severity": "MONITOR",
        "confidence": 0.5,
        "recommended_action": "Review finding manually; AI analysis unavailable.",
        "operational_impact": "Unable to determine impact without AI analysis.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "image_url": image_url,
    }


async def classify_finding(
    voice_transcript: str,
    image_url: str | None,
    component: str,
    machine_history: str,
) -> dict:
    """Send a finding to the local LLaVA model and return structured JSON."""
    prompt = _build_prompt(voice_transcript, component, machine_history, image_url is not None)

    payload: dict = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    if image_url:
        # Validate URL before fetching to prevent SSRF.
        if not _is_safe_url(image_url):
            logger.warning("Rejected unsafe image_url (SSRF guard): %s", image_url)
        else:
            try:
                async with httpx.AsyncClient(timeout=30) as fetcher:
                    img_response = await fetcher.get(image_url)
                    img_response.raise_for_status()
                    import base64

                    b64_image = base64.b64encode(img_response.content).decode("utf-8")
                    payload["images"] = [b64_image]
            except Exception as img_err:
                logger.warning("Could not fetch image %s: %s", image_url, img_err)

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            raw_text: str = data.get("response", "")

            # Strip possible markdown fences
            raw_text = raw_text.strip()
            if raw_text.startswith("```"):
                parts = raw_text.split("```")
                if len(parts) >= 2:
                    raw_text = parts[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]

            finding = json.loads(raw_text.strip())
            finding.setdefault("image_url", image_url)
            finding.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
            return finding

    except httpx.ConnectError:
        logger.warning("Ollama is not reachable at %s; returning fallback finding.", OLLAMA_BASE_URL)
        return _fallback_finding(component, voice_transcript, image_url)
    except httpx.TimeoutException:
        logger.warning("Ollama request timed out; returning fallback finding.")
        return _fallback_finding(component, voice_transcript, image_url)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON response: %s", exc)
        return _fallback_finding(component, voice_transcript, image_url)
    except Exception as exc:
        logger.error("Unexpected error in classify_finding: %s", exc)
        return _fallback_finding(component, voice_transcript, image_url)
