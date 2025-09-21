# Pixi Viewer – URL Flags Cheat Sheet

Use these URL params to control the viewer without rebuilding. Examples assume adding `&flag=value` to the fight URL.

## Core Logic / Determinism
- `pixiStrict=1`: Step‑driven rendering (no client heuristics). Defaults adjusted to be stricter (see melee gap).
- `pixiDeterministic=1`: Deterministic RNG (seeded by `fight.id`) for lanes/X and random picks. Also enabled implicitly by `pixiStrict=1`.

## Motion / Timings
- `pixiApproachPps=380` | `pixiReturnPps=600`: Speeds in px/s for approach/return. Defaults are 380/600 (strict does NOT override them).
- `pixiApproachScale=1`: Multiplies approach move durations (1 = neutral).
- `pixiMinDiagX=60`: Minimum horizontal delta to allow diagonal pre‑move in AttemptHit.

## Melee Contact / Gaps
- `pixiGap=8`: Constant melee gap (px) removed from computed contact distance. Default is `0` in strict, `8` otherwise.

## Arrivals (bond depuis l’extérieur)
- `pixiArriveMs=420`: Arrival jump duration in ms.
- `pixiArriveArc=28`: Arrival jump arc height in px.
- `pixiArriveBounce=1`: Enables small landing bounce (1 on, 0 off).

## Deterministic Lanes/X (seeded)
Enabled by `pixiStrict=1` or `pixiDeterministic=1`. Affects:
- Lane Y selection (chooseLaneY).
- Initial X at Arrive (left/right).

## Portraits (PFP in HUD)
- `pixiPfp=/path.png`: Same image for both sides.
- `pixiPfpL=/path.png` | `pixiPfpR=/path.png`: Different images per side.
- `pixiPfpScale=1`: Downscale factor (image is auto‑fit; this only scales down further, never above fit).
- `pixiPfpOffX=0` | `pixiPfpOffY=0`: Fine offsets inside the square.

## Trace / Overlay (calibration)
- `pixiTrace=1`: Shows HUD buttons “Save Trace / Load Ref CSV / Overlay On/Off”.
  - Save Trace: exports CSV of live run (t, who, rootX, rootY, anim, trackTime).
  - Load Ref CSV: loads a reference CSV from disk and enables overlay.
  - Overlay On/Off: toggles overlay dots (L red, R blue) + MAE(px) display.
- `pixiTraceAuto=1`: If `pixiTrace=1`, auto‑downloads CSV at the end.

## Background / Scale
- `bg=nameOrFile`: Background override (with/without extension). Images are looked up in `/backgrounds` and official paths.
- `bgVideo=1`: Try video backgrounds (webm/mp4) when available.
- `charPx=50`: Target character “visual width” (used to compute Spine scale consistently).

## Misc / Expert
- `pixiScale` / `pixiBoost`: Additional viewer scaling/speed boost knobs.
- `pixiMulL=1` | `pixiMulR=1`: Side multipliers to fine‑tune approach timing asymmetries.
- `pixiClampMin=0.58` | `pixiClampMax=0.98`: Y clamping ratios for arena lanes.
- `pixiDiag=1`: Debug vectors (development only).

## Notes
- Strict mode enforces step fidelity but no longer overrides base speeds (380/600). It still sets melee gap default to 0 for cleaner contacts.
- Deterministic RNG makes replays visually reproducible (same lanes/X each load).
- The victory banner now persists (“NAME WON THE FIGHT”); confetti show above the winner’s HUD at the end.

