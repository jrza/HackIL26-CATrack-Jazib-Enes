"""
local_llm.py — Ollama/LLaVA integration for offline-first finding classification.

Public API
----------
classify_finding(voice_transcript, image_b64, component, machine_history) -> dict

Returns every output-schema field plus two routing flags the caller uses to
decide downstream actions:
  needs_human_review (bool) — confidence < 0.7   → flag for manual human review
  needs_escalation   (bool) — 0.7 ≤ conf < 0.9  → send to cloud AI for second opinion
  (neither flag set)        — confidence ≥ 0.9   → trust local result, no escalation
"""

import json
import logging
import os
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from prompts.baseline import BASELINE_SYSTEM_PROMPT
from prompts.output_schema import OUTPUT_SCHEMA_PROMPT
from prompts.subsection.hydraulics import HYDRAULICS_PROMPT
from prompts.subsection.tires_rims import TIRES_RIMS_PROMPT
from prompts.subsection.undercarriage import UNDERCARRIAGE_PROMPT

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llava:7b-v1.6-mistral-q4_K_M")

logger.info("local_llm: Ollama URL = %s  model = %s", OLLAMA_BASE_URL, OLLAMA_MODEL)

# Confidence thresholds (per copilot-instructions.md)
_HUMAN_REVIEW_THRESHOLD = 0.7  # confidence < 0.7  → needs_human_review
_ESCALATION_THRESHOLD = 0.9    # 0.7 ≤ conf < 0.9 → needs_escalation

_VALID_SEVERITIES = {"PASS", "MONITOR", "MODERATE", "CRITICAL"}

# Maps component keyword substrings → subsection prompt.
_COMPONENT_PROMPTS: dict[str, str] = {
    "tires":        TIRES_RIMS_PROMPT,
    "rims":         TIRES_RIMS_PROMPT,
    "wheels":       TIRES_RIMS_PROMPT,
    "hydraulics":   HYDRAULICS_PROMPT,
    "hydraulic":    HYDRAULICS_PROMPT,
    "cylinder":     HYDRAULICS_PROMPT,
    "hose":         HYDRAULICS_PROMPT,
    "undercarriage": UNDERCARRIAGE_PROMPT,
    "track":        UNDERCARRIAGE_PROMPT,
    "sprocket":     UNDERCARRIAGE_PROMPT,
    "roller":       UNDERCARRIAGE_PROMPT,
    "idler":        UNDERCARRIAGE_PROMPT,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _pick_component_prompt(component: str) -> str:
    """Return the subsection prompt for a component, or '' for unknown components."""
    component_lower = component.lower()
    for keyword, prompt in _COMPONENT_PROMPTS.items():
        if keyword in component_lower:
            return prompt
    return ""


def _build_prompt(
    voice_transcript: str,
    component: str,
    machine_history: str,
    image_provided: bool,
) -> str:
    parts = [
        BASELINE_SYSTEM_PROMPT,
        _pick_component_prompt(component),
        OUTPUT_SCHEMA_PROMPT,
    ]
    if machine_history:
        parts.append(f"\n## Relevant Machine History\n{machine_history}\n")
    parts.append(
        "\nAn image has been provided alongside this report. Analyse it carefully.\n"
        if image_provided
        else "\nNo image was provided; base your analysis solely on the voice description.\n"
    )
    parts.append(
        f"\n## Operator Voice Report\n"
        f"Component: {component}\n"
        f"Description: {voice_transcript}\n"
    )
    return "".join(parts)


def _routing_flags(confidence: float) -> dict:
    """Return confidence-based routing flags."""
    return {
        "needs_human_review": confidence < _HUMAN_REVIEW_THRESHOLD,
        "needs_escalation":   _HUMAN_REVIEW_THRESHOLD <= confidence < _ESCALATION_THRESHOLD,
    }


def _parse_llm_json(raw: str) -> dict:
    """Strip markdown fences (if any) and parse the JSON finding from the LLM."""
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        # Drop opening fence line (```json or ```) and closing ``` line.
        end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        raw = "\n".join(lines[1:end])
    return json.loads(raw.strip())


def _validate_and_fill(finding: dict) -> dict:
    """
    Ensure all output-schema fields are present with correct types.
    Coerces bad values rather than raising so the service always returns something usable.
    """
    now = datetime.now(timezone.utc).isoformat()

    severity = str(finding.get("severity", "MONITOR")).upper()
    if severity not in _VALID_SEVERITIES:
        logger.warning("LLM returned unexpected severity '%s'; defaulting to MONITOR.", severity)
        severity = "MONITOR"

    try:
        confidence = float(finding.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.5

    return {
        "component":          str(finding.get("component") or "Unknown Component"),
        "issue":              str(finding.get("issue") or "Unknown Issue"),
        "description":        str(finding.get("description") or ""),
        "severity":           severity,
        "confidence":         confidence,
        "recommended_action": str(finding.get("recommended_action") or ""),
        "operational_impact": str(finding.get("operational_impact") or ""),
        "timestamp":          str(finding.get("timestamp") or now),
        "image_url":          finding.get("image_url"),  # null when image sent as b64
    }


def _fallback_finding(component: str, voice_transcript: str) -> dict:
    """Returned when Ollama is unreachable, times out, or returns invalid JSON."""
    confidence = 0.5  # below escalation threshold — will trigger human review
    finding = {
        "component":          component,
        "issue":              "Manual Review Required",
        "description":        voice_transcript or "No description provided.",
        "severity":           "MONITOR",
        "confidence":         confidence,
        "recommended_action": "Review finding manually; AI analysis unavailable.",
        "operational_impact": "Unable to determine operational impact without AI analysis.",
        "timestamp":          datetime.now(timezone.utc).isoformat(),
        "image_url":          None,
    }
    return {**finding, **_routing_flags(confidence)}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def classify_finding(
    voice_transcript: str,
    image_b64: str | None,
    component: str,
    machine_history: str,
) -> dict:
    """
    Classify an inspection finding using the local LLaVA model via Ollama.

    Parameters
    ----------
    voice_transcript : str
        Raw transcript of the operator's voice description.
    image_b64 : str | None
        Base64-encoded image (plain base64 or data-URI; prefix stripped automatically).
        Pass None when no image was captured.
    component : str
        Equipment component being inspected (e.g. "Left Rear Tire").
    machine_history : str
        Formatted prior-findings context from Supermemory for this machine.

    Returns
    -------
    dict
        All output-schema fields plus routing flags:
          - needs_human_review (bool) : confidence < 0.7
          - needs_escalation   (bool) : 0.7 <= confidence < 0.9
    """
    prompt = _build_prompt(
        voice_transcript=voice_transcript,
        component=component,
        machine_history=machine_history,
        image_provided=image_b64 is not None,
    )

    payload: dict = {
        "model":  OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    if image_b64:
        # Ollama expects plain base64 with no data-URI prefix.
        b64_clean = image_b64.split(",", 1)[-1] if "," in image_b64 else image_b64
        payload["images"] = [b64_clean]

    # Log payload summary — truncate image data to avoid log spam.
    log_payload = {**payload}
    if "images" in log_payload:
        log_payload = {**log_payload, "images": [f"<base64 {len(img)} chars>" for img in log_payload["images"]]}
    logger.debug("Ollama request payload: %s", log_payload)

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
            )
            logger.debug("Ollama HTTP %s from %s/api/generate", response.status_code, OLLAMA_BASE_URL)
            response.raise_for_status()
            raw_text: str = response.json().get("response", "")
            logger.debug("Ollama raw response (first 500 chars): %.500s", raw_text)

        finding = _parse_llm_json(raw_text)
        validated = _validate_and_fill(finding)
        logger.info(
            "LLaVA classified component='%s' severity=%s confidence=%.2f "
            "needs_human_review=%s needs_escalation=%s",
            validated["component"],
            validated["severity"],
            validated["confidence"],
            validated["confidence"] < _HUMAN_REVIEW_THRESHOLD,
            _HUMAN_REVIEW_THRESHOLD <= validated["confidence"] < _ESCALATION_THRESHOLD,
        )
        return {**validated, **_routing_flags(validated["confidence"])}

    except httpx.ConnectError as exc:
        logger.warning("Ollama unreachable at %s – %s. Returning fallback finding.", OLLAMA_BASE_URL, exc)
        return _fallback_finding(component, voice_transcript)
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Ollama returned HTTP %s. Response body: %s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        return _fallback_finding(component, voice_transcript)
    except httpx.TimeoutException:
        logger.warning("Ollama request timed out after 60 s – returning fallback finding.")
        return _fallback_finding(component, voice_transcript)
    except json.JSONDecodeError as exc:
        logger.error("LLM returned non-JSON response (%s). Raw text: %.500s", exc, raw_text)
        return _fallback_finding(component, voice_transcript)
    except Exception:
        logger.exception("Unexpected error in classify_finding – returning fallback finding.")
        return _fallback_finding(component, voice_transcript)
