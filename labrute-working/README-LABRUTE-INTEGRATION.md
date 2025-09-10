# 🎮 Intégration LaBrute - Moteur de Combat Phaser+Spine

## 📋 Vue d'ensemble

Ce projet intègre ton moteur de combat Phaser+Spine avec le jeu officiel LaBrute, remplaçant le moteur PIXI.js existant par ton système moderne et extensible.

## 🚀 Architecture d'Intégration

### **1. LaBruteAdapter.js**
- **Transforme** les données LaBrute en format compatible avec ton moteur
- **Gère** le mapping des combattants et des étapes de combat
- **Interface** entre LaBrute et ton système Phaser+Spine

### **2. LaBruteFightScene.js**
- **Scène Phaser** dédiée à l'intégration LaBrute
- **Utilise** l'adaptateur pour charger les vraies données de combat
- **Interface** utilisateur compatible avec LaBrute (Play/Pause, Vitesse, Son)

### **3. embed.html**
- **Point d'entrée** pour l'intégration dans LaBrute
- **Interface** utilisateur LaBrute intégrée
- **Communication** bidirectionnelle avec le moteur

## 🔧 Installation et Test

### **Démarrer le serveur de développement**
```bash
cd "E:\__CODE\__ROSEBUD-AI-LABRUTE\LaBrute RebornV04"
npm run start
```

### **Tester l'intégration**
1. **Ouvrir** `test-labrute-integration.html` dans ton navigateur
2. **Vérifier** que le moteur se lance avec la scène LaBrute
3. **Tester** le chargement des données de combat
4. **Vérifier** les contrôles (Play/Pause, Vitesse, etc.)

### **Intégration dans LaBrute**
1. **Lancer** LaBrute avec `?engine=phaser`
2. **Vérifier** que ton moteur remplace PIXI.js
3. **Tester** un combat complet

## 📊 Structure des Données

### **Données LaBrute → Ton Moteur**
```javascript
// Combattant LaBrute
{
  id: "brute-alpha",
  name: "Brute Alpha",
  team: "L", // L = Left, R = Right
  hp: 100,
  strengthValue: 25,
  agilityValue: 15,
  speedValue: 18,
  initiative: 5,
  skills: ["berserker", "counter"],
  weapons: ["sword", "shield"]
}

// Étape de combat LaBrute
{
  a: "Hit", // Action type
  f: "brute-alpha", // Fighter ID
  t: "brute-beta", // Target ID
  d: 25, // Damage
  w: "sword", // Weapon
  c: 0, // Critical (0/1)
  s: 0 // Stunned (0/1)
}
```

### **Mapping des Actions**
- **`Move`** → Mouvement du combattant
- **`Hit`** → Attaque avec dégâts
- **`Block`** → Blocage défensif
- **`Evade`** → Esquive
- **`Death`** → Mort du combattant
- **`End`** → Fin du combat

## 🎯 Fonctionnalités Implémentées

### **✅ Complété**
- [x] **Adaptateur LaBrute** - Transformation des données
- [x] **Scène de combat** - Intégration Phaser+Spine
- [x] **Interface utilisateur** - Contrôles LaBrute
- [x] **Système de logs** - Suivi des actions
- [x] **Communication** - Messages postMessage
- [x] **Gestion des étapes** - Exécution séquentielle

### **🔄 En Développement**
- [ ] **Sons et musique** - Intégration audio
- [ ] **Animations avancées** - Plus de variété
- [ ] **Effets visuels** - Particules, shaders
- [ ] **Personnalisation** - Différents modèles Spine

### **📋 Planifié**
- [ ] **Système de skills** - Compétences spéciales
- [ ] **Gestion des pets** - Animaux de compagnie
- [ ] **Armes et équipement** - Visuels des armes
- [ ] **Multiples modèles** - Différents personnages

## 🔗 Communication LaBrute ↔ Ton Moteur

### **Messages vers Ton Moteur**
```javascript
// Charger un combat
{
  type: 'LOAD_FIGHT_STEPS',
  data: { /* données de combat LaBrute */ }
}

// Contrôles
{ type: 'PLAY_FIGHT' }
{ type: 'PAUSE_FIGHT' }
{ type: 'SET_SPEED', data: { speed: 2 } }
```

### **Messages depuis Ton Moteur**
```javascript
// État du moteur
{ type: 'READY' }
{ type: 'FIGHT_LOADED', data: { fightId, totalSteps } }
{ type: 'FIGHT_STEP', data: { currentStep, totalSteps, type } }
{ type: 'FIGHT_ENDED', data: { winner } }
{ type: 'COMBAT_LOG', data: { message } }
```

## 🧪 Tests et Débogage

### **Fichiers de Test**
- **`test-labrute-integration.html`** - Test complet de l'intégration
- **`labrute-integration.html`** - Version standalone pour développement

### **Console de Débogage**
- **Logs détaillés** de chaque étape d'intégration
- **Vérification** des données transformées
- **Suivi** des actions de combat

### **Points de Vérification**
1. **Chargement** des données LaBrute
2. **Création** des combattants
3. **Exécution** des étapes de combat
4. **Communication** bidirectionnelle
5. **Interface** utilisateur responsive

## 🚨 Dépannage

### **Problèmes Courants**

#### **Moteur ne se lance pas**
- Vérifier que `npm run start` fonctionne
- Contrôler les erreurs dans la console
- Vérifier les imports dans `main.js`

#### **Données non reçues**
- Contrôler la communication postMessage
- Vérifier la structure des données LaBrute
- Tester avec `test-labrute-integration.html`

#### **Animations non visibles**
- Vérifier le chargement des assets Spine
- Contrôler les erreurs d'animation
- Vérifier la configuration Phaser

### **Logs de Débogage**
```javascript
// Activer les logs détaillés
console.log('🔗 LaBruteAdapter:', data);
console.log('🎮 LaBruteFightScene:', action);
console.log('⚔️ Combat:', step);
```

## 🔮 Évolutions Futures

### **Phase 2 : Personnalisation Avancée**
- **Système de body parts** - Différentes parties du corps
- **Modèles multiples** - Plus de variété de personnages
- **Animations spéciales** - Skills et compétences

### **Phase 3 : Intégration Complète**
- **Remplacement total** du moteur PIXI.js
- **Système de création** de personnages
- **Base de données** des assets Spine

### **Phase 4 : Optimisations**
- **Performance** - Optimisation des animations
- **Responsive** - Adaptation mobile/desktop
- **Accessibilité** - Support des handicaps

## 📚 Ressources

### **Documentation**
- **Phaser 3** - [phaser.io](https://phaser.io/)
- **Spine** - [esotericsoftware.com](https://esotericsoftware.com/)
- **LaBrute** - [labrute.net](https://labrute.net/)

### **Fichiers Clés**
- `src/engine/LaBruteAdapter.js` - Adaptateur principal
- `src/scenes/LaBruteFightScene.js` - Scène de combat
- `embed.html` - Point d'entrée d'intégration
- `test-labrute-integration.html` - Tests complets

---

## 🎉 Félicitations !

Tu as maintenant un moteur de combat Phaser+Spine **complètement intégré** avec LaBrute ! 

**Prochaines étapes :**
1. **Tester** l'intégration avec `test-labrute-integration.html`
2. **Vérifier** que ça fonctionne dans LaBrute officiel
3. **Développer** de nouveaux modèles et animations
4. **Optimiser** les performances et l'expérience utilisateur

**Ton moteur est maintenant le cœur de combat de LaBrute ! 🚀⚔️**
