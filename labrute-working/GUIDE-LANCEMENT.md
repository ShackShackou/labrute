# 🚀 GUIDE DE LANCEMENT - LaBrute x Phaser Integration

## 📋 Prérequis
- Node.js installé
- Navigateur moderne (Chrome/Firefox/Edge)
- Port 5176 disponible

## 🎯 Démarrage Rapide

### 1. Lancer le serveur
```bash
cd "E:\__CODE\__ROSEBUD-AI-LABRUTE\LaBrute RebornV04"
node simple-server.js
```
Le serveur démarre sur http://localhost:5176

### 2. Pages de Test Disponibles

#### A. Test d'intégration complet
```
http://localhost:5176/labrute-test-integration.html
```
- Interface complète avec tous les tests
- Test direct et via iframe
- Monitoring en temps réel

#### B. Viewer standalone 
```
http://localhost:5176/embed.html
```
- Page embed autonome
- Bouton "FORCER COMBAT TEST" pour lancer immédiatement

#### C. Debug Spine détaillé
```
http://localhost:5176/test-spine-debug.html
```
- Tests progressifs: Phaser → Plugin → Atlas → JSON → Spine complet
- Logs détaillés pour diagnostiquer les problèmes

#### D. Test simple Spine
```
http://localhost:5176/test-spine-simple.html
```
- Test basique de chargement Spine

## 🔧 Résolution des Problèmes

### Erreur: "Serveur non disponible"
1. Vérifier que le port 5176 est libre
2. Relancer: `node simple-server.js`

### Erreur: "Spine character not loading"
1. Ouvrir test-spine-debug.html
2. Cliquer les boutons dans l'ordre (1→2→3→4→5)
3. Vérifier les logs pour identifier le point de blocage

### Erreur: "Combat ne démarre pas"
1. Dans embed.html, cliquer "FORCER COMBAT TEST"
2. Vérifier la console du navigateur (F12)
3. S'assurer que le serveur est actif

## 📊 Workflow de Test Recommandé

1. **Démarrer le serveur**
   ```bash
   node simple-server.js
   ```

2. **Ouvrir la page de test principale**
   ```
   http://localhost:5176/labrute-test-integration.html
   ```

3. **Tester dans l'ordre:**
   - Section 1: "Test Direct" → "Lancer Combat Direct"
   - Si OK → "Combat avec Données"
   - Section 2: "Charger Iframe" → "Envoyer Données Test" → "Démarrer Combat"

4. **Si problème, diagnostiquer avec:**
   ```
   http://localhost:5176/test-spine-debug.html
   ```

## 🎮 Utilisation dans LaBrute

### Intégration via URL parameter
```
http://localhost:3000/{brute}/fight/{fightId}?engine=phaser
```

### Intégration directe dans une page
```html
<iframe src="http://localhost:5176/embed.html" width="100%" height="600"></iframe>
```

### Communication avec l'iframe
```javascript
// Envoyer des données de combat
iframe.contentWindow.postMessage({
    type: 'LOAD_FIGHT_STEPS',
    data: {
        fightId: "xyz",
        fighters: [...],
        steps: [...]
    }
}, '*');

// Contrôler le combat
iframe.contentWindow.postMessage({ type: 'PLAY_FIGHT' }, '*');
iframe.contentWindow.postMessage({ type: 'PAUSE_FIGHT' }, '*');
iframe.contentWindow.postMessage({ type: 'SET_SPEED', data: { speed: 2 } }, '*');
```

## 📁 Structure des Fichiers Clés

```
LaBrute RebornV04/
├── embed.html              # Page principale embed
├── simple-server.js        # Serveur HTTP simple
├── src/
│   ├── main.js            # Point d'entrée Phaser
│   ├── scenes/
│   │   └── LaBruteFightScene.js  # Scène de combat
│   └── engine/
│       └── LaBruteAdapter.js     # Adaptateur données LaBrute
└── assets/
    └── spine/
        ├── spineboy.atlas  # Atlas des textures
        ├── spineboy.png    # Texture image
        └── spineboy-pro.json # Données squelette

```

## ✅ Checklist de Validation

- [ ] Serveur démarre sans erreur
- [ ] embed.html se charge correctement
- [ ] Bouton "FORCER COMBAT TEST" affiche les personnages
- [ ] Les animations Spine fonctionnent
- [ ] Les combats se déroulent jusqu'à la fin
- [ ] L'intégration iframe fonctionne
- [ ] La communication postMessage est opérationnelle

## 🆘 Support

Si les problèmes persistent:
1. Vérifier la console du navigateur (F12)
2. Examiner les logs du serveur
3. Utiliser test-spine-debug.html pour un diagnostic détaillé
4. Vérifier que tous les fichiers assets/spine/* sont présents

## 🎯 Prochaines Étapes

Une fois que tout fonctionne:
1. Intégrer dans le vrai site LaBrute via ?engine=phaser
2. Mapper les vrais IDs de brutes aux personnages Spine
3. Ajouter plus d'animations et de personnages
4. Optimiser les performances