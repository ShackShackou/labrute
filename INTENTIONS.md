# Intentions (SHACKERSV10)

Objectif
- Rester 100% fidèle au gameplay/mécaniques/RNG/MMO du projet officiel.
- Remplacer uniquement le rendu des combats par Phaser + Spine 2D.
- S’appuyer sur le backend officiel lancé en local; SHACKERSV10 reste un viewer autonome.

Principes
- Déterminisme total: le client ne calcule rien, il REJOUE les `steps` du serveur.
- Parité visuelle: mêmes temps forts (hitstop/camera/poses/z‑order/timings).
- Maintenabilité: mapping StepType → actions Phaser, assets Spine modulaires.
- Non‑régression: comparaison automatique avec le viewer Pixi.

État actuel
- Viewer Vite/Phaser prêt (dev 5199, preview 5200) avec proxy → http://localhost:9000.
- `?fight=UUID` et `?brute=NAME` (auto‑résolution dernier combat via `/api/log/list/:name`).
- Steps de base rejoués; cadence via `dt` si disponible.
- HUD minimal: barres HP + dégâts flottants; tolérance au format (`steps`/`fighters` string ou array).

Décisions
- On part de l’Option A (garder le core officiel intact).
- Les patchs côté repo officiel se limitent à:
  - cookies localhost (host‑only + SameSite=Lax)
  - Fetch résilient (refresh CSRF si 403)

Prochaines étapes
1) Poses Spineboy: idle/walk/attack/hit/death.
2) Ombres, échelle profondeur, z‑order.
3) Hitstop/camera shake paramétrés.
4) Indicateurs MISS/BLOCK/DODGE + FX simples.
5) Steps avancés (Net/Hypnosis/Bomb/Hammer… visuels only).
6) QA/diff vs Pixi, puis switch de renderer dans le client officiel.

