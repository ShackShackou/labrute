# 🎯 Roadmap - Outil de Gestion des Sprites LaBrute

## 🚀 Objectifs Principaux

### Vision
Créer un outil d'interface web complet permettant de visualiser, analyser et modifier facilement tous les sprites et assets du jeu LaBrute, sans avoir à fouiller dans le code source.

### 📋 Fonctionnalités Clés

- [ ] **Navigateur d'Assets** - Interface pour parcourir tous les sprites du jeu
- [ ] **Éditeur de Parties de Corps** - Visualisation et modification des body parts
- [ ] **Gestionnaire de Couleurs** - Interface pour les palettes de couleurs
- [ ] **Prévisualisateur de Brutes** - Rendu en temps réel des brutes
- [ ] **Exportateur de Configurations** - Génération de configs personnalisées

## 🎮 Compréhension du Système LaBrute

### ✅ Parties de Corps Identifiées
- **p1** : Élément principal (1 variante homme/femme)
- **p1a** : Complément p1 (1 variante)
- **p1b** : Complément p1 (1 variante)
- **p2** : Corps secondaire (7 hommes / 0 femmes)
- **p3** : Corps principal (11 variantes homme/femme)
- **p4** : Accessoire corps (5 hommes / 3 femmes)
- **p5** : Élément spécial (1 variante)
- **p6** : Accessoire secondaire (1 homme / 0 femmes)
- **p7** : Parties supérieures (6 variantes)
- **p7b** : Complément p7 (2 variantes)
- **p8** : Parties finales (4 variantes)

### ✅ Système de Couleurs
- **Peau** : col0, col0a, col0c (6 couleurs homme / 6 couleurs femme)
- **Cheveux** : col1, col1a, col1b, col1c, col1d (10 couleurs homme / 9 couleurs femme)
- **Vêtements** : col2, col2a, col2b, col3, col3b, col4, col4a, col4b (20 couleurs)
- **Spéciaux** : 1 couleur spéciale (#000000)

### ✅ Assets Identifiés
- **Sprites de Combat** : `/images/game/misc.json` (2719 frames)
- **Armes Lancées** : `/images/game/thrown-weapons.json` (247 frames)
- **Skills** : `/images/skills/` (50 SVG)
- **Armes** : `/images/weapons/` (26 PNG)
- **Achievements** : `/images/achievements/` (180 assets)

## 🛠️ Phases de Développement

### Phase 1 : Analyse Complète ✅
- [x] Comprendre la structure des body parts
- [x] Analyser le système de couleurs
- [x] Identifier les atlas de sprites PIXI.js
- [ ] Analyser les systèmes de rendu complets

### Phase 2 : Documentation 🔄
- [ ] Documenter tous les systems de sprites
- [ ] Créer un guide des body parts
- [ ] Cataloguer tous les assets disponibles
- [ ] Documenter l'API de couleurs

### Phase 3 : Développement Outil 📅
- [ ] Créer l'architecture de l'outil
- [ ] Interface de navigation des assets
- [ ] Éditeur visuel de brutes
- [ ] Système de preview en temps réel

### Phase 4 : Fonctionnalités Avancées 📅
- [ ] Import/Export de configurations
- [ ] Générateur de brutes aléatoires
- [ ] Éditeur de couleurs avancé
- [ ] Documentation interactive

## 🎯 Critères de Réussite

- ✅ Interface intuitive sans besoin de connaître le code
- ✅ Prévisualisation en temps réel des modifications
- ✅ Export facile des configurations générées
- ✅ Documentation complète et accessible
- ✅ Compatibilité avec la structure existante de LaBrute

## 📈 Progrès Actuel

- **Analyse Système** : 80% ✅
- **Documentation** : 20% 🔄
- **Développement** : 0% ⏳
- **Tests** : 0% ⏳

---

*Dernière mise à jour : 23 Juillet 2025* 