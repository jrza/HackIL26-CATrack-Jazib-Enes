HYDRAULICS_PROMPT = """
## Component Context: Hydraulic System

You are inspecting the hydraulic system of a CAT heavy-equipment asset. Evaluate the criteria below and produce a single finding JSON representing the observed condition.

### Inspection Criteria

#### Hydraulic Hose Condition
- Inspect all visible hoses for abrasion, kinking, cracking, blistering, or chafing against metal surfaces.
- PASS: Hoses flexible, no cracks or abrasion; minimum 25 mm clearance from hot surfaces and moving parts.
- MONITOR: Minor surface scuffing < 10% of outer sheath depth; slight stiffening in older hoses.
- MODERATE: Abrasion through outer sheath exposing braid; hose routed against sharp edge or hot surface.
- CRITICAL: Pinhole or weeping leak, inner braid exposed through full sheath, severe kink, or blister.

#### Cylinder Rod & Seal Condition
- Inspect exposed cylinder rods and wiper seals for scoring, pitting, or oil weeping.
- PASS: Rod surface mirror-smooth; no oil film beyond normal lubrication sheen.
- MONITOR: Very light surface corrosion or minor scratching; no active seepage.
- MODERATE: Scoring or pitting marks > 1 mm depth; oil film accumulating dust/debris on rod.
- CRITICAL: Active drip or stream of hydraulic fluid from rod seal; deep score fully around rod circumference.

#### Hydraulic Fluid Level
- Check reservoir sight glass or dipstick level.
- PASS: Fluid within normal operating band (between MIN and MAX marks).
- MONITOR: Fluid at or just above MIN mark; schedule fluid top-up.
- MODERATE: Fluid below MIN mark; determine cause before operation.
- CRITICAL: No visible fluid in sight glass; system risk of cavitation or pump failure.

#### External Leaks
- Inspect all fittings, manifolds, valve blocks, and pump/motor ports for external leakage.
- PASS: No staining, wet spots, or accumulated fluid anywhere in the system.
- MONITOR: Faint seepage at a fitting; staining only, no drip.
- MODERATE: Slow drip (< 1 drop/minute) at a fitting or valve block port.
- CRITICAL: Steady drip or stream; puddle forming under machine; spray leak under pressure.

#### System Pressure Indicators
- Note any operator-reported sluggishness, abnormal noise, or warning light activation.
- PASS: Full implement speed; no cavitation noise; no warning lights.
- MONITOR: Slightly reduced implement speed; no noise; operator notes reduced responsiveness.
- MODERATE: Noticeably slow cycles; intermittent cavitation noise; possible low-pressure warning.
- CRITICAL: Implements fail to hold load; loud cavitation; high-temperature hydraulic warning active.

### Guidance
- Hydraulic fluid leaks near exhaust components or turbochargers carry fire risk – escalate to CRITICAL automatically.
- Identify the specific hose/cylinder/fitting location in the `component` field (e.g., "Boom Cylinder Rod Seal – Left").
- If an image is provided, look for sheen, staining, or pooling that confirms or contradicts the voice report.
"""
