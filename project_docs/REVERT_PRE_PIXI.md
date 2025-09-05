Revenir à l’état pré‑Pixi v8 (guide rapide)

Objectif
- Cette branche contient l’introduction de Pixi v8 + Spine pour le renderer combat (`?renderer=pixi`).
- Voici comment revenir à l’état “pré‑Pixi v8” si besoin (rendu historique).

Options de repli sans changer le code
- Forcer Phaser: ajoute `?renderer=phaser` à l’URL du combat.
- Rendu historique (Pixi v6): n’ajoute pas `?renderer=pixi` (la vue par défaut charge le renderer existant).

Revenir au code “pré‑Pixi v8” avec Git (recommandé)
- Deux tags sont créés:
  - `pixi-v8-intro`: commit avec le renderer Pixi v8 + Spine.
  - `pre-pixi-v8`: commit juste avant l’introduction de Pixi v8.

Commandes
- Revenir complètement avant Pixi v8:
  - `git checkout pre-pixi-v8`
  - ou: `git reset --hard pre-pixi-v8`
- Revenir sur la version Pixi v8:
  - `git checkout pixi-v8-intro`

Revenir manuellement sans Git (si nécessaire)
1) `client/package.json`:
   - Remplacer `"pixi.js": "^8.x"` par `"pixi.js": "^6.5.10"`.
   - Supprimer la dépendance `"pixi-legacy"`.
   - Supprimer `"@esotericsoftware/spine-pixi-v8"`.
2) Imports sources:
   - Dans `client/src/**`, remplacer tous les `from 'pixi-legacy'` par `from 'pixi.js'`.
3) Fichiers à supprimer/éditer:
   - Supprimer `client/src/components/Arena/PixiFight.tsx`.
   - Éditer `client/src/views/FightView.tsx` pour enlever la branche `?renderer=pixi`.
4) Réinstaller et relancer:
   - `yarn install --mode=skip-build`
   - `yarn dev`

Vérifications rapides
- `http://localhost:3000/fight/UUID` (sans `?renderer=pixi`) doit afficher le renderer historique.
- `?renderer=phaser` force le renderer Phaser si besoin de secours.

