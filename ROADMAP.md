# Roadmap vers 100% fidélité (Option A)

Dernière mise à jour: maintenant

Phase 0 — Setup propre (Terminé)
- [x] Créer viewer Vite + Phaser + proxy API, scripts dev/preview.
- [x] Assets Spineboy importés (json/atlas/png).
- [x] Docs initiales (README, INTENTIONS, ROADMAP).

Phase 1 — Replays de base (En cours)
- [x] Mapping StepType minimal → Move/AttemptHit/Hit/MoveBack/Death/End.
- [x] Paramètres `?fight=UUID` et `?brute=NAME` (auto‑résolution via `/api/log/list/:name`).
- [x] Parsing tolérant des payloads (`steps`/`fighters` string ou array).
- [x] Ajout HUD minimal: barres HP + dégât flottant; cadence via `dt` si présent.

Phase 2 — Spine et posing (À faire)
- [ ] Poses Spineboy: idle, walk, attack, hit, death (mapping propre).
- [ ] Échelle perspective + z‑order cohérent + ombres dynamiques.

Phase 3 — Parité visuelle (À faire)
- [ ] Timings par step (dt), hitstop plus précis, camera shake par intensité.
- [ ] Indicateurs MISS/BLOCK/DODGE + flashes/FX simples.

Phase 4 — Couverture des steps (À faire)
- [ ] Net, Hypnosis, Bomb, Hammer, Vampirism, Haste, Treat… (visuels only, pas de logique client).

Phase 5 — QA & Diff (À faire)
- [ ] Lot de replays réels, instrumentation d’évènements, diff auto vs viewer Pixi.
- [ ] Ajustements jusqu’à parité visuelle acceptable.

Phase 6 — Intégration client officiel (À faire)
- [ ] Commutateur de renderer (Pixi ↔ Phaser) sans changer l’API.

Livrables clés
- `src/viewer/*` (mapping), `public/assets/spine/*`, scripts de test.
- Doc: README, INTENTIONS, ROADMAP mis à jour à chaque itération.

Prochaines tâches (ordre court)
1) Mapper les 5 poses Spineboy + refactor anim helpers.
2) Stabiliser HUD HP (suiveur sur mouvements) + indicateurs MISS/BLOCK/DODGE.
3) Hitstop/camera shake paramétrés par type de step.
4) Support visuel Net/Hypnosis/Bomb/Hammer.
5) Harness de comparaison replays (Pixi vs Phaser) et rapport.

