# 🛠️ Stack Technologique - LaBrute

## 🎯 Technologies Principales

### Frontend
- **React 18+** - Framework UI principal
- **TypeScript** - Langage de développement
- **PIXI.js** - Moteur de rendu 2D pour les sprites et animations
- **Material-UI** - Composants d'interface utilisateur
- **i18next** - Système d'internationalisation

### Backend
- **Node.js 18+** - Runtime serveur
- **Prisma** - ORM et gestion de base de données
- **PostgreSQL** - Base de données principale
- **EternalTwin OAuth** - Système d'authentification

### Assets et Sprites
- **Texture Packer** - Création d'atlas de sprites (fichiers .tps)
- **PIXI Spritesheet** - Format JSON pour les atlas (.json + .png)
- **SVG** - Format vectoriel pour les icônes et UI
- **WebP/PNG** - Formats d'images optimisées

## 🎨 Système de Rendu des Brutes

### Architecture PIXI.js
```typescript
// Classe principale de rendu
BruteDisplay {
  container: PIXI.Container
  svgs: PIXI.Sprite[]
  colors: Record<BruteColor, string>
  parts: Record<BruteBodyPart, number>
}

// Gestion des textures
FighterHolder {
  symbols: LaBruteSymbol[]
  animations: Record<string, AnimationFrame[]>
  scale: number
}
```

### Chargement des Assets
- **Atlas Principal** : `/images/game/misc.json` (2719 frames)
- **Armes Lancées** : `/images/game/thrown-weapons.json` (247 frames)
- **Chargement Dynamique** : Texture.from() avec mise en cache
- **Optimisation** : Sprites partagés entre instances

## 🎭 Structure des Données

### Body Parts (Parties de Corps)
```typescript
type BruteBodyPart = 'p1' | 'p1a' | 'p1b' | 'p2' | 'p3' | 'p4' | 
                     'p5' | 'p6' | 'p7' | 'p7b' | 'p8'

// Chaque partie a un index (0-15 en hexadécimal)
const bodyString = "01234567890" // Représentation compacte
```

### Système de Couleurs
```typescript
type BruteColor = 'col0' | 'col0a' | 'col0c' |     // Peau
                  'col1' | 'col1a' | 'col1b' |     // Cheveux
                  'col1c' | 'col1d' |              // Cheveux suite
                  'col2' | 'col2a' | 'col2b' |     // Vêtements
                  'col3' | 'col3b' |               // Vêtements suite
                  'col4' | 'col4a' | 'col4b'       // Accessoires

// Couleurs encodées sur 32 caractères (16 codes à 2 chiffres)
const colorString = "0102030405060708091011121314156" 
```

### Symboles et Animations
```typescript
interface LaBruteSymbol {
  name: string
  type: 'symbol' | 'svg'
  partIdx?: string        // Référence à une body part (ex: "@p3")
  colorIdx?: string       // Référence à une couleur (ex: "@col1")
  frames?: FramePart[][]  // Frames d'animation
  parts?: LaBruteSymbol[] // Symboles enfants
}
```

## 🎪 Atlas de Sprites

### Format Texture Packer
```json
{
  "frames": {
    "sprite-name.png": {
      "frame": {"x": 100, "y": 200, "w": 50, "h": 50},
      "rotated": false,
      "trimmed": true,
      "sourceSize": {"w": 60, "h": 60}
    }
  },
  "meta": {
    "image": "atlas.png",
    "size": {"w": 2048, "h": 2048}
  }
}
```

### Categories d'Assets
- **Backgrounds** : Arrière-plans de combat (5 variants)
- **Weapons** : Armes de corps à corps et lancées
- **Effects** : Explosions, sang, poussière, impacts
- **Skills** : Effets visuels des compétences
- **Dead** : Animations de mort
- **Cure** : Effets de soins

## 🚀 Performance et Optimisation

### Gestion Mémoire
- **Mise en Cache** : Texture.from() avec cache automatique
- **Destruction** : destroy() pour libérer les ressources PIXI
- **Pooling** : Réutilisation des sprites entre combats

### Chargement Asynchrone
- **Loader PIXI** : Chargement des atlas en batch
- **Callbacks** : onLoad() pour synchroniser le rendu
- **Progressive** : Affichage dès que les textures sont prêtes

## 📊 Métriques Techniques

### Taille des Assets
- **Atlas Principal** : ~617KB (misc.png)
- **Armes Lancées** : ~7.5KB (thrown-weapons.png)
- **Total Skills** : ~50 SVG (~1KB chacun)
- **Achievements** : ~180 assets (mix PNG/SVG/GIF)

### Performance Rendu
- **Résolution** : Adaptatif avec window.devicePixelRatio
- **FPS Target** : 60 FPS avec PIXI.ticker
- **Batching** : Sprites groupés par atlas pour optimiser les draw calls

---

*Stack validé et optimisé pour le développement et production LaBrute* 