# Guide d'utilisation de JPEXS pour LaBrute

## 🎯 Objectif
Utiliser JPEXS Free Flash Decompiler pour extraire et analyser les assets originaux de LaBrute.

## 📋 Prérequis
- JPEXS Free Flash Decompiler : `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\JPEXS Free Flash Decompiler`
- Fichiers Flash originaux (.swf ou .fla) de LaBrute

## 🔍 Ce qu'on cherche dans les fichiers Flash

### 1. Symboles principaux
- **Symbol460** : Animations du brute masculin
- **Symbol752** : Animations du brute féminin

### 2. Structure des body parts
Les parties du corps référencées dans le code :
- p1, p1a, p1b : Éléments principaux
- p2 : Corps secondaire (7 variantes homme, 0 femme)
- p3 : Corps principal (11 variantes)
- p4 : Accessoires corps (5 homme, 3 femme)
- p5 : Élément spécial
- p6 : Accessoire secondaire (1 homme, 0 femme)
- p7, p7b : Parties supérieures
- p8 : Parties finales

### 3. Système de couleurs
16 canaux de couleur avec références dynamiques :
- col0, col0a, col0c : Couleurs de peau
- col1, col1a-d : Couleurs de cheveux
- col2-4 : Couleurs de vêtements

## 📂 Structure actuelle des assets

### Sprites extraits (PNG)
```
client/public/images/game/resources/
├── male-brute/
│   ├── idle/
│   ├── run/
│   ├── hit-0/
│   ├── death/
│   └── ... (autres animations)
├── female-brute/
├── bear/
├── dog/
└── panther/
```

### Atlas générés (JSON)
```
client/public/images/game/
├── male-brute.json
├── female-brute.json
├── bear.json
├── dog.json
└── panther.json
```

## 🛠️ Processus d'extraction avec JPEXS

### 1. Ouvrir le fichier SWF
- Lancer JPEXS
- File > Open > Sélectionner le .swf de LaBrute

### 2. Explorer la structure
- Naviguer dans l'arbre des symboles
- Chercher Symbol460 et Symbol752
- Identifier les MovieClips des body parts

### 3. Extraire les assets
- Clic droit sur un symbole > Export
- Format : PNG sequence pour les animations
- Conserver la structure des dossiers

### 4. Analyser les métadonnées
- Points de pivot (registration points)
- Transformations et échelles
- Timeline et frame labels

## 🔄 Intégration dans le projet

### 1. Remplacer les sprites simplifiés
Les sprites actuels dans `labrute-sprite-editor` sont des formes géométriques.
Remplacer par les vrais sprites extraits.

### 2. Mettre à jour les références
- Adapter les chemins dans `data.js`
- Ajuster les points de pivot selon JPEXS
- Synchroniser avec le système de body parts

### 3. Implémenter le parser de symboles
Créer un module pour interpréter la structure Flash :
```javascript
// Exemple de structure à implémenter
const symbolParser = {
  parseBodyPart: (symbolData) => {
    // Extraire les frames
    // Appliquer les transformations
    // Gérer les références de couleur
  }
};
```

## 📝 Notes importantes

1. **Droits d'auteur** : S'assurer d'avoir les droits pour utiliser les assets originaux
2. **Optimisation** : Les sprites Flash peuvent nécessiter une optimisation pour le web
3. **Compatibilité** : Vérifier la compatibilité des animations avec PIXI.js

## 🎨 Workflow recommandé

1. **Extraction** : Utiliser JPEXS pour extraire tous les symboles
2. **Organisation** : Structurer les fichiers selon le format actuel
3. **Conversion** : Utiliser TexturePacker pour créer les atlas
4. **Intégration** : Mettre à jour l'éditeur de sprites
5. **Test** : Vérifier le rendu dans l'application

## 🔗 Ressources
- [JPEXS Documentation](https://github.com/jindrapetrik/jpexs-decompiler/wiki)
- [TexturePacker](https://www.codeandweb.com/texturepacker)
- [PIXI.js Sprite Sheets](https://pixijs.com/guides/basics/sprite-sheets)
