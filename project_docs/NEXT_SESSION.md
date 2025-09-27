PROCHAINE SESSION - RÉSUMÉ ENVIRONNEMENT

- Objectif principal: Cloner intégralement l’expérience LaBrute officielle dans Shackers avec Pixi 8 + Spine, en reproduisant toutes les formules, RNG et fonctionnalités (création de compte, personnages, tournois, prestiges, etc.).
- Base de données: Postgres (Docker) sur `localhost:55432`, DB `labrute`.
  - Migrations + seed: Prisma appliqués, base peuplée (~600 brutes).
- Backend: `http://localhost:9000` (CSRF OK).
- Frontend: `http://localhost:3000`.
- OAuth local: EternalTwin démarré (auth locale prête).

Lire ce bloc en premier pour relancer rapidement l’environnement.
