Revenir a l'etat pre-Pixi v8 (guide rapide)

Objectif
- Cette branche contient l'introduction de Pixi v8 + Spine pour le renderer combat (?renderer=pixi).
- Voici comment revenir a l'etat pre-Pixi v8 si besoin (renderer historique).

Options de repli sans changer le code
- Renderer historique (Pixi v6): n'ajoute pas ?renderer=pixi (la vue par defaut charge le renderer existant).

Revenir au code pre-Pixi v8 avec Git (recommande)
- Deux tags sont crees:
  - pixi-v8-intro: commit avec le renderer Pixi v8 + Spine.
  - pre-pixi-v8: commit juste avant l'introduction de Pixi v8.

Commandes
- Revenir completement avant Pixi v8:
  - git checkout pre-pixi-v8
  - ou: git reset --hard pre-pixi-v8
- Revenir sur la version Pixi v8:
  - git checkout pixi-v8-intro

Revenir manuellement sans Git (si necessaire)
1) client/package.json:
   - Remplacer "pixi.js": "^8.x" par "pixi.js": "^6.5.10".
   - Supprimer la dependance "pixi-legacy".
   - Supprimer "@esotericsoftware/spine-pixi-v8".
2) Imports sources:
   - Dans client/src/**, remplacer tous les rom 'pixi-legacy' par rom 'pixi.js'.
3) Fichiers a supprimer/editer:
   - Supprimer client/src/components/Arena/PixiFight.tsx.
   - Editer client/src/views/FightView.tsx pour enlever la branche ?renderer=pixi.
4) Reinstaller et relancer:
   - yarn install --mode=skip-build
   - yarn dev

Verifications rapides
- http://localhost:3000/fight/UUID (sans ?renderer=pixi) doit afficher le renderer historique.
