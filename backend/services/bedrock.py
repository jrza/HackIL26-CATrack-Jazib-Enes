import json
import logging
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

from prompts.baseline import BASELINE_SYSTEM_PROMPT

load_dotenv()

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"
)

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


def _get_client():
    """Create a Bedrock Runtime client using credentials from the environment."""
    return boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID") or None,
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY") or None,
    )


def _fallback(finding_data: dict, reason: str) -> dict:
    return {
        "validated_severity": finding_data.get("severity", "MODERATE"),
        "confidence": 0.0,
        "root_cause_analysis": reason,
        "additional_recommendations": ["Manual expert review required."],
        "service_references": [],
        "escalation_timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def escalate_finding(finding_data: dict, machine_history: str) -> dict:
    """Send a moderate/critical finding to Amazon Bedrock for expert analysis."""
    if not os.getenv("AWS_ACCESS_KEY_ID") or not os.getenv("AWS_SECRET_ACCESS_KEY"):
        logger.warning("AWS credentials not configured; returning local analysis.")
        return _fallback(
            finding_data,
            "AWS credentials not configured – manual expert review required.",
        )

    history_note = (
        f"\n## Machine History\n{machine_history}" if machine_history else ""
    )
    user_content = (
        "Please review the following inspection finding and provide your expert analysis."
        f"{history_note}\n\n## Finding Data\n{json.dumps(finding_data, indent=2)}"
    )

    try:
        client = _get_client()
        response = client.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": ESCALATION_SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": user_content}]}],
            inferenceConfig={"maxTokens": 1024, "temperature": 0.2},
        )

        content_blocks = response.get("output", {}).get("message", {}).get("content", [])
        raw_text = next(
            (b["text"] for b in content_blocks if "text" in b), ""
        )

        # Strip markdown fences if present
        stripped = raw_text.strip()
        if stripped.startswith("```"):
            stripped = stripped.split("\n", 1)[-1]
            stripped = stripped.rsplit("```", 1)[0].strip()

        result = json.loads(stripped)
        result.setdefault("escalation_timestamp", datetime.now(timezone.utc).isoformat())
        return result

    except (BotoCoreError, ClientError) as exc:
        logger.error("Bedrock API error: %s", exc)
        return _fallback(finding_data, f"Bedrock API error: {exc}")
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Bedrock response as JSON: %s", exc)
        return _fallback(finding_data, "Bedrock returned non-JSON response.")
    except Exception as exc:
        logger.error("Bedrock escalation failed: %s", exc)
        return _fallback(finding_data, f"Cloud escalation error: {exc}")
