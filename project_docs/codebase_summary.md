# 📊 Résumé du Codebase - LaBrute & Sprite Editor

## 🎯 Vue d'Ensemble du Projet

### LaBrute - Jeu Original
LaBrute est un jeu de combat en ligne développé avec une architecture moderne full-stack :
- **Frontend** : React 18 + TypeScript + PIXI.js
- **Backend** : Node.js + Prisma + PostgreSQL  
- **Authentification** : EternalTwin OAuth
- **Rendu** : PIXI.js pour les sprites et animations

### Sprite Editor - Outil Créé
Interface web autonome pour gérer et visualiser tous les assets du jeu :
- **Interface** : HTML5 + CSS3 + JavaScript ES6+
- **Rendu** : PIXI.js pour prévisualisation
- **Architecture** : Modulaire et extensible
- **Export** : Configurations compatibles LaBrute

## 🏗️ Architecture du Système LaBrute

### Composants Clés Identifiés

#### 1. Système de Rendu des Brutes
```typescript
// Classe principale - client/src/utils/BruteDisplay.ts
export default class BruteDisplay {
  container: PIXI.Container
  svgs: PIXI.Sprite[]
  colors: Record<BruteColor, string>
  parts: Record<BruteBodyPart, number>
}

// Gestion des combats - client/src/utils/fight/FighterHolder.ts
export default class FighterHolder {
  symbols: LaBruteSymbol[]
  animations: Record<string, AnimationFrame[]>
}
```

#### 2. Structure des Données
```typescript
// Types principaux - core/src/types.ts
type BruteBodyPart = 'p1' | 'p1a' | 'p1b' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p7b' | 'p8'
type BruteColor = 'col0' | 'col0a' | 'col0c' | 'col1' | 'col1a' | 'col1b' | 'col1c' | 'col1d' | 'col2' | 'col2a' | 'col2b' | 'col3' | 'col3b' | 'col4' | 'col4a' | 'col4b'

// Configuration - core/src/brute/availableBodyParts.ts
export const availableBodyParts: { male: {...}, female: {...} }

// Couleurs - core/src/brute/colors.ts  
export const colors: { male: {...}, female: {...}, special: [...] }
```

#### 3. Parsers et Utilitaires
```typescript
// Conversion - core/src/brute/parsers.ts
export const readBodyString = (bodyString: string): Record<BruteBodyPart, number>
export const generateBodyString = (body: Record<BruteBodyPart, number>): string
export const readColorString = (gender: Gender, colorsString: string): Record<BruteColor, string>
export const generateColorString = (colorObject: Record<BruteColor, number>): string
```

## 🎨 Système de Sprites et Assets

### Atlas PIXI.js
```json
// client/public/images/game/misc.json (2719 frames)
{
  "frames": {
    "sprite-name.png": {
      "frame": {"x": 100, "y": 200, "w": 50, "h": 50},
      "rotated": false,
      "trimmed": true
    }
  }
}

// client/public/images/game/thrown-weapons.json (247 frames)
```

### Références Dynamiques
```typescript
// Symboles avec références
interface LaBruteSymbol {
  name: string
  type: 'symbol' | 'svg'
  partIdx?: string        // "@p3" - référence body part
  colorIdx?: string       // "@col1" - référence couleur
  frames?: FramePart[][]  // Animations
}

// Symboles principaux
const FEMALE_SYMBOL = Symbol752;
const MALE_SYMBOL = Symbol460;
```

### Assets Organisés
- **Skills** : `/images/skills/` (50+ SVG)
- **Armes** : `/images/weapons/` (26+ PNG)  
- **Achievements** : `/images/achievements/` (180+ assets)
- **Combat** : Atlas optimisés avec batching PIXI.js

## 🛠️ Flux de Données

### Création d'une Brute
1. **Sélection Genre** → `availableBodyParts[gender]`
2. **Configuration Parts** → `generateBodyString(parts)` 
3. **Configuration Couleurs** → `generateColorString(colors)`
4. **Rendu PIXI** → `new BruteDisplay(gender, colors, body)`

