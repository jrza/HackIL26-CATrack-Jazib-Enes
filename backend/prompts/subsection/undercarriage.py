UNDERCARRIAGE_PROMPT = """
## Component Context: Undercarriage (Track-Type Machines)

You are inspecting the undercarriage of a CAT track-type machine (bulldozer, excavator, or similar). Evaluate the criteria below and produce a single finding JSON representing the observed condition.

### Inspection Criteria

#### Track Tension (Sag)
- Measure or visually estimate track sag at the mid-point between the front idler and first carrier roller.
- PASS: Sag within CAT specification for this model (typically 25–40 mm depending on application).
- MONITOR: Sag 5–10 mm outside specification; adjustment recommended at next scheduled service.
- MODERATE: Sag > 10 mm outside specification or track visibly loose during travel.
- CRITICAL: Track at risk of de-tracking; derailed track or recoil spring fully compressed.

#### Sprocket Wear
- Inspect drive sprocket tooth profile for hook wear, reduced tooth height, or cracking.
- PASS: Tooth profile within acceptable wear limits; no cracking; tooth height ≥ 80% of new.
- MONITOR: Tooth height 65–79% of new; minor hook wear; no cracking.
- MODERATE: Tooth height 50–64% of new; pronounced hook wear causing chain engagement noise.
- CRITICAL: Tooth height < 50% of new; visible tooth cracking; broken tooth; ratcheting under load.

#### Roller Condition (Track Rollers & Carrier Rollers)
- Inspect roller flanges, tread surfaces, and end seals for wear, leakage, and flat spots.
- PASS: Rollers rotate freely; no visible seal leakage; flange and tread wear within limits.
- MONITOR: Slight seal weeping; minor flat spotting not affecting travel; flange wear approaching limit.
- MODERATE: Active seal leak with oil accumulation on roller body; significant flat spot causing vibration.
- CRITICAL: Seized roller; roller shell cracked or missing; loss of roller lubrication causing metal-to-metal damage.

#### Idler Condition (Front & Rear Idlers)
- Inspect idler tread surface, flanges, shaft seals, and mounting brackets.
- PASS: Idler tread and flanges within wear limits; no seal leakage; bracket secure.
- MONITOR: Idler tread wear approaching 75% of service limit; faint seal weepage.
- MODERATE: Tread wear beyond 75% of service limit; idler wobble noted; active seal leak.
- CRITICAL: Idler seized or cracked; bracket cracked or loose; loss of idler guiding track.

#### Track Pad / Track Shoe Wear
- Inspect track shoes for pad height, cracked shoes, missing hardware, and bolt looseness.
- PASS: Pad height ≥ 50% remaining; all shoes and bolts intact and torqued.
- MONITOR: Pad height 25–49% remaining; one or two minor cracks not through full pad.
- MODERATE: Pad height < 25%; multiple cracked pads; one or two loose or missing shoe bolts.
- CRITICAL: Metal-to-metal shoe base contact; multiple missing bolts; shoe separation risk.

### Guidance
- Undercarriage wear is often asymmetric; inspect both left and right sides independently.
- Specify the side and component position in the `component` field (e.g., "Right Track – Carrier Roller #2").
- Undercarriage replacement costs are high; accurate severity assessment prevents premature or delayed replacement.
- De-tracking risk in rough terrain automatically elevates findings to CRITICAL.
"""
