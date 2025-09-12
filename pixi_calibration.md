# 🎯 CALIBRATION PIXI D'APRÈS ANALYSE CSV

## Problèmes identifiés (10 septembre 17h21)

### Position de base incorrecte
- **Y trop haut de 22px** pour les deux côtés
- **Gauche X décalé de +17px** (trop à droite)

## Corrections à appliquer dans PixiFight.tsx

### 1. Ajuster les positions de base
```typescript
// Actuellement :
const baseLX = 60;  // Gauche
const baseLY = 245;
const baseRX = 520; // Droite  
const baseRY = 245;

// DEVRAIT ÊTRE :
const baseLX = 43;   // 60 - 17 = 43
const baseLY = 223;  // 245 - 22 = 223
const baseRX = 520;  // OK, ne pas changer
const baseRY = 223;  // 245 - 22 = 223
```

### 2. Ajuster la fonction clampY
```typescript
// Actuellement utilise probablement :
const minY = 175;
const maxY = 281;

// DEVRAIT ÊTRE :
const minY = 153;  // 175 - 22 = 153
const maxY = 259;  // 281 - 22 = 259
```

### 3. Multiplicateurs de vitesse
D'après les traces, les multiplicateurs actuels semblent corrects :
- `mulL = 1.0` ✅
- `mulR = 1.66` ✅

### 4. Paramètres URL pour tester
Sans modifier le code, tu peux tester avec ces paramètres :
```
?pixiClampMin=0.35&pixiClampMax=0.52
```

## Résumé des ajustements
- **Baisser tous les Y de 22 pixels**
- **Décaler le gauche de 17 pixels vers la gauche**
- **Garder les multiplicateurs actuels**