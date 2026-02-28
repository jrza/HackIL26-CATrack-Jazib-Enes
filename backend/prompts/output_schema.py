OUTPUT_SCHEMA_PROMPT = """
## Required JSON Output Format

Return a single JSON object with exactly the following fields:

{
  "component": "<string – name of the inspected component, e.g. 'Left Rear Tire'>",
  "issue": "<string – short title of the finding, e.g. 'Sidewall Cracking'>",
  "description": "<string – detailed description of the observed condition>",
  "severity": "<PASS | MONITOR | MODERATE | CRITICAL>",
  "confidence": <float between 0.0 and 1.0>,
  "recommended_action": "<string – specific corrective action required>",
  "operational_impact": "<string – consequence if the issue is not addressed>",
  "timestamp": "<ISO 8601 UTC datetime string, e.g. '2024-05-01T14:30:00Z'>",
  "image_url": "<string URL of the evidence image, or null if none>"
}

### Field Rules
- `severity` must be exactly one of: PASS, MONITOR, MODERATE, CRITICAL (uppercase).
- `confidence` must be a decimal number from 0.0 (no confidence) to 1.0 (absolute certainty).
- `recommended_action` must be an empty string only when `severity` is PASS.
- `operational_impact` must describe the real-world consequence (downtime, safety risk, cost impact).
- `image_url` should be null (JSON null, not the string "null") when no image was provided.
- Do NOT wrap the JSON in markdown code fences.
- Do NOT add any keys beyond those listed above.
"""
