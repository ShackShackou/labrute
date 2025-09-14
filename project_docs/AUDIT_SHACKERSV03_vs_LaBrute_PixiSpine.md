# Audit comparatif EXHAUSTIF : ShackersV03 ↔ LaBrute (clonage combats, Pixi 8 + Spine 2D)

Ce document consolide l’audit des deux dépôts (LaBrute local de référence et ton viewer ShackersV03 Pixi v8 + Spine 2D) pour valider le clonage fidèle des combats. Il fournit la matrice de parité, les points de RNG, la cartographie de la boucle de combat, un plan d’implémentation Spine, une suite de tests minimale, les risques et des « golden rules » à respecter.

## 1) Résumé exécutif
- Verdict: OUI, clonage fidèle possible avec Pixi v8 + Spine 2D.
- Combat 100% côté serveur: génération des steps déterministes; le client ne fait que rejouer (replay).
- RNG: combat non seedé (Math.random) mais steps stockés ⇒ replays déterministes; randomSkill/Weapon du jour seedés (Rand + date).
- Parité viewer: le mapping StepType → rendu existe côté client (renderer Flash/Pixi legacy) et partiellement côté Spine (PixiFight).
- 3 risques majeurs: 1) Couverture animations Spine (armes/pets/skills), 2) Attachments + events de contact, 3) Perf (taille assets/batching).
- 3 actions prioritaires: 1) Étendre la state machine Spine pour tous les StepType, 2) Système d’attachments armes/pets + events timeline, 3) Harness de replays (golden traces) avec diff strict HP/ordre des steps.

## 2) Matrice de parité
| Mécanique | LaBrute (fichiers/fonctions) | ShackersV03 (fichiers/fonctions) | Parité | Écart précis | Action corrective |
| --------- | ---------------------------- | -------------------------------- | ------ | ------------ | ----------------- |
| RNG | `core/src/utils/randomBetween.ts` (seed option Rand), `core/src/utils/weightedRandom.ts`, `server/src/utils/fight/fightMethods.ts` multiples `Math.random`, `server/src/dailyJob.ts` 1255–1268 (modifiers) | Viewer: replay pur, pas de RNG | Oui | RNG serveur non seedé pour combats, steps persistés | Aucun côté viewer (replay déterministe) |
| RNG seed (randomSkill/Weapon) | `core/src/brute/getTempSkill.ts`, `core/src/brute/getTempWeapon.ts` (Rand + `dayjs.utc()`), `randomBetween(..., generator)` | Rejoue steps | Oui | n/a | n/a |
| Boucle de combat | `server/src/utils/fight/generateFight.ts` (boucle 1..2000), `fightMethods.ts` `playFighterTurn` | Client rejoue steps: `client/src/utils/fight/setupFight.ts` switch StepType 539–678; `PixiFight.tsx` partiel | Partiel | PixiFight ne couvre pas tous les StepType/state machine | Étendre PixiFight pour tous les StepType |
| Timeline/événements | Enum `StepType` `core/src/types.ts` | `client/src/utils/fight/*.ts` implémentent la plupart des steps (legacy pixi) | Oui | PixiFight partiel | Porter mapping existant vers Spine |
| Formules dégâts/crits | `server/src/utils/fight/getDamage.ts` | Viewer applique dégâts depuis steps | Oui | n/a | n/a |
| Esquive/parade/disarm/etc. | `fightMethods.ts` (block/evade/disarm/reversal/deflect) | `client/src/utils/fight/{block,evade,disarm}.ts` + switch | Oui | n/a | n/a |
| Vitesse/déplacements | `getFighters.ts` (initiative jitter), `increaseInitiative` | `client/src/utils/fight/{moveTo,moveBack}.ts`, `utils/repositionFighters.ts` | Oui | Anim Spine run/walk à compléter | Ajouter états run/walk + offsets |
| Armes | `core/src/brute/weapons.ts`, `randomlyDrawWeapon` | `client/src/utils/fight/{equip,updateWeapons,sabotage}.ts` | Oui | Attach Spine manquant | Attach armes sur bones Spine |
| Pets | `core/src/brute/pets.ts`, spawn `getFighters.ts` | Steps communs OK; rigs pets manquants en Spine | Partiel | Rigs/anim pets | Créer rigs pets + mapping |
| Compétences | `core/src/brute/skills.ts`, activation `randomlyGetSuper` | `client/src/utils/fight/*` (flashFlood, hammer, hypnosis, …) | Oui | États Spine spécifiques manquants | Ajouter états/animations dédiés |
| IA | `fightMethods.ts` heuristiques (focus, counter, hypnosis low HP…) | Viewer: replays | Oui | n/a | n/a |
| Données & config | TS tables: weapons/skills/pets/bosses + `constants.ts` | Chargées implicitement via steps | Oui | n/a | n/a |
| Réseau/Autorité | Serveur autoritaire: `generateFight.ts`, API `controllers/Fights.ts` | Client `FightView.tsx`/`FightComponent.tsx` | Oui | n/a | n/a |
| Pixi + Spine | StepType→rendu legacy OK, `PixiFight.tsx` embryon Spine | Phaser obsolète | Partiel | États/attachments Spine à généraliser | Implémenter SM Spine + attachments |
| Performance | Calculs serveur; assets à optimiser | Pixi v8 + spine runtime OK | Partiel | Pas d’optimizations systématiques Spine | Batching/atlas/pooling |
| Licence | LICENSE CC BY-NC-SA 4.0 (racine) | Spine runtime OK; assets à valider | Partiel | Non‑commercial | Confirmer compat assets |

