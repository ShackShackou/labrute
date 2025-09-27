# StepType ↔ Renderer Tracking

Legend: [ ] = not implemented in Spine renderer, [~] = partial/prototype (needs parity), [x] = parity validated.

| # | StepType | Legacy renderer entry | Spine status | Current PixiFight notes |
|---|----------|-----------------------|--------------|-------------------------|
| 0 | Saboteur | client/src/utils/fight/saboteur.ts | [~] prototype | Case StepType.Saboteur wired in client/src/components/Arena/PixiFight.tsx:2646; drops weapon placeholder but no Spine attachment yet. |
| 1 | Leave | client/src/utils/fight/leave.ts | [~] prototype | Case 1 added in client/src/components/Arena/PixiFight.tsx: exits off-screen with walk tween; removes pet spine + HUD. |
| 2 | Arrive | client/src/utils/fight/arrive.ts | [~] prototype | Case 2 handles fighter/pet arrival jumps; needs parity review. |
| 3 | Trash | client/src/utils/fight/trash.ts | [~] prototype | Case 3 added: drops current weapon with backward/ground trajectories, updates HUD and clears tracking. |
| 4 | Steal | client/src/utils/fight/steal.ts | [~] prototype | Case handles weapon transfer in client/src/components/Arena/PixiFight.tsx:3173; needs Spine rig + HUD polish. |
| 5 | Trap | client/src/utils/fight/trap.ts | [~] prototype | Net logic present in client/src/components/Arena/PixiFight.tsx:3211; visuals still placeholder and lacks Spine net. |
| 6 | Heal | client/src/utils/fight/heal.ts | [~] prototype | Case 6 adds particles + HP update; compare to legacy timings. |
| 7 | Resist | client/src/utils/fight/resist.ts | [~] prototype | Aura FX implemented in client/src/components/Arena/PixiFight.tsx:2761 but missing official choreography and status sync. |
| 8 | Survive | client/src/utils/fight/survive.ts | [~] prototype | Status flag + HUD update in client/src/components/Arena/PixiFight.tsx:2791; needs parity on thresholds and visuals. |
| 9 | Hit | client/src/utils/fight/hit.ts | [~] prototype | Case 9 covers basic hit FX/HP; weapon sync still WIP. |
| 10 | FlashFlood | client/src/utils/fight/flashFlood.ts | [~] prototype | Case 10 builds placeholder water FX; needs official choreography. |
| 11 | Hammer | client/src/utils/fight/hammer.ts | [~] prototype | Case 11 triggers simple hammer slam + particles. |
| 12 | Poison | client/src/utils/fight/hit.ts (Poison branch) | [~] prototype | Case 12 reuses hit flow; poison specific cues incomplete. |
| 13 | Bomb | client/src/utils/fight/bomb.ts | [~] prototype | Explosion placeholder added in client/src/components/Arena/PixiFight.tsx:3272; awaiting Spine projectile + damage timing passes. |
| 14 | Hypnotise | client/src/utils/fight/hypnotise.ts | [~] prototype | Rewired to StepType 14 with swirl and HUD icon on target(s). |
| 15 | Move | client/src/utils/fight/moveTo.ts | [~] prototype | Case 15 manages movement; still tuning diagonals/spacing. |
| 16 | Eat | client/src/utils/fight/eat.ts | [~] prototype | Healing text + HP refresh live in client/src/components/Arena/PixiFight.tsx:2820; animations still temporary. |
| 17 | MoveBack | client/src/utils/fight/moveBack.ts | [~] prototype | Case 17 handles retreat; verify easing vs legacy. |
| 18 | Equip | client/src/utils/fight/equip.ts | [~] partial | Placeholder weapon/shield graphics now follow fighters; needs official Spine attachments and rig sync. |
| 19 | AttemptHit | client/src/utils/fight/attemptHit.ts | [~] prototype | Case 19 handles pre-hit approach; confirm counter/melee gaps. |
| 20 | Block | client/src/utils/fight/block.ts | [~] prototype | Case 20 shows block text/FX; needs shield/weapon sync. |
| 21 | Evade | client/src/utils/fight/evade.ts | [~] prototype | Case 21 adds dodge tween + text; refine arcs vs official. |
| 22 | Sabotage | client/src/utils/fight/sabotage.ts | [~] prototype | Case 22 fires placeholder projectile; add weapon-specific rigs. |
| 23 | Disarm | client/src/utils/fight/disarm.ts | [~] prototype | Case 23 floats text + weapon drop stub. |
| 24 | Death | client/src/utils/fight/death.ts | [~] prototype | Case 24 fades fighter; missing HUD updates/loot drop. |
| 25 | Throw | client/src/utils/fight/throwWeapon.ts | [~] prototype | Case 25 tosses placeholder projectile; align with weapon rigs. |
| 26 | End | client/src/utils/fight/end.ts | [~] prototype | Case 26 triggers trace toggles; final screen effects TBD. |
| 27 | Counter | client/src/utils/fight/setupFight.ts (no-op) | [~] prototype | Case 27 only shows "SABOTAGED!" text; needs counter animation + correct label. |
| 28 | SkillActivate | client/src/utils/fight/skillActivate.ts | [~] prototype | Case 28 toggles HUD text; add actual skill visuals. |
| 29 | SkillExpire | client/src/utils/fight/skillExpire.ts | [~] prototype | Case 29 displays expiry text; ensure buff removal cues. |
| 30 | Spy | client/src/utils/fight/spy.ts | [~] prototype | Case 30 uses text placeholder; add spy FX & HUD update. |
| 31 | Vampirism | client/src/utils/fight/vampirism.ts | [~] prototype | Case 31: FX + HP update + HUD icon (🩸); animations to refine. |
| 32 | Haste | client/src/utils/fight/haste.ts | [~] prototype | Case 32 applies glow text; missing buff tracker + speed visuals. |
| 33 | Treat | client/src/utils/fight/treat.ts | [~] prototype | Case 33 still displays "POISONED!" placeholder; replace with treat heal FX. |
| 34 | DropShield | client/src/utils/fight/dropShield.ts | [~] prototype | Shield drop + HUD icon (🛡) + releases Trap. Spine attachment pending. |
| 35 | Regeneration | client/src/utils/fight/regenerate.ts | [~] prototype | Case 35 uses flash overlay; need regen HUD + cooldowns. |

At-a-glance:
- 2/36 steps still missing any Spine coverage (Leave, Trash).
- 2/36 steps flagged as wiring issues (status "[~]" : Hypnotise case 99999, Equip tracker only).
- Newly wired prototypes (Saboteur, Steal, Trap, Resist, Survive, Bomb, Eat, DropShield) require Spine assets, attachment logic, and HUD parity.
- Priority gaps: implement Leave/Trash and bring the new prototypes up to official choreography with deterministic FX.
