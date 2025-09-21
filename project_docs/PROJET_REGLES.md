# Règles et Lois du Projet LaBrute

Ce document définit les règles obligatoires à respecter avant toute intervention sur le dépôt.

## 1. Sauvegarde avant modification
- Toujours créer une sauvegarde (commit ou copie) du fichier avant de modifier quoi que ce soit.
- Faire un `git commit` dès qu’un changement fonctionnel est validé.

## 2. Modifications incrémentales
- N’appliquer **qu’un seul changement** à la fois.
- Tester immédiatement après chaque modification (`npm run compile` puis `yarn dev` lancés depuis la racine du dépôt).
- Ne jamais refactoriser un fichier entier pendant un correctif.

## 3. Préservation du fonctionnel
- Ne jamais toucher au code qui fonctionne déjà sans raison explicite.
- Ajouter les nouveautés **sans casser l’existant** (feature flag / toggle si besoin).
- Pas de refactor massif dans le cadre d’un bugfix.

## 4. Validation visuelle systématique
- Après chaque changement, lancer l’interface (`yarn dev` depuis la racine du dépôt) et vérifier visuellement.
- En cas d’anomalie, revenir immédiatement en arrière (`git checkout -- <fichier>` ou `git reset --hard` après sauvegarde).

## 5. Structure obligatoire des cartes PFP
- Afficher : nom du combattant, niveau, HP (nombre uniquement), barres STR / AGI / SPD.
- Section « Supers » : n’afficher que les compétences de type `super` ou `talent`.
- Section « Skills » : toutes les autres compétences (hors supers/talents).
- Les cartes doivent suivre la souris tant que le pointeur reste dans la zone de survol du portrait.
- Les cartes disparaissent dès que la souris quitte la zone de survol.

## 6. Interdictions absolues
- Ne pas supprimer de code fonctionnel sans alternative équivalente déjà en place.
- Ne pas fusionner plusieurs lots de modifications sans tests intermédiaires.
- Ne pas toucher à la base de données sans sauvegarde préalable.
- Ne pas refactoriser pendant un correctif ciblé.

## 7. Routine de démarrage d’une session
1. `git status`
2. `git log --oneline -5`
3. `npm run compile` (depuis la racine du dépôt)
4. `yarn dev` (depuis la racine du dépôt) pour lancer l’interface et vérifier visuellement.

Toute contribution doit respecter ce document. En cas de doute, demander confirmation avant de coder.