## 3) Checklist RNG (seed, points d’appel, déterminisme)
- Source: `Math.random` dans le moteur combat serveur: exemples `server/src/utils/fight/fightMethods.ts` (ties initiative l.~222, block l.~1542, evade l.~1585, counter l.~1493, sabotage l.~1751, combos l.~1921, throws l.~2269 etc.).
- RNG seedable util: `core/src/utils/randomBetween.ts` (param `generator?: Rand`).
- Seed journalier: `core/src/brute/getTempSkill.ts`, `getTempWeapon.ts` (Rand(`${brute.id}-random{Skill|Weapon}-${YYYY-MM-DD}`) + `randomBetween`), `server/src/dailyJob.ts` (modifiers journaliers via `weightedRandom`).
- Déterminisme replays: steps JSON persistés en DB; `server/src/controllers/Fights.ts` retourne le fight (fighters/steps) pour replay client.

## 4) Boucle de combat (ASCII)
```
Pré-fight:
  getFighters() → DetailedFighter[], steps Arrive pour chaque fighter (sauf backups)
  1v1: spy() → steps Spy
  saboteur() → marquage sabotage éventuel

while (!loser && turn < 2000):
  orderFighters() par initiative (aléa si égalité)
  initiative courante = 1er; overtime si turn > 1000
  playFighterTurn():
    expire trap/stun, arrive/leave backups, regeneration/fastMetabolism
    randomlyGetSuper → activateSuper (peut consommer le tour)
    attackType = melee|thrown
    opponent = getRandomOpponent()
    melee:
      counterAttack? → Move(c=1) + Counter + startAttack(opponent→fighter) sinon startAttack(fighter→opponent)
      block/evade/dropShield/disarm/sabotage → registerHit (Hit/FlashFlood/Hammer/Poison/Bomb/Vampirism/Haste)
      determination/combos (répétitions) + MoveBack + DOT poisons
    thrown:
      boucles de lancers, deflect projectile ping‑pong, keepWeapon/hideaway
  checkDeaths() → Death; set winner/loser si équipe éteinte

Fin:
  steps End(winner, loser), persist fight (fighters réduits, steps JSON)
```
Réfs: `server/src/utils/fight/generateFight.ts`, `server/src/utils/fight/fightMethods.ts` (notamment `playFighterTurn`, `attack`, `randomlyGetSuper`, `randomlyDrawWeapon`).

## 5) Features manquantes côté ShackersV03 (Spine)
- États d’animation Spine exhaustifs: idle, walk/run, attack variants (fist/slash/estoc/whip), prepare-throw/throw, block, evade, hit/crit, grab/trapped, drink/monk, steal/stolen, equip, trash, eat, win, death, skills (cryOfTheDamned/hypnosis/vampirism/haste/treat/flashFlood/hammer).
- Attachments Spine: armes (types/classes → sockets main), pets (bear/panther/dogs), events timeline de contact pour caler impacts/sons.
- Machine d’états/mixings cohérente: priorités, interruptions (counter/reversal/trap), transitions (intro/outro).
- Distances & offsets de collision (approachOffset/contactBias/returnFactor) à finaliser.
- VFX/SFX mappés StepType (portage de `client/src/utils/fight/utils/*` vers Spine).
- Perf assets (atlases fusionnés, compression, pooling) et limitation des backgrounds vidéos par défaut.

## 6) Plan d’implémentation Pixi+Spine (10–15 étapes)
1. Wrapper `AnimationFighterSpine` (états, `setAnimation`, `waitForEvent`) analogue à l’existant legacy.
2. State machine StepType → état Spine (basé sur `core/src/constants.ts` Animations) pour `setupFight`.
3. Attachments armes: bones `weapon_r/l`, atlas armes, mapping `WeaponAnimation` → animations/poses.
4. Pets Spine: rigs (bear, panther, dogs), sockets master, spawn/leave.
5. Porter le switch StepType de `client/src/utils/fight/setupFight.ts` (539–678) vers le wrapper Spine.
6. Déplacements: `moveTo`/`moveBack` tween du container Spine, `contactBias`/`returnFactor`.
7. Events de contact: ajouter événements Spine “hit:start|connect|end” pour caler `Hit` + SFX et knockback.
8. Compétences actives: implémenter `skillActivate/Expire` en animations dédiées (monk/drink/steal/net/bomb/cry/hypnosis/flashFlood/haste/treat).
9. Throws: `prepare-throw` → détacher sprite arme → trajectoire → `throw` → reattach/keep.
10. Counter/Reversal: interruption track0, StepType.Counter (no‑op visuel rapide), reposition si reach change.
11. HUD/HP: barres HP ancrées à la racine Spine, update sur Hit/Poison/Vampirism/Haste/Regeneration.
12. VFX/SFX: porter `playVFX.ts`, sonorisation `@pixi/sound` sur events.
13. Perf: atlas fusionnés, compression, pooling objets, désactiver debug par défaut.
14. Hooks debug: traces vectorielles optionnelles, export “golden traces”.
15. Intégration UI: `FightView.tsx`/`useRenderer.tsx` pour basculer Spine/legacy.

