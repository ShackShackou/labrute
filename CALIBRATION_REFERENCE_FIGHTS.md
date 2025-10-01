# 🎯 Calibration Reference Fights

This document tracks the reference fights used for timing/motion calibration in CompareFight.

## Objectives
- **Mean** < 10ms (écart moyen Pixi vs Official)
- **RMSE** < 30ms (précision globale)
- **p95** < 60ms (95e percentile des écarts absolus)

---

## 📋 Option A: User-Provided Fights

### Fight 1: HerveVenere vs opponent
- **URL**: http://localhost:3000/HerveVenere/fight/bd336b4a-fe6e-41bd-88ff-28e7c0bcb4c5
- **ID**: bd336b4a-fe6e-41bd-88ff-28e7c0bcb4c5
- **Status**: ✅ Current test fight (weapons issue resolved)
- **Characteristics**:
  - Contains weapon equip/attacks
  - Standard melee combat
  - Good baseline for weapon overlay testing

### Fight 2: DFF vs opponent
- **URL**: http://localhost:3000/DFF/fight/e1eebfeb-65ea-4870-9327-cd3ffa1fbc4a
- **ID**: e1eebfeb-65ea-4870-9327-cd3ffa1fbc4a
- **Status**: Available from history
- **Characteristics**: TBD (to be analyzed)

### Fight 3: BeigePopular vs opponent
- **URL**: http://localhost:3000/BeigePopular/fight/670be95e5e65a2f6a17f5f9a
- **ID**: 670be95e5e65a2f6a17f5f9a
- **Status**: ❌ **BROKEN** (500 Internal Server Error - corrupted fight data)
- **Characteristics**: Cannot be used for calibration

### Additional User Fights
- _Add more specific fights here as needed_

---

## 🎲 Option B: Generated Fights (Varied Scenarios)

We'll generate 5-7 synthetic fights with specific characteristics:

### Generated Fight 1: Short Melee (Target: ~20 steps)
- **Profile**: 2 brutes, no pets, melee weapons only
- **Focus**: Basic Move/AttemptHit/Hit timing
- **Status**: ⏳ To Generate

### Generated Fight 2: Projectile Heavy (Target: ~30 steps)
- **Profile**: Throwing weapons (knife, shuriken, lance)
- **Focus**: Throw/Disarm step timing
- **Status**: ⏳ To Generate

### Generated Fight 3: Pet Combat (Target: ~35 steps)
- **Profile**: Both brutes with pets (bear/panther/dog)
- **Focus**: Pet Arrive/Leave, pet movement
- **Status**: ⏳ To Generate

### Generated Fight 4: Super Heavy (Target: ~40 steps)
- **Profile**: Multiple supers (Net, Bomb, Hammer, Hypnosis, FlashFlood)
- **Focus**: Super step timing and VFX duration
- **Status**: ⏳ To Generate

### Generated Fight 5: Long Mixed Combat (Target: ~60+ steps)
- **Profile**: Mix of everything (pets, supers, throws, melee)
- **Focus**: Overall timing stability, late-fight drift
- **Status**: ⏳ To Generate

### Generated Fight 6: Haste/Speed Buffs (Target: ~35 steps)
- **Profile**: Brutes with Haste, multiple speed-affecting supers
- **Focus**: Speed modifier impact on timings
- **Status**: ⏳ To Generate

### Generated Fight 7: Backup/Reinforcements (Target: ~45 steps)
- **Profile**: Backup talent triggers, multiple fighters
- **Focus**: Ally Arrive/Leave, multi-fighter positioning
- **Status**: ⏳ To Generate

---

## 📚 Option C: Historical Analysis

We'll analyze existing fight patterns from the codebase:

### Pattern 1: CompareFight Default
- **Source**: Any fight loaded via `?renderer=compare`
- **Usage**: Active testing during development
- **Notes**: Current fight being debugged

### Pattern 2: Commit History Regression Tests
- **Source**: Fights referenced in git commits
- **Commits to check**:
  - `573977a2` - Bomb projectile flight fix
  - `f83cc206` - RNG seeding + Trap duplicate fix
  - `cc711b07` - Backup (renforts) support
  - `11a1406f` - Trap attach/release, Throw anim
- **Status**: Extract fight IDs from commit messages/tests

### Pattern 3: Edge Cases
- **Very short fights** (< 10 steps): Victory/defeat immediate
- **Very long fights** (> 80 steps): Endurance, drift accumulation
- **Corner cases**: Disarm chains, Steal weapons, Sabotage pre-fight

---

## 🔧 Calibration Workflow

For each reference fight:

