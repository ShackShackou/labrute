# Intentions (SHACKERSV10)

Objectif
- Rester 100% fidele au gameplay/mecaniques/RNG/MMO du projet officiel.
- Utiliser Pixi 8 + Spine 2D comme unique renderer de combats.
- S'appuyer sur le backend officiel lance en local; SHACKERSV10 reste un viewer autonome.

Principes
- Determinisme total: le client ne calcule rien, il rejoue les steps du serveur.
- Parite visuelle: memes temps forts (hitstop/camera/poses/z-order/timings).
- Maintenabilite: mapping StepType -> actions Pixi, assets Spine modulaires.
- Non-regression: comparaison automatique avec le viewer historique.

Etat actuel
- Viewer Vite/React + Pixi 8 + Spine operationnel (dev 5199, preview 5200) avec proxy -> http://localhost:9000.
- ?fight=UUID et ?brute=NAME (auto-resolution dernier combat via /api/log/list/:name).
- Steps de base rejoues; cadence via dt si disponible.
- HUD minimal: barres HP + degats flottants; tolerance au format (steps/ighters string ou array).

Decisions
- On part de l'option A (garder le core officiel intact).
- Les patchs cote repo officiel se limitent a:
  - cookies localhost (host-only + SameSite=Lax)
  - Fetch resilient (refresh CSRF si 403)

Prochaines etapes
1) Poses Spine: idle/walk/attack/hit/death.
2) Ombres, echelle profondeur, z-order.
3) Hitstop/camera shake parametrables.
4) Indicateurs MISS/BLOCK/DODGE + FX simples.
5) Steps avances (Net/Hypnosis/Bomb/Hammer...) visuels uniquement.
6) QA/diff vs viewer officiel, puis switch definitif dans le client principal.
