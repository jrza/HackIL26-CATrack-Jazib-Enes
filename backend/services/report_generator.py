import logging
import uuid
from datetime import datetime, timezone

from models.finding import Finding, Severity

logger = logging.getLogger(__name__)

_SEVERITY_ORDER: dict[Severity, int] = {
    Severity.CRITICAL: 0,
    Severity.MODERATE: 1,
    Severity.MONITOR: 2,
    Severity.PASS: 3,
}


def _count_by_severity(findings: list[Finding]) -> dict[str, int]:
    counts = {"critical": 0, "moderate": 0, "monitor": 0, "pass": 0}
    for f in findings:
        key = f.severity.value.lower()
        if key in counts:
            counts[key] += 1
    return counts


def _build_summary(counts: dict[str, int], machine: dict) -> str:
    machine_name = machine.get("name", "Unknown Machine")
    total = sum(counts.values())
    parts: list[str] = [
        f"Inspection completed for {machine_name}. "
        f"{total} finding(s) recorded."
    ]

    if counts["critical"] > 0:
        parts.append(
            f"⚠ {counts['critical']} CRITICAL finding(s) require immediate attention "
            f"and machine should be taken out of service."
        )
    if counts["moderate"] > 0:
        parts.append(
            f"• {counts['moderate']} MODERATE finding(s) require planned maintenance "
            f"within the current service interval."
        )
    if counts["monitor"] > 0:
        parts.append(
            f"• {counts['monitor']} MONITOR finding(s) to track at the next scheduled service."
        )
    if counts["pass"] > 0:
        parts.append(f"✓ {counts['pass']} component(s) passed inspection.")

    if counts["critical"] == 0 and counts["moderate"] == 0:
        parts.append("Machine is cleared for continued operation.")
    elif counts["critical"] > 0:
        parts.append("Machine is NOT cleared for operation until CRITICAL findings are resolved.")
    else:
        parts.append("Machine may continue limited operation pending planned maintenance.")

    return " ".join(parts)


async def generate_report(
    inspection_id: str,
    findings: list,
    machine: dict,
) -> dict:
    """Build report data structure from inspection findings."""
    finding_objects: list[Finding] = []
    for f in findings:
        if isinstance(f, Finding):
            finding_objects.append(f)
        elif isinstance(f, dict):
            try:
                finding_objects.append(Finding(**f))
            except Exception as exc:
                logger.warning("Skipping malformed finding: %s", exc)

    finding_objects.sort(key=lambda f: _SEVERITY_ORDER.get(f.severity, 99))

    counts = _count_by_severity(finding_objects)
    summary = _build_summary(counts, machine)

    report_id = str(uuid.uuid4())
    asset_id = machine.get("asset_id", "unknown")

    # Derive inspection start time from the earliest finding timestamp.
    inspection_started_at: str | None = None
    if finding_objects:
        inspection_started_at = min(f.timestamp for f in finding_objects).isoformat()

    report = {
        "id": report_id,
        "inspection_id": inspection_id,
        "asset_id": asset_id,
        "inspection_started_at": inspection_started_at,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "FINAL",
        "findings": [f.model_dump() for f in finding_objects],
        "total_findings": len(finding_objects),
        "summary": summary,
        "critical_count": counts["critical"],
        "moderate_count": counts["moderate"],
        "monitor_count": counts["monitor"],
        "pass_count": counts["pass"],
        "pdf_url": None,
    }

    try:
        pdf_url = _generate_pdf(report, finding_objects, machine)
        report["pdf_url"] = pdf_url
    except Exception as exc:
        logger.warning("PDF generation failed (non-fatal): %s", exc)

    return report


def _generate_pdf(report: dict, findings: list[Finding], machine: dict) -> str | None:
    """Generate a PDF report using reportlab and return a file path."""
    try:
        import io
        import os
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
        )

        SEVERITY_COLORS = {
            Severity.CRITICAL: colors.HexColor("#FF4444"),
            Severity.MODERATE: colors.HexColor("#FF8C00"),
            Severity.MONITOR: colors.HexColor("#FFD700"),
            Severity.PASS: colors.HexColor("#28A745"),
        }

        reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_path = os.path.join(reports_dir, f"report_{report['id']}.pdf")

        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph("CAT Inspect AI Co-Pilot – Inspection Report", styles["Title"]))
        story.append(Spacer(1, 0.2 * inch))

        # Machine info
        story.append(Paragraph(f"Asset: {machine.get('name', 'Unknown')}", styles["Heading2"]))
        story.append(Paragraph(f"Asset ID: {report['asset_id']}", styles["Normal"]))
        story.append(Paragraph(f"Inspection ID: {report['inspection_id']}", styles["Normal"]))
        story.append(Paragraph(f"Generated: {report['generated_at']}", styles["Normal"]))
        story.append(Spacer(1, 0.2 * inch))

        # Summary
        story.append(Paragraph("Summary", styles["Heading2"]))
        story.append(Paragraph(report["summary"], styles["Normal"]))
        story.append(Spacer(1, 0.2 * inch))

        # Severity counts table
        count_data = [
            ["Severity", "Count"],
            ["CRITICAL", str(report["critical_count"])],
            ["MODERATE", str(report["moderate_count"])],
            ["MONITOR", str(report["monitor_count"])],
            ["PASS", str(report["pass_count"])],
        ]
        count_table = Table(count_data, colWidths=[2 * inch, 1 * inch])
        count_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ]
            )
        )
        story.append(count_table)
        story.append(Spacer(1, 0.3 * inch))

        # Findings detail
        if findings:
            story.append(Paragraph("Findings Detail", styles["Heading2"]))
            for finding in findings:
                sev_color = SEVERITY_COLORS.get(finding.severity, colors.grey)
                sev_style = ParagraphStyle(
                    "SeverityTag",
                    parent=styles["Normal"],
                    textColor=sev_color,
                    fontName="Helvetica-Bold",
                )
                story.append(Paragraph(f"{finding.component} – {finding.issue}", styles["Heading3"]))
                story.append(Paragraph(f"Severity: {finding.severity.value}", sev_style))
                story.append(Paragraph(f"Confidence: {finding.confidence:.0%}", styles["Normal"]))
                story.append(Paragraph(f"Description: {finding.description}", styles["Normal"]))
                story.append(
                    Paragraph(
                        f"Recommended Action: {finding.recommended_action}", styles["Normal"]
                    )
                )
                story.append(
                    Paragraph(
                        f"Operational Impact: {finding.operational_impact}", styles["Normal"]
                    )
                )
                story.append(Spacer(1, 0.15 * inch))

        doc.build(story)
        return pdf_path

    except Exception as exc:
        logger.error("reportlab PDF generation error: %s", exc)
        return None
