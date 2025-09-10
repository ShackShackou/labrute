# 🎨 LaBrute Sprite Editor Suite

Une suite complète d'outils pour éditer, analyser et personnaliser les sprites du jeu LaBrute.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Outils disponibles](#outils-disponibles)
- [Installation](#installation)
- [Guide d'utilisation](#guide-dutilisation)
- [Fonctionnalités avancées](#fonctionnalités-avancées)

## 🎯 Vue d'ensemble

LaBrute Sprite Editor Suite est une collection d'outils web permettant de :
- 📝 Éditer et personnaliser les configurations de brutes
- 🎨 Intégrer vos propres sprites et images
- 🔍 Explorer et analyser tous les assets du jeu
- 🎬 Créer des animations personnalisées
- 📦 Importer des sprites depuis JPEXS Flash Decompiler

## 🛠️ Outils disponibles

### 1. **Éditeur de Base** (`index.html`)
L'éditeur original pour configurer les brutes avec les assets existants.
- Configuration des parties du corps (p1-p8)
- Système de couleurs complet
- Export des configurations

### 2. **Custom Sprite Editor** (`custom-sprite-editor.html`) ⭐ NOUVEAU
L'éditeur avancé pour intégrer vos propres sprites.
- Upload de sprites personnalisés par drag & drop
- Mapping des sprites aux parties du corps
- Explorateur d'assets intégré
- Éditeur d'animations
- Import depuis JPEXS

### 3. **Analyseur Profond** (`deep-analyzer.html`)
Outil d'analyse détaillée des configurations de brutes.

### 4. **Démo Interactive** (`demo.html`)
Démonstration des capacités du système.

## 🚀 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-repo/labrute.git
cd labrute/labrute-sprite-editor
```

2. **Lancer un serveur local**
```bash
# Avec Python
python -m http.server 8000

# Ou avec Node.js
npx http-server -p 8000
```

3. **Ouvrir dans le navigateur**
```
http://localhost:8000/custom-sprite-editor.html
```

## 📖 Guide d'utilisation

### 🎨 Custom Sprite Editor

#### 1. Upload de Sprites
- Glissez-déposez vos images PNG/JPG/SVG dans la zone d'upload
- Ou cliquez pour parcourir vos fichiers
- Les sprites apparaissent dans la liste avec leurs dimensions

#### 2. Mapping des Sprites
- Glissez un sprite uploadé vers une partie du corps (p1-p8)
- La prévisualisation se met à jour en temps réel
- Utilisez le bouton "Original/Custom" pour comparer

#### 3. Explorateur d'Assets
- Parcourez tous les sprites du jeu organisés par catégorie
- Visualisez les animations frame par frame
- Extrayez des frames individuelles ou complètes

#### 4. Éditeur d'Animations
- Créez des animations avec timeline et keyframes
- Ajustez position, rotation, échelle et opacité
- Prévisualisez en temps réel à différents FPS

#### 5. Import JPEXS
- Importez des dossiers complets depuis JPEXS
- Mapping automatique des symboles (Symbol460, Symbol752)
- Détection intelligente des animations et body parts

### 💾 Sauvegarde et Export

#### Formats d'export disponibles :
- **Sprite Sheet** : Toutes les images en une seule
- **Frames Séparées** : Chaque sprite individuellement
- **Configuration JSON** : Données structurées
- **Pack Complet** : Tout en un package

#### Raccourcis clavier :
- `Ctrl/Cmd + S` : Sauvegarder le projet
- `Ctrl/Cmd + O` : Ouvrir un projet
- `Ctrl/Cmd + E` : Exporter
- `Espace` : Play/Pause animation (dans l'éditeur d'animations)

## 🔧 Fonctionnalités avancées

### Structure des Body Parts

| Partie | Description | Variantes Homme | Variantes Femme |
|--------|-------------|-----------------|-----------------|
| p1 | Base (toujours 0) | 1 | 1 |
| p1a | Ceinture normale | 1 | 1 |
| p1b | Ceinture romaine | 1 | 1 |
| p2 | Corps secondaire | 7 | 0 |
| p3 | Cheveux/Tête | 11 | 11 |
| p4 | Barbe/Accessoires | 5 | 3 |
| p5 | Chemise | 1 | 1 |
| p6 | Bas du corps | 1 | 0 |
| p7 | Vêtements principaux | 6 | 6 |
| p7b | Vêtements secondaires | 2 | 2 |
| p8 | Pieds (bug connu) | 4 | 4 |

### Système de Couleurs

Le système utilise 16 canaux de couleur :
- **col0, col0a, col0c** : Couleurs de peau
- **col1, col1a-d** : Couleurs de cheveux
- **col2-4** : Couleurs de vêtements et accessoires

### Format des Strings

- **Body String** : 11 caractères hexadécimaux (p1, p1a, p1b, p2, p3, p4, p5, p6, p7, p7b, p8)
- **Color String** : 32 caractères décimaux (2 par canal de couleur)

## 🐛 Problèmes connus

- La partie p8 (pieds) ne s'affiche pas correctement (bug du jeu original)
- Certaines combinaisons de parties peuvent créer des conflits visuels
- Les sprites custom doivent être optimisés pour de meilleures performances

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Partager vos créations de sprites

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- L'équipe originale de LaBrute/MyBrute
- La communauté pour les recherches sur le système de sprites
- JPEXS pour l'excellent décompileur Flash

---

**Note** : Cet outil est créé par des fans pour des fans. Respectez les droits d'auteur lors de l'utilisation d'assets du jeu original.
