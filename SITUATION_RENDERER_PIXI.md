# Situation du Renderer Pixi pour LaBrute

## Contexte
L'utilisateur travaille sur un clone de LaBrute et veut que le renderer Pixi (v8 + Spine) reproduise EXACTEMENT le comportement du renderer officiel. Le problème principal est l'élimination des mouvements Y parasites et le calibrage précis des distances/timings.

## État Actuel (09/09/2025)

### Fichier Principal
- **`client/src/components/Arena/PixiFight.tsx`** - Le renderer Pixi v8 avec animations Spine

### Corrections Appliquées

#### 1. Mouvements Y Parasites - CORRIGÉ
- **Move (Step 15)** : S'exécute SEULEMENT quand `r === 1` (repositionnement mêlée)
  - Mouvement diagonal autorisé (X et Y)
  - Prend le Y de la cible
- **AttemptHit (Step 19)** : Pré-move UNIQUEMENT en X, JAMAIS en Y
  - `await tweenTo(src.node, idealX, cur.y, durPre)` - Y reste fixe
- **Hit (Steps 9-12)** : PAS de retour à la base après hit
- **MoveBack (Step 17)** : Retour diagonal autorisé

#### 2. Détermination des Côtés - SIMPLIFIÉ
```javascript
// Simple: index 1 = gauche, index 2 = droite
const actorSide: 'L'|'R' = (actorIdx === 1 || actor?.master === 1) ? 'L' : 'R';
const targetSide: 'L'|'R' | null = targetIdx !== null 
  ? ((targetIdx === 1 || target?.master === 1) ? 'L' : 'R')
  : null;
```

#### 3. Calcul des Distances - COMME L'OFFICIEL
```javascript
// Move: l'attaquant va vers sa cible
const targetX = actorSide === 'L' 
  ? tpos.x - meleeDist  // Je suis à gauche, je me place à gauche de ma cible
  : tpos.x + meleeDist; // Je suis à droite, je me place à droite de ma cible
```

#### 4. Erreur Batcher - RÉSOLU
- Ne plus faire `removeChild` pendant les ticks de rendu
- Destruction différée des objets graphiques
- Masquer au lieu de détruire immédiatement

### Paramètres de Calibrage
- `?pixiMulL=1` - Multiplicateur vitesse côté gauche
- `?pixiMulR=1.66` - Multiplicateur vitesse côté droit (par défaut)
- `?pixiDiag=1` - Afficher les vecteurs de déplacement
- `?renderer=compare` - Mode comparaison côte à côte

### URL de Test
```
http://localhost:3000/HerveVenere/fight/83eb8efa-45df-4fcc-96b3-58544ed0d785?renderer=compare&pixiDiag=1
```

## Problèmes Restants à Vérifier

1. **Amplitude des Diagonales** - L'utilisateur dit qu'elles ne sont pas assez grandes
2. **Distance de Combat** - Les personnages n'arrivent pas face-à-face à la bonne distance
3. **Calibrage des Vitesses** - Peut nécessiter ajustement des multiplicateurs

## Fichiers de Référence (Officiel)
- `client/src/utils/fight/moveTo.ts` - Logique Move officielle
- `client/src/utils/fight/attemptHit.ts` - Logique AttemptHit officielle
- `client/src/utils/fight/utils/getHitDistance.ts` - Calcul distances
- `client/src/utils/fight/utils/repositionFighters.ts` - Repositionnement

## Instructions pour la Relève

1. **NE PAS** compliquer la logique - rester simple
2. **TOUJOURS** vérifier dans l'officiel avant de modifier
3. **Move** doit bouger en diagonal (X et Y) SEULEMENT si r=1
4. **AttemptHit** ne doit JAMAIS changer Y
5. **Tester** avec le mode compare pour voir les différences visuellement

## Commandes
- `yarn dev` - Lancer le serveur de développement
- Port 3000 - Frontend
- Port 9000 - Backend API
- Port 5556/5557 - Prisma Studio

## Notes Importantes
- L'utilisateur est français et parfois frustré - rester patient et précis
- Il veut une copie EXACTE du comportement officiel, pas d'improvisation
- Les mouvements parasites en Y sont le problème principal à éviter