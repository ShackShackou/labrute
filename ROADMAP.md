# Roadmap vers 100% fidelite (Option A)

Derniere mise a jour: maintenant

Phase 0 - Setup propre (termine)
- [x] Creer viewer Vite + React + Pixi 8 + Spine + proxy API.
- [x] Importer assets Spineboy (json/atlas/png).
- [x] Documenter les choix (README, INTENTIONS, ROADMAP).

Phase 1 - Replays de base (en cours)
- [x] Mapping StepType minimal -> Move/AttemptHit/Hit/MoveBack/Death/End.
- [x] Parametres ?fight=UUID et ?brute=NAME (auto-resolution via /api/log/list/:name).
- [x] Parsing tolerant des payloads (steps/ighters string ou array).
- [x] HUD minimal: barres HP + degats flottants; cadence via dt si present.

Phase 2 - Spine et posing (a faire)
- [ ] Poses Spine: idle, walk, attack, hit, death (mapping propre).
- [ ] Echelle perspective + z-order coherents + ombres dynamiques.

Phase 3 - Parite visuelle (a faire)
- [ ] Timings par step (dt), hitstop precis, camera shake par intensite.
- [ ] Indicateurs MISS/BLOCK/DODGE + flashes/FX simples.

Phase 4 - Couverture des steps (a faire)
- [ ] Net, Hypnosis, Bomb, Hammer, Vampirism, Haste, Treat, etc. (visuels only, pas de logique client).

Phase 5 - QA & diff (a faire)
- [ ] Lot de replays referents, instrumentation d'evenements, diff auto vs renderer historique.
- [ ] Ajustements jusqu'a parite visuelle acceptable.

Phase 6 - Integration client officiel (a faire)
- [ ] Commutateur definitif vers Pixi 8 + Spine dans le client.

Livrables cles
- client/src/components/Arena/PixiFight.tsx, client/public/backgrounds/*, scripts de test.
- Documentation tenue a jour.

Prochaines taches (ordre court)
1) Mapper les poses Spine + refactor anim helpers.
2) Stabiliser HUD HP (suivi des mouvements) + indicateurs MISS/BLOCK/DODGE.
3) Hitstop/camera shake parametrables par step.
4) Support visuel Net/Hypnosis/Bomb/Hammer.
5) Harness de comparaison replays (Pixi vs officiel) et rapport.