## 7) Suite de tests minimale
Unit (core/serveur):
- RNG seeded: `getTempSkill/Weapon` (même sortie brute/date; mock de date/seed).
- Formules `getDamage`: distributions attendues, crits (`FightStat.CRITICAL_*`).
- IA: `block/evade/reversal/counter/deflect` bornes et effets de skills (`survival`, `balletShoes`).
- Tirage arme: `randomlyDrawWeapon` respecte `NO_WEAPON_TOSS` et `FightModifier.drawEveryWeapon`.

Intégration (serveur):
- Génération combats: steps non vides, `End` présent, winner/loser cohérents.
- Modifiers: `dailyJob.handleModifiers` (spawn ratio, persistence, expiration via `ServerState`).

E2E viewer (Pixi Spine):
- Rejouer un set d’IDs de combats; asserter ordre des steps, HP finaux des brutes principales, présence des animations attendues par StepType.
- Golden traces: exporter (positions, anim, timings) et comparer à une tolérance.

## 8) Risques & contournements
- Techniques: couverture complète des animations Spine. Mitigation: livrer par paliers (melee → throws → skills → pets).
- Sync contact/dégâts: besoin d’événements précis. Mitigation: events Spine + fallback timing fixe.
- Perf assets: tailles atlas. Mitigation: atlases par familles, compression, pooling, limiter vidéos BG.
- Licence: repo CC BY‑NC‑SA 4.0 (racine `LICENSE`), usage non‑commercial. Spine editor nécessite licence; assets d’exemple (spineboy) ok seulement pour tests.

## 9) Références (exemples précis)
- Combat loop & steps: `server/src/utils/fight/generateFight.ts`, `server/src/utils/fight/fightMethods.ts` (`playFighterTurn` ~2009+, `attack`, `orderFighters`).
- Formules: `server/src/utils/fight/getDamage.ts`.
- Fighters init: `server/src/utils/fight/getFighters.ts` (initiative jitter, pets/backups, modifiers `getTemp{Weapon,Skill}`).
- RNG utils: `core/src/utils/{randomBetween,randomItem,weightedRandom}.ts`.
- Tables: `core/src/brute/{weapons,skills,pets}.ts`, constantes `core/src/constants.ts`, `core/src/types.ts` (enum StepType + interfaces Steps).
- API combats: `server/src/controllers/Fights.ts` (GET fight, create fight).
- Modifiers journaliers: `server/src/dailyJob.ts` (handleModifiers 1234–1278) + `server/src/utils/ServerState.ts`.
- Viewer Pixi legacy: `client/src/utils/fight/{setupFight.ts, *.ts}`, rendu Pixi: `client/src/components/Arena/PixiFight.tsx` (Spine embryon), bascule renderer `client/src/hooks/useRenderer.tsx`.

## 10) Golden Rules (à respecter)
1. Ne jamais modifier la logique serveur de combat: le serveur est autoritaire; le viewer rejoue uniquement les steps.
2. Aucune RNG côté client: tout comportement visuel doit découler exclusivement des steps reçus.
3. Parité stricte StepType → rendu: chaque StepType de `core/src/types.ts` doit avoir un rendu correspondant 1:1.
4. Ne rien inférer côté client: s’il manque un step, c’est un bug serveur ou un cas à corriger serveur, pas côté viewer.
5. Non‑régression: valider contre le viewer Pixi legacy via golden traces (HP/ordre/timing compatibles).
6. Respect des timings: les animations ne doivent pas altérer l’ordre/tempo logique (seulement l’habillage visuel).
7. Versions runtime figées: Spine 4.2.x (`@esotericsoftware/spine-pixi-v8@^4.2.76`), Pixi v8 identique partout.
8. Assets sous licence: vérifier compatibilité (CC BY‑NC‑SA) et ne pas embarquer d’assets non conformes.
9. Performance d’abord: batching/atlas/pooling; backgrounds animés facultatifs et désactivés par défaut.
10. Observabilité: conserver des hooks de traces (positions, états) pour diagnostiquer écarts et reproduire.

## 11) Verdict & Bloqueurs
**VERDICT : OUI pour clonage fidèle dans Pixi+Spine**

**BLOQUEURS**
- Assets/états Spine complets (brutes/pets/armes/skills).
  - Action: lister/produire rigs + animations selon `core/src/constants.ts` et `WeaponAnimation`.
- Attachments Spine (armes/pets) + events de contact/hitbox.
  - Action: définir bones/sockets, gérer (dé)attache, ajouter events “contact”.
- Portage complet du mapping StepType vers Spine.
  - Action: étendre `PixiFight.tsx` + créer `AnimationFighterSpine`, porter `client/src/utils/fight/*` logique d’animation.