1. **Load in CompareFight**
   ```
   http://localhost:3000/{brute}/fight/{fightId}?renderer=compare
   ```

2. **Enable Trace + Auto**
   - Turn ON "Trace" toggle
   - Turn ON "Auto" toggle
   - Click "Start Trace"

3. **Record Baseline Metrics**
   - Note: Mean, RMSE, p95 (before calibration)
   - Export Diff CSV for analysis

4. **Adjust Sliders**
   - `pixiScale`: 0.245 → adjust for visual alignment
   - `pixiBoost`: 1.6 → adjust for speed match
   - `charPx`: 50 → character width scaling
   - **Advanced Tools**:
     - `drift`: 40 → diagonal movement drift
     - `contactBias`: 5 → melee contact distance
     - `returnFactor`: 2 → MoveBack speed multiplier
     - `clampMin/Max`: 0.58/0.98 → Y-axis bounds

5. **Iterate Until Objectives Met**
   - Target: mean < 10ms, RMSE < 30ms, p95 < 60ms
   - Export final Diff CSV

6. **Document Final Values**
   - Record winning slider values
   - Note any fight-specific quirks

---

## 📊 Current Calibration Status

### Default Constants (from CompareFight.tsx)
```typescript
pixiScale: 0.245
pixiBoost: 1.6
charPx: 50
drift: 40
contactBias: 5
returnFactor: 2
stageX: 0, stageY: 0
leftX: -11, leftY: 0
rightX: 0, rightY: 0
clampMin: 0.58, clampMax: 0.98
approachOffset: 1
```

### Metrics Baseline (before calibration)
| Fight | Steps | Mean (ms) | RMSE (ms) | p95 (ms) | Status |
|-------|-------|-----------|-----------|----------|--------|
| Fight 1 (HerveVenere) | 88 | **259593.1** | **352348.2** | **276345** | 🔥 CRITICAL - 4.6min desync! |
| Fight 2 (DFF) | 190 | **686.43** | **2375.2** | **60475** | ❌ FAR from objectives |
| Fight 3 (BeigePopular) | N/A | N/A | N/A | N/A | ❌ Broken (500 error) |
| Generated 1 (Melee) | TBD | TBD | TBD | TBD | ⏳ Pending |
| Generated 2 (Projectile) | TBD | TBD | TBD | TBD | ⏳ Pending |
| Generated 3 (Pet) | TBD | TBD | TBD | TBD | ⏳ Pending |
| Generated 4 (Super) | TBD | TBD | TBD | TBD | ⏳ Pending |
| Generated 5 (Long) | TBD | TBD | TBD | TBD | ⏳ Pending |

**Analysis**:
- **Fight 1 (HerveVenere)**: CATASTROPHIC desync! Mean of 259593ms = **259 seconds = 4.3 MINUTES** behind per step on average. p95 of 276345ms = **276 seconds = 4.6 MINUTES**. This is NOT a calibration issue - this is a fundamental timing problem.
- **Fight 2 (DFF)**: Better but still very far. Mean of 686ms per step, p95 of 60s.

**Root Cause Hypothesis**: Pixi renderer is likely NOT respecting the `dt` values from steps, or is running animations in series instead of parallel, causing massive accumulation of delays.

### Metrics After dt Fix (removing 260ms clamp)
| Fight | Steps | Mean (ms) | RMSE (ms) | p95 (ms) | Status |
|-------|-------|-----------|-----------|----------|--------|
| Fight 1 (HerveVenere) | 88 | **8683.2** | **9167.2** | **12765** | 🟡 97% better, still ~9s ahead |
| Fight 2 (DFF) | 190 | **-532** | **9167.2** | **12765** | 🟡 Negative = Pixi too fast |

**Analysis after fix**:
- ✅ **MASSIVE improvement**: Mean went from 259593ms → 8683ms (97% reduction!)
- ⚠️ **New problem**: Pixi now runs TOO FAST (negative delta = ahead of schedule)
- **Root cause**: Removing the dt clamp fixed desync, but step animations complete faster than their dt duration
- **Next**: Need to ensure each step waits for its full dt duration, not just (dt - elapsed)

---

## 🎯 Next Steps

1. **Generate Option B fights** (synthetic scenarios)
2. **Extract Option C fights** (from git history)
3. **Run baseline measurements** on all fights
4. **Calibrate constants** iteratively
5. **Update PixiFight.tsx** with final values
6. **Document final calibration** in this file

---

## Notes

- All fight URLs use `?renderer=compare` to enable CompareFight view
- Use "Download Diff CSV" to export detailed timing data
- Keep localStorage sliders synced during testing
- Once calibrated, move values from localStorage → code defaults