### Chargement des Sprites
1. **Parser Symboles** → `labrute-static-fla-parser`
2. **Résolution Références** → `@p3` vers `parts.p3`
3. **Chargement Textures** → `Texture.from()` avec cache
4. **Assemblage PIXI** → Containers hiérarchiques

## 📁 Structure des Répertoires

### Projet Principal
```
labrute/
├── client/           # Frontend React
│   ├── public/images/   # Assets statiques
│   └── src/
│       ├── components/  # Composants React
│       ├── utils/       # BruteDisplay, fight logic
│       └── views/       # Pages d'interface
├── core/             # Logique partagée
│   └── src/
│       ├── brute/       # Configuration brutes
│       └── types.ts     # Types TypeScript
└── server/           # Backend Node.js
    └── src/controllers/ # API endpoints
```

### Outil Sprite Editor
```
labrute-sprite-editor/
├── index.html        # Interface principale
├── styles.css        # Styles et animations
├── data.js          # Configuration LaBrute
├── app.js           # Logique applicative
└── README.md        # Documentation
```

## 🔧 Intégrations Techniques

### PIXI.js Performance
```typescript
// Optimisations identifiées
- Texture.from() avec mise en cache automatique
- Sprite batching par atlas
- Container hiérarchique pour z-index
- destroy() pour libération mémoire
- devicePixelRatio adaptatif
```

### Système de Build
```json
// package.json configurations
{
  "client": "React + TypeScript + Vite",
  "server": "Node.js + TypeScript",
  "core": "Shared TypeScript library"
}
```

## 📈 Métriques du Système

### Assets et Performance
- **Atlas Principal** : 617KB (misc.png) - 2719 frames
- **Armes Lancées** : 7.5KB (thrown-weapons.png) - 247 frames
- **Skills SVG** : ~50KB total (50+ fichiers × ~1KB)
- **Achievements** : ~180 assets (mix formats)

### Body Parts Distribution
| Genre | p1 | p1a | p1b | p2 | p3 | p4 | p5 | p6 | p7 | p7b | p8 |
|-------|----|----|----|----|----|----|----|----|----|----|----| 
| Homme | 1  | 1  | 1  | 7  | 11 | 5  | 1  | 1  | 6  | 2  | 4  |
| Femme | 1  | 1  | 1  | 0  | 11 | 3  | 1  | 0  | 6  | 2  | 4  |

### Couleurs Disponibles
- **Peau** : 6 couleurs par genre
- **Cheveux** : 10 hommes, 9 femmes
- **Vêtements** : 20 couleurs communes

## 🚀 Évolutions et Extensions

### Améliorations Possibles
1. **Sprite Editor** :
   - Intégration complète `BruteDisplay`
   - Prévisualisation animations
   - Export vers autres formats

2. **LaBrute Core** :
   - API REST pour configurations
   - WebGL renderer pour performance
   - Assets dynamiques CDN

3. **Outils Développeur** :
   - Validateur de configurations
   - Générateur de sprites batch
   - Éditeur d'animations

## 💡 Leçons Apprises

### Points Forts
- ✅ Architecture modulaire bien structurée
- ✅ Séparation claire frontend/backend/core
- ✅ Système de types TypeScript robuste
- ✅ Optimisations PIXI.js avancées

### Défis Techniques
- 🔸 Complexité du système de références dynamiques
- 🔸 Gestion mémoire PIXI.js pour longues sessions
- 🔸 Compatibilité cross-browser pour backdrop-filter
- 🔸 Synchronisation des atlas avec le code

## 📋 Utilisation de l'Outil Créé

### Pour Développeurs
```javascript
// Configuration rapide avec l'outil
const config = SpriteEditor.exportConfig();
const brute = new BruteDisplay(config.gender, config.colors, config.body);
```

### Pour Designers
- Interface visuelle pour tester combinations
- Export direct vers code production
- Validation automatique des limites
- Prévisualisation temps réel

---

*Documentation complète basée sur l'analyse approfondie du codebase LaBrute et création de l'outil Sprite Editor* 