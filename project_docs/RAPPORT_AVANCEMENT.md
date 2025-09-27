# Rapport d’avancement — LaBrute (Pixi/Spine)

## But du projet
Reproduire fidèlement (parité « pixel‑perfect ») le rendu des combats de LaBrute (Flash) dans une stack moderne: client React + Pixi v8/Spine v8, serveur Node/Express + Prisma. L’objectif est d’égaler les chorégraphies officielles, synchroniser HUD/FX/chronos, et poser une base maintenable (assets Spine, tests, QA) pour les features produit (auth, tournois, prestiges).

## Réalisé (technique et parité)
- Renderer Pixi (`client/src/components/Arena/PixiFight.tsx`)
  - Traces parité: `pixiGetRngTrace()` et `pixiGetEventTrace()` (+ flags `?pixiLogRng=1&pixiLogEvents=1`).
  - StepTypes: implémentation Leave (1) et Trash (3). Reindex cohérent (Bomb=13, Hammer=11, Poison=12, Hypnotise=14, Haste=32, Treat=33, SkillExpire=29).
- Trap (28): filet attaché au torse, suit la cible en continu; release contrôlé sur Treat (33), DropShield (34), Sabotage (27).
- Heal (6): affichage du +X corrigé, barre HP mise à jour immédiate (pets compris). Regeneration (35): suppression du flash blanc → effet vert local.
- Buffs/HUD persistants: icônes 🩸 Vampirism (31), 🛡 DropShield (34), ⚡ Haste (32), 🌀 Hypnosis (14). Effets HUD: anneau bleu Haste, overlay violet Hypnosis (pulse), clear sur SkillExpire (29).
- Tirs/Throw (25): projectiles animés (arc + rotation + traînée) jusqu’à la cible.
- Dégâts couleur: logique alignée à l’officiel (rouge uniquement sur coup critique; blanc sinon).
- Barre HP: rendu visible même pour très petits soins (arrondi côté heal + “spark” vert minimal).
- Documentation: `project_docs/StepType_Renderer_Tracking.md` mis à jour (statut [~] → [x] progressif), `AGENTS.md` (guidelines).

## État actuel (démo)
- Lancer: `yarn dev`, ouvrir un combat avec `?renderer=pixi`.
- Comparaison: vue Compare + Official Trace/Auto; activer `?pixiLogRng=1&pixiLogEvents=1`, puis `window.pixiGetRngTrace()` / `window.pixiGetEventTrace()`.
- Comportements visibles: filet collé + release au bon StepType; soins visibles; plus de flash blanc; icônes HUD actives.

## Reste à faire
- Parité StepType (copier la choré officielle, passer [~] → [x])
  - Finesse timings/FX: Hit variants, Bomb, Hypnosis swirl, Resist/Survive, Block/Evade, Throw/Eat/Equip/Disarm/Counter, End.
  - Attachments Spine: sockets main droite/gauche pour Equip/Throw/Disarm/DropShield.
- Pipeline assets Spine
  - Intégrer squelettes/atlas officiels (armes/boucliers/pets/FX), documenter le mapping; script de vérification (atlas/JSON/PNG).
- HUD & UX
  - Timers/jauges sur icônes, clear supplémentaires (autres SkillExpire), micro‑animations manquantes (shield break, etc.).
- Replays « or » (validation)
  - Sélectionner 3–5 combats emblématiques, figer les JSON, comparer RNG/Events vs officiel, corriger jusqu’au pixel‑perfect; mise à jour du tracker.
- QA & tests
  - Unitaires: formules dégâts/XP/loot; intégration combat (replay, drift traces); couverture CI.
- Roadmap produit
  - Backend (auth, tournois, prestiges…), cf. `project_docs/project_roadmap.md` / `current_task.md`.

## Prochaines étapes proposées
1) Figer les « replays or » et itérer StepType par StepType jusqu’au [x].
2) Intégrer les assets Spine officiels + sockets (Equip/Throw/Disarm).
3) Étendre tests (unitaires + intégration) et brancher SkillExpire manquants côté HUD.
