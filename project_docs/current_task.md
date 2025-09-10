# 📋 Tâche Actuelle - Analyse LaBrute et Création d'Outil

## 🎯 Objectif Principal

Créer un outil d'interface complet pour visualiser et gérer tous les sprites et assets du jeu LaBrute, permettant de :
- Explorer toutes les parties de corps disponibles
- Naviguer dans les assets sans fouiller dans le code
- Visualiser les combinaisons de brutes en temps réel
- Exporter des configurations personnalisées

## 📚 Contexte Découvert

### 🔍 Analyse Système Complétée
- ✅ **Structure Body Parts** : 11 parties (p1, p1a, p1b, p2, p3, p4, p5, p6, p7, p7b, p8)
- ✅ **Système Couleurs** : 16 canaux de couleur (peau, cheveux, vêtements, accessoires)
- ✅ **Atlas Sprites** : PIXI.js avec atlas JSON/PNG optimisés
- ✅ **Package Parser** : `labrute-static-fla-parser` pour les symboles
- ✅ **Animations** : Système complet par genre (Symbol460/Symbol752)

### 🎨 Assets Identifiés
- **Skills** : 50+ compétences avec icônes SVG
- **Armes** : 26+ armes avec sprites PNG
- **Effets** : 2719+ frames d'animations de combat
- **Achievements** : 180+ assets de succès
- **Backgrounds** : 5 arrière-plans de combat

## 🚀 Étapes Actuelles

### Phase 1 : Documentation ✅ 
- [x] Analyser la structure du projet
- [x] Comprendre le système de sprites PIXI.js
- [x] Documenter les body parts et couleurs
- [x] Identifier le système d'animations
- [x] Créer roadmap et documentation technique

### Phase 2 : Création Outil 🔄
- [ ] Créer dossier séparé pour l'outil
- [ ] Développer interface de navigation des assets
- [ ] Implémenter preview des brutes en temps réel
- [ ] Créer système d'édition des body parts
- [ ] Ajouter export de configurations

## 🛠️ Architecture Technique

### Composants Clés Identifiés
- **BruteDisplay.ts** : Classe principale de rendu PIXI
- **FighterHolder.ts** : Gestion des animations de combat
- **parsers.ts** : Conversion body/color strings
- **availableBodyParts.ts** : Définition des parties disponibles
- **colors.ts** : Palettes de couleurs par genre

### Références Critiques
```typescript
// Symboles principaux
const FEMALE_SYMBOL = Symbol752;
const MALE_SYMBOL = Symbol460;

// Animations par genre
ANIMATIONS: Record<Gender, Record<Animation, LaBruteSymbol>>

// Body parts avec partIdx
symbol.partIdx = "@p3" // Référence dynamique
symbol.colorIdx = "@col1" // Référence couleur
```

## 📋 Prochaines Actions

### Immédiat
1. **Créer outil séparé** dans `/labrute-sprite-editor/`
2. **Interface de base** : HTML + CSS + JavaScript vanilla
3. **Preview brutes** : Intégration PIXI.js simplifiée
4. **Navigation assets** : Catalogue complet des ressources

### Moyen terme
1. **Éditeur body parts** : Interface glisser-déposer
2. **Gestionnaire couleurs** : Sélecteurs de palettes
3. **Export configs** : Génération de strings body/color
4. **Documentation utilisateur** : Guide d'utilisation

## 🎯 Livrables Attendus

- [ ] **Interface Web** : Outil autonome dans dossier séparé
- [ ] **Navigateur Assets** : Catalogue complet des sprites
- [ ] **Éditeur Brutes** : Modification visuelle en temps réel
- [ ] **Exportateur** : Génération de configurations utilisables
- [ ] **Documentation** : Guide complet d'utilisation

## 📈 Progrès

- **Documentation** : 95% ✅
- **Analyse Technique** : 100% ✅
- **Développement Outil** : 0% ⏳
- **Tests et Validation** : 0% ⏳

---

*Prêt pour la phase de développement de l'outil !* 
# PROCHAINE SESSION - RÉSUMÉ ENVIRONNEMENT

- Base de données: Postgres (Docker) sur `localhost:55432`, DB `labrute`.
  - Migrations + seed: Prisma appliqués, base peuplée (~600 brutes).
- Backend: `http://localhost:9000` (CSRF OK).
- Frontend: `http://localhost:3000`.
- OAuth local: EternalTwin démarré (auth locale prête).

# dY"< TA�che Actuelle - Analyse LaBrute et CrAcation d'Outil
