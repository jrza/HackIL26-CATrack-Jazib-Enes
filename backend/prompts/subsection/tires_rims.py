TIRES_RIMS_PROMPT = """
## Component Context: Tires & Rims

You are inspecting the tires and rims of a CAT heavy-equipment asset. Evaluate each criterion below and produce a single finding JSON that best represents the overall condition of the component being reported.

### Inspection Criteria

#### Tread Depth
- Measure or visually estimate remaining tread depth.
- PASS: ≥ 50% tread remaining, no abnormal wear patterns.
- MONITOR: 25–49% tread remaining or minor uneven wear.
- MODERATE: 10–24% tread remaining or significant cupping/feathering.
- CRITICAL: < 10% tread remaining, cords visible, or tread separation present.

#### Sidewall Condition
- Inspect for cuts, bulges, cracks, abrasions, or impact damage.
- PASS: No visible damage; minor scuff marks acceptable.
- MONITOR: Hairline surface cracking (ozone cracking) < 2 mm depth.
- MODERATE: Cuts or abrasions exposing reinforcing cords, or bulge < 25 mm diameter.
- CRITICAL: Deep cuts through cords, large bulge (≥ 25 mm), or visible delamination.

#### Bead Seal Integrity
- Check for air leaks at the bead-to-rim interface.
- PASS: No moisture staining, rust streaks, or visible gap at bead seat.
- MONITOR: Faint rust staining near bead; no audible leak.
- MODERATE: Visible gap or repeated pressure loss reported by operator.
- CRITICAL: Audible air leak or tire seated off bead.

#### Rim Condition
- Inspect rim flanges, bead seats, and spoke/disc area for cracks and deformation.
- PASS: No cracks, dents, or weld repairs; surface corrosion ≤ surface rust only.
- MONITOR: Minor dents in rim flange not affecting bead seal; light pitting.
- MODERATE: Dents deforming bead seat area or weld repairs without current cracking.
- CRITICAL: Visible cracks in rim, severe distortion, or failed weld repair.

#### Lug Nut / Wheel Fastener Condition
- Check for missing, loose, cross-threaded, or corroded lug nuts / wheel bolts.
- PASS: All fasteners present, no visible rust, no looseness detected.
- MONITOR: Surface rust on nuts; all present and torqued.
- MODERATE: One or two nuts with stripped thread appearance but wheel retained.
- CRITICAL: Missing lug nuts, loose wheel, or cracked wheel stud.

### Guidance
- If an image is provided, prioritise visual evidence over the voice description where they conflict.
- Note the specific tire position (e.g., Left Front, Right Rear) in the `component` field.
- When multiple issues are present on the same tire/rim, report the highest severity finding.
"""
