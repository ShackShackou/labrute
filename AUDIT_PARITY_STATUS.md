# Parity Audit — LaBrute Official vs Pixi v8 + Spine

This document tracks the parity status and next steps to match the official LaBrute renderer/engine.

## Summary

- Server engine: feature-complete for steps, supers, skills, weapons, pets. Seeded RNG added to make fight generation deterministic during a generation pass.
- Legacy renderer (pixi-legacy) is visually feature-rich; Pixi v8 + Spine renderer exists (Compare mode) and needs calibration for motion/timings.

## What’s Done

- Step coverage server-side (Arrive/Leave/Move/MoveBack/AttemptHit/Hit/Poison/Block/Evade/Throw/Disarm/Sabotage/Spy/Saboteur/Hammer/FlashFlood/Bomb/Hypnotise/Treat/Haste/Vampirism/Regeneration/DropShield/End/Counter).
- Data tables for weapons, pets, skills (odds/uses/types) aligned to official nomenclature.
- CompareFight: side-by-side with metrics (mean, RMSE, p95) + CSV export.
- Off-trace instrumentation hooks in legacy renderer.
- Seeded RNG for fight generation (server/src/utils/fight/rng.ts) and usage in fightMethods/getDamage; wrapped randomBetween/randomItem/weightedRandom in generation path.

## Gaps vs Official

- Movement/parallax: Y drift and exact contact distance still off in Pixi v8.
- Timings: step durations not matched to official traces; dt unspecified on steps.
- RNG reproducibility beyond generation: generation is deterministic during run; replay consumes stored steps (OK). Seeding not yet persisted as a Fight field (not needed for replay but useful for debugging).
- Pixi v8 + Spine: full integration pending (assets, animation mapping, VFX parity, HUD overlays, z-ordering, shields, auras).

## Next Steps

1) Seed plumbing
   - Optional: Add `seed` to Prisma `Fight` for audit/debug. Store it when generating.
   - Replace remaining `Math.random()`/random utilities in any residual server utils if found in future changes.

2) Motion + Timings calibration (Pixi v8)
   - Use `CompareFight` sliders (drift, contactBias, returnFactor, charPx, pixiScale) to match 3–5 reference fights.
   - Freeze constants and move from localStorage to code defaults once converged.
   - Extract a StepType→duration map and honor these durations in tweens.

3) Renderer VFX parity
   - Port shield overlays, halos, auras, hit/crit flashes, trails, item drops to Pixi v8.
   - Normalize z-index and sortableChildren; avoid removeChild during tick to prevent batcher errors.

4) Assets + Spine
   - Finalize Spine rigs; map official symbol parts to Spine slots (see MAPPING_VISUEL_LABRUTE.md).
   - Ensure weapon/pet/boss models and anchor points match `FIGHTER_*` constants.

5) Validation
   - Use CompareFight metrics to track regression; target mean < 10ms, RMSE < 30ms, p95 < 60ms versus reference dt.
   - Keep an evolving list of “reference fights” to re-check after adjustments.

## Notes

- Do not overcomplicate logic; keep motion rules simple and exact to official behavior (AttemptHit never changes Y; Move diagonal only when r=1).
- Instruments: `?renderer=compare` and `__offTrace*` helpers available for trace exports.

