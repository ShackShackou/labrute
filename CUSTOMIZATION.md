# 🎨 Guide de Customisation LaBrute

Ce guide explique comment customiser tous les aspects du jeu LaBrute : personnages, interface, sons, mécaniques, etc.

## 📋 Table des matières

- [🧙 Personnages & Apparence](#-personnages--apparence)
- [🎵 Sons & Musiques](#-sons--musiques)  
- [🎨 Interface & Thèmes](#-interface--thèmes)
- [⚔️ Mécaniques de Jeu](#️-mécaniques-de-jeu)
- [🌍 Traductions & Langues](#-traductions--langues)
- [🖼️ Images & Graphismes](#️-images--graphismes)
- [💎 Conseils Avancés](#-conseils-avancés)

---

## 🧙 Personnages & Apparence

### 🎨 Couleurs des Brutes

**Fichier**: `core/src/brute/colors.ts`

```typescript
export const colors: ColorsType = {
  male: {
    skin: [
      '#996600',  // Brun
      '#eccd57',  // Jaune
      '#cb841b',  // Orange
      // Ajouter tes couleurs ici
    ],
    hair: [
      '#784129',  // Brun foncé
      '#fff9ae',  // Blond
      // Ajouter tes couleurs de cheveux
    ],
    clothing: [
      // Couleurs de vêtements
    ]
  },
  female: {
    // Même structure pour les femelles
  }
}
```

### 📊 Statistiques des Personnages

**Fichier**: `core/src/brute/createRandomBruteStats.ts`

```typescript
// Modifier les stats de base
const baseStats = {
  endurance: randomBetween(2, 5),    // Vie
  strength: randomBetween(3, 8),     // Force  
  agility: randomBetween(3, 8),      // Agilité
  speed: randomBetween(3, 8),        // Vitesse
};

// Ajouter tes propres algorithmes de génération
```

### 🏷️ Noms des Brutes

**Fichier**: `core/src/brute/isNameValid.ts`

```typescript
// Règles de validation des noms
export const isNameValid = (name: string): boolean => {
  // Modifier les règles selon tes besoins
  if (name.length < 3 || name.length > 16) return false;
  // Ajouter tes propres filtres
  return true;
};
```

### 💪 Compétences (Skills)

**Fichier**: `core/src/brute/skills.ts`

```typescript
export enum SkillId {
  herculeanStrength,    // Force herculéenne
  felineAgility,        // Agilité féline
  lightningBolt,        // Éclair
  // Ajouter tes nouvelles compétences ici
  
  // Exemple nouvelle compétence
  fireBreath,           // Souffle de feu
  iceShield,           // Bouclier de glace
}

// Configuration des compétences
export const skills: Skill[] = [
  {
    name: SkillName.herculeanStrength,
    odds: 80,     // Probabilité d'apparition
    type: 'strength',
    // Ajouter tes paramètres
  },
  // Nouvelle compétence exemple
  {
    name: 'fireBreath',
    odds: 60,
    type: 'special',
    damage: 15,
    // Personnaliser selon tes besoins
  }
];
```

### ⚔️ Armes

**Fichier**: `core/src/brute/weapons.ts`

```typescript
export enum WeaponId {
  fan,           // Éventail
  keyboard,      // Clavier
  knife,         // Couteau
  // Ajouter tes nouvelles armes
  
  // Exemples nouvelles armes
  magicStaff,    // Bâton magique  
  laserSword,    // Épée laser
  nunchaku,      // Nunchaku
}

export const weapons: Weapon[] = [
  {
    name: WeaponName.fan,
    odds: 100,         // Fréquence d'apparition
    types: [WeaponType.FAST],
    damage: 5,         // Dégâts
    // Modifier selon tes besoins
  },
  // Nouvelle arme exemple
  {
    name: 'magicStaff',
    odds: 20,          // Arme rare
    types: [WeaponType.MAGIC],
    damage: 25,
    initiative: -2,    // Plus lent mais puissant
  }
];
```

### 🐾 Animaux de Compagnie

**Fichier**: `core/src/brute/pets.ts`

```typescript
export enum PetName {
  dog = 'dog',
  bear = 'bear', 
  panther = 'panther',
  // Ajouter tes nouveaux pets
  dragon = 'dragon',
  wolf = 'wolf',
}

export const pets: Pet[] = [
  {
    name: PetName.dog,
    odds: 100,
    enduranceMalus: 0,
    // Stats et comportement
  },
  // Nouveau pet exemple
  {
    name: PetName.dragon,
    odds: 5,           // Très rare
    enduranceMalus: 2,
    strengthBonus: 8,  // Très puissant
  }
];
```

---

## 🎵 Sons & Musiques

### 🔊 Effets Sonores

**Dossier**: `client/public/sfx/`

Structure des sons :
```
sfx/
├── arrive.mp3           # Son d'arrivée en combat
├── background.mp3       # Musique de fond
├── equip.mp3           # Son d'équipement d'arme
├── win.mp3             # Son de victoire
├── hitting/            # Sons d'attaque
│   ├── axe1.mp3
│   ├── sword.mp3
│   └── ...
├── skills/             # Sons de compétences
│   ├── bomb.mp3
│   ├── hypnosis.mp3
│   └── ...
└── hit/                # Sons de coup reçu
    ├── evade.mp3
    ├── poison.mp3
    └── ...
```

### 🎶 Ajouter de Nouveaux Sons

1. **Ajouter le fichier audio** dans le bon dossier `client/public/sfx/`
2. **Modifier le fichier** `client/src/assets/sfx.json` :

```json
{
  "hitting": {
    "myNewWeapon": "hitting/maNouvelle​Arme.mp3"
  },
  "skills": {
    "myNewSkill": "skills/maNouvelle​Competence.mp3"
  }
}
```

3. **Référencer dans le code** (`client/src/components/Arena/sfx.ts`) :

```typescript
// Jouer un son personnalisé
const playCustomSound = (soundKey: string) => {
  const audio = new Audio(`/sfx/${soundKey}`);
  audio.play();
};
```

### 🎵 Musique de Fond

**Fichier**: `client/public/sfx/background.mp3`

- Remplace simplement le fichier par ta musique
- Format recommandé : MP3, qualité 128kbps
- Durée recommandée : 2-5 minutes (en boucle)

---

## 🎨 Interface & Thèmes

### 🌈 Couleurs du Thème

**Fichier**: `client/src/theme/light.ts` (thème clair)

```typescript
const border = {
  shadow: '#bc7b4a',    // Ombre
  outer: '#725254',     // Bordure externe
  main: '#f6ee90',      // Bordure principale
  inner: '#dec37f'      // Bordure interne
};

const logColors = {
  success: {
    main: '#a9d346',    // Vert succès
    light: '#c9e57f',
  },
  error: {
    main: '#ff8889',    // Rouge erreur
    light: '#fea3a3',
  },
};
```

**Fichier**: `client/src/theme/dark.ts` (thème sombre)

Même structure mais avec des couleurs adaptées au mode sombre.

### 🖼️ Images de l'Interface

**Dossier**: `client/public/images/`

Structure des images :
```
images/
├── button.svg          # Boutons
├── button-hover.svg    # Boutons au survol
├── main-bg.gif         # Arrière-plan principal
├── arena/              # Images de l'arène
├── dark/               # Version sombre des images
├── skills/             # Icônes des compétences
├── weapons/            # Images des armes
├── achievements/       # Icônes des succès
└── [langue]/          # Images par langue (fr, en, etc.)
```

### 🔲 Personnaliser les Boutons

1. **Modifier les images** : `client/public/images/button.svg`
2. **Ajuster les styles** : `client/src/components/StyledButton.tsx`

```typescript
const StyledButton = styled(Button)(({ theme }) => ({
  background: 'url(/images/button.svg)',
  border: 'none',
  // Personnaliser tes styles ici
  '&:hover': {
    background: 'url(/images/button-hover.svg)',
  }
}));
```

### 🎭 Créer un Nouveau Thème

1. **Créer le fichier** : `client/src/theme/monTheme.ts`

```typescript
import { createTheme } from '@mui/material';

export const monTheme = createTheme({
  palette: {
    primary: {
      main: '#ta​Couleur​Principale',
    },
    background: {
      default: '#ta​Couleur​Fond',
    },
    // Ajouter tes couleurs
  },
  typography: {
    fontFamily: 'TaFonte, Arial, sans-serif',
  },
});
```

2. **L'activer** dans `client/src/theme/ThemeOptions.ts`

---

## ⚔️ Mécaniques de Jeu

### 💰 Système d'Or

**Fichier**: `core/src/brute/getBruteGoldValue.ts`

```typescript
// Modifier la valeur en or des brutes
export const getBruteGoldValue = (brute: Brute): number => {
  const baseValue = 100;
  const levelMultiplier = brute.level * 50;
  // Personnaliser ton algorithme
  return baseValue + levelMultiplier;
};
```

### 📈 Système d'Expérience

**Fichier**: `core/src/brute/getXPNeeded.ts`

```typescript
// XP nécessaire pour monter de niveau
export const getXPNeeded = (level: number): number => {
  // Formule actuelle : progression linéaire
  return level * 1000;
  
  // Exemples d'autres formules :
  // return Math.floor(level * 1.5 * 1000);     // Progression exponentielle
  // return level < 10 ? level * 500 : level * 2000;  // Accélération après niveau 10
};
```

### 🏆 Système de Niveaux

**Fichier**: `core/src/brute/getWinsNeededToRankUp.ts`

```typescript
// Victoires nécessaires pour changer de rang
export const getWinsNeededToRankUp = (rank: number): number => {
  const winsNeeded = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
  // Modifier selon tes besoins
  return winsNeeded[rank] || 100;
};
```

### 🎲 Aléatoire & Probabilités

**Fichier**: `core/src/utils/randomBetween.ts`

```typescript
// Générer des nombres aléatoires
export const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Système de probabilités pondérées
export const weightedRandom = <T>(items: { item: T; weight: number }[]): T => {
  // Logique de sélection pondérée
};
```

### ⚡ Combats & Dégâts

**Fichiers de logique de combat** : `client/src/utils/fight/`

- `attemptHit.ts` - Calcul de toucher
- `hit.ts` - Application des dégâts  
- `evade.ts` - Système d'esquive
- `block.ts` - Système de blocage

### 🏅 Succès (Achievements)

**Fichier**: `core/src/Achievements.ts`

```typescript
export const achievements = [
  {
    name: 'winWith1HP',
    title: 'Survivant',
    description: 'Gagner avec 1 PV',
    icon: '/images/achievements/winWith1HP.svg',
    // Conditions personnalisées
  },
  // Ajouter tes nouveaux succès
  {
    name: 'monSucces',
    title: 'Mon Titre',
    description: 'Ma description',
    icon: '/images/achievements/monSucces.svg',
  }
];
```

---

## 🌍 Traductions & Langues

### 🗣️ Fichiers de Traduction

**Dossier Client**: `client/src/assets/i18n/`
**Dossier Serveur**: `server/i18n/`

```
i18n/
├── fr.json    # Français
├── en.json    # Anglais  
├── es.json    # Espagnol
├── de.json    # Allemand
├── pt.json    # Portugais
├── ru.json    # Russe
└── ko.json    # Coréen
```

### 📝 Ajouter une Nouvelle Langue

1. **Créer les fichiers** : `client/src/assets/i18n/maLangue.json`

```json
{
  "common": {
    "yes": "Oui",
    "no": "Non",
    "cancel": "Annuler"
  },
  "brute": {
    "level": "Niveau",
    "hp": "Points de Vie"
  }
}
```

2. **Ajouter le drapeau** : `client/public/images/maLangue/flag.svg`

3. **Configurer** dans `client/src/i18n.ts`

### 🎨 Images par Langue

**Dossier**: `client/public/images/[langue]/`

Chaque langue peut avoir ses propres images :
- Textes intégrés dans les images
- Headers spécifiques
- Boutons avec texte localisé

---

## 🖼️ Images & Graphismes

### 🎨 Sprites des Brutes

**Fichiers Texture** : Racine du projet
- `textures-male-brute.tps`
- `textures-female-brute.tps`  
- `textures-bear.tps`, `textures-dog.tps`, `textures-panther.tps`

**Images générées** : `client/public/images/game/`

### 🖌️ Créer de Nouveaux Sprites

1. **Modifier les fichiers .tps** avec TexturePacker
2. **Exporter** vers `client/public/images/game/`
3. **Mettre à jour** les références dans le code

### 🏞️ Arrière-plans de Combat

**Fichier**: `core/src/fight/backgrounds.ts`

```typescript
export const backgrounds = [
  'arena',
  'forest', 
  'cave',
  // Ajouter tes nouveaux backgrounds
  'monBackground',
  'autreBackground',
];
```

**Images**: `client/public/images/fight/background.webp`

### 🎭 Icônes & UI

**Compétences** : `client/public/images/skills/`
**Armes** : `client/public/images/weapons/`  
**Succès** : `client/public/images/achievements/`

Format recommandé : SVG (vectoriel) ou PNG 64x64px

---

## 💎 Conseils Avancés

### 🚀 Workflow de Développement

```bash
# 1. Créer une branche pour ta customisation
git checkout -b ma-customisation

# 2. Modifier les fichiers
# 3. Tester tes changements

# 4. Compiler si nécessaire
cd labrute
yarn compile

# 5. Redémarrer les services
yarn dev

# 6. Sauvegarder
git add .
git commit -m "Ma super customisation"

# 7. En cas de problème, revenir à la version qui marche
git checkout working-oauth-version
```

### 🛠️ Outils Utiles

**Base de Données** :
```bash
cd server
npx prisma studio  # Interface graphique
npx prisma db reset  # Reset complet
```

**Logs de Debug** :
- Backend : Console du serveur Node.js
- Frontend : Console du navigateur (F12)

**Tests** :
- `cd client && npm test`
- `cd server && npm test`

### 📊 Équilibrage du Jeu

**Fichiers clés à ajuster ensemble** :
- `core/src/brute/createRandomBruteStats.ts` - Stats de base
- `core/src/brute/skills.ts` - Puissance des compétences  
- `core/src/brute/weapons.ts` - Dégâts des armes
- `core/src/brute/getXPNeeded.ts` - Progression

**Conseils** :
- Toujours tester avec plusieurs brutes
- Éviter les compétences/armes trop déséquilibrées
- Sauvegarder avant les gros changements

### 🔧 Performance

**Images** :
- Utiliser WebP quand possible (plus léger)
- Optimiser les PNG avec TinyPNG
- SVG pour les icônes

**Sons** :
- MP3 à 128kbps maximum
- Durée courte (< 3 secondes pour les effets)

### 🐛 Debug Courant

**Problème** : Les changements ne s'affichent pas
**Solution** : Vider le cache du navigateur (Ctrl+F5)

**Problème** : Erreur de compilation TypeScript  
**Solution** : Vérifier les types dans `core/src/types.ts`

**Problème** : Nouvelle compétence ne fonctionne pas
**Solution** : Ajouter la logique dans `client/src/utils/fight/`

---

## 🎯 Exemples de Customisations

### 🔥 Exemple : Ajouter une Compétence "Boule de Feu"

1. **Ajouter dans** `core/src/brute/skills.ts` :
```typescript
export enum SkillId {
  // ... skills existants
  fireball = 40,
}

export const skills: Skill[] = [
  // ... skills existants
  {
    name: 'fireball',
    odds: 50,
    type: 'magic',
    damage: 20,
  }
];
```

2. **Ajouter l'icône** : `client/public/images/skills/fireball.svg`

3. **Ajouter le son** : `client/public/sfx/skills/fireball.mp3`

4. **Ajouter la logique** dans `client/src/utils/fight/skillActivate.ts`

### ⚔️ Exemple : Nouvelle Arme "Sabre Laser"

1. **Ajouter dans** `core/src/brute/weapons.ts` :
```typescript
export enum WeaponId {
  // ... armes existantes  
  lightSaber = 31,
}

export const weapons: Weapon[] = [
  // ... armes existantes
  {
    name: 'lightSaber',
    odds: 10,        // Arme rare
    types: [WeaponType.SHARP, WeaponType.FAST],
    damage: 30,      // Très puissante
    initiative: 3,   // Rapide
  }
];
```

2. **Ajouter l'image** : `client/public/images/weapons/lightSaber.png`

3. **Ajouter les sons** :
   - `client/public/sfx/hitting/lightSaber.mp3`
   - `client/public/sfx/equip/lightSaber.mp3`

---

**💡 N'hésite pas à expérimenter ! La meilleure façon d'apprendre est de modifier petit à petit et voir les résultats.** 

**🛡️ Rappel important : Toujours sauvegarder avec Git avant de faire des changements importants !**