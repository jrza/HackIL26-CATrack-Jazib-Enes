import json
import logging
import os
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from prompts.baseline import BASELINE_SYSTEM_PROMPT

load_dotenv()

logger = logging.getLogger(__name__)

AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY", "")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_VERSION = "2024-02-01"
AZURE_DEPLOYMENT_NAME = "gpt-4o"

ESCALATION_SYSTEM_PROMPT = (
    BASELINE_SYSTEM_PROMPT
    + """
## Escalation Context
You are being invoked for a SECOND-OPINION escalation review. A local AI has already classified this finding.
Your task is to:
1. Validate or correct the severity classification.
2. Provide an expert-level root-cause analysis.
3. Supply additional CAT service manual references where applicable.
4. Recommend immediate next steps in priority order.

Return a JSON object with these fields:
{
  "validated_severity": "<PASS|MONITOR|MODERATE|CRITICAL>",
  "confidence": <float 0.0-1.0>,
  "root_cause_analysis": "<string>",
  "additional_recommendations": ["<string>", ...],
  "service_references": ["<string>", ...],
  "escalation_timestamp": "<ISO 8601 UTC>"
}
"""
)


async def escalate_finding(finding_data: dict, machine_history: str) -> dict:
    """Send a moderate/critical finding to Azure OpenAI for expert analysis."""
    if not AZURE_OPENAI_KEY or not AZURE_OPENAI_ENDPOINT:
        logger.warning("Azure OpenAI credentials not configured; returning local analysis.")
        return {
            "validated_severity": finding_data.get("severity", "MODERATE"),
            "confidence": finding_data.get("confidence", 0.5),
            "root_cause_analysis": "Azure OpenAI not configured – manual expert review required.",
            "additional_recommendations": [
                "Configure AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT for cloud escalation."
            ],
            "service_references": [],
            "escalation_timestamp": datetime.now(timezone.utc).isoformat(),
        }

    history_note = (
        f"\n## Machine History\n{machine_history}" if machine_history else ""
    )
    user_content = (
        f"Please review the following inspection finding and provide your expert analysis."
        f"{history_note}\n\n## Finding Data\n{json.dumps(finding_data, indent=2)}"
    )

    payload = {
        "messages": [
            {"role": "system", "content": ESCALATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
        "response_format": {"type": "json_object"},
    }

    url = (
        f"{AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/deployments/"
        f"{AZURE_DEPLOYMENT_NAME}/chat/completions"
        f"?api-version={AZURE_OPENAI_API_VERSION}"
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                url,
                headers={
                    "api-key": AZURE_OPENAI_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            result.setdefault("escalation_timestamp", datetime.now(timezone.utc).isoformat())
            return result

    except httpx.HTTPStatusError as exc:
        logger.error("Azure OpenAI HTTP error %s: %s", exc.response.status_code, exc)
        return {
            "validated_severity": finding_data.get("severity", "MODERATE"),
            "confidence": 0.0,
            "root_cause_analysis": f"Cloud escalation failed (HTTP {exc.response.status_code}).",
            "additional_recommendations": ["Retry escalation or contact support."],
            "service_references": [],
            "escalation_timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        logger.error("Azure OpenAI escalation failed: %s", exc)
        return {
            "validated_severity": finding_data.get("severity", "MODERATE"),
            "confidence": 0.0,
            "root_cause_analysis": f"Cloud escalation error: {exc}",
            "additional_recommendations": ["Manual expert review required."],
            "service_references": [],
            "escalation_timestamp": datetime.now(timezone.utc).isoformat(),
        }
