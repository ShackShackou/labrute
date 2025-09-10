# 🧪 Guide de Test - Intégration LaBrute

## 🚀 **Étape 1 : Démarrer ton serveur prototype**
```bash
cd "E:\__CODE\__ROSEBUD-AI-LABRUTE\LaBrute RebornV04"
npm run start
```

**Attendre** que le serveur soit prêt (message "Server listening on port 9000")

## 🎮 **Étape 2 : Tester ton moteur directement**

### **Option A : Page de test (Recommandée)**
1. **Ouvrir** `http://localhost:5173/test-labrute-integration.html`
2. **Cliquer** sur "🚀 Démarrer Scène LaBrute"
3. **Cliquer** sur "🎯 Charger Combat Test"
4. **Vérifier** que les combattants apparaissent

### **Option B : Test direct**
1. **Ouvrir** `http://localhost:5173/embed.html`
2. **Vérifier** que le moteur Phaser se lance
3. **Regarder** la console pour les messages

## ⚔️ **Étape 3 : Tester dans LaBrute officiel**

### **URLs CORRECTES (remplace les placeholders) :**

**❌ FAUX :**
```
http://localhost:3000/[brute]/fight/[id]?engine=phaser
```

**✅ CORRECT :**
```
http://localhost:3000/HerveVenere/fight/daaeecd0-d926-4e5d-b77b-95ceb4c1568b?engine=phaser
http://localhost:3000/HerveVenere/fight/786e3113-e685-44b2-8002-af48f1b81de8?engine=phaser
```

### **Comment obtenir une vraie URL :**
1. **Aller** sur `http://localhost:3000/`
2. **Créer** un nouveau personnage ou **lancer** un combat existant
3. **Copier** l'URL du combat (ex: `http://localhost:3000/NomDuPerso/fight/ID-DU-COMBAT`)
4. **Ajouter** `?engine=phaser` à la fin

## 🔍 **Vérifications à faire :**

### **Dans ton moteur prototype :**
- ✅ Serveur `npm run start` fonctionne
- ✅ `http://localhost:5173/` répond
- ✅ `test-labrute-integration.html` charge sans erreur CORS

### **Dans LaBrute officiel :**
- ✅ `http://localhost:3000/` fonctionne
- ✅ Combat se lance normalement
- ✅ Avec `?engine=phaser`, ton moteur remplace PIXI.js

## 🚨 **Problèmes courants :**

### **"BRUTE NOT FOUND"**
- **Cause** : URL avec placeholders `[brute]` et `[id]`
- **Solution** : Utiliser une vraie URL de combat LaBrute

### **Erreurs CORS**
- **Cause** : Ouverture directe des fichiers HTML
- **Solution** : Passer par `http://localhost:5173/`

### **Moteur ne se lance pas**
- **Cause** : Serveur prototype non démarré
- **Solution** : Vérifier `npm run start` dans le bon dossier

## 📋 **Ordre de test recommandé :**

1. **Démarrer** ton serveur prototype
2. **Tester** `test-labrute-integration.html` 
3. **Vérifier** que Phaser+Spine fonctionne
4. **Tester** dans LaBrute avec une vraie URL
5. **Vérifier** que l'intégration fonctionne

## 🎯 **Résultat attendu :**

Avec `?engine=phaser`, tu devrais voir :
- **Ton moteur Phaser+Spine** au lieu de PIXI.js
- **Tes personnages Spine** qui combattent
- **L'interface LaBrute** intacte (contrôles, logs)
- **Les vraies données** de combat LaBrute

---

**💡 Conseil : Commence toujours par tester ton moteur directement avant de l'intégrer dans LaBrute !**
