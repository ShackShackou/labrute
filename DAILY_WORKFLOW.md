# 📅 GUIDE D'UTILISATION QUOTIDIENNE - LaBrute

## 🚀 **DÉMARRAGE COMPLET DU PROJET**

### **📋 CHECKLIST PRÉ-DÉMARRAGE**

#### **1. Logiciels Requis (Vérifier qu'ils sont installés)**
- [ ] **PostgreSQL 13+** (avec service démarré)
- [ ] **PGAdmin 4** (pour gestion base de données)
- [ ] **Node.js 18+** (pour JavaScript/TypeScript)
- [ ] **Yarn 4.0.2** (gestionnaire de dépendances)
- [ ] **Git** (contrôle de version)
- [ ] **Visual Studio Code** (éditeur recommandé)

#### **2. Services Windows à Démarrer**
```cmd
# Ouvrir en tant qu'administrateur
net start postgresql-x64-13
# OU via services.msc > postgresql > Démarrer
```

---

## 🗄️ **ÉTAPE 1 : POSTGRESQL & PGADMIN**

### **A. Démarrer PostgreSQL**
```cmd
# Méthode 1 : Services Windows
Windows + R > services.msc
Chercher "postgresql" > Clic droit > Démarrer

# Méthode 2 : Ligne de commande (Admin)
net start postgresql-x64-13

# Vérifier que ça tourne
netstat -ano | findstr 5432
```

### **B. Lancer PGAdmin 4**
```cmd
# Démarrer depuis le menu Windows
Menu Démarrer > pgAdmin 4

# OU depuis l'installation
"C:\Program Files\pgAdmin 4\bin\pgAdmin4.exe"
```

### **C. Connecter aux Bases de Données**
1. **Ouvrir PGAdmin 4**
2. **Se connecter** :
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `010582`
3. **Vérifier les bases** :
   - ✅ `labrute` (données du jeu)
   - ✅ `etwin` (données OAuth)

---

## 💻 **ÉTAPE 2 : PROJET LABRUTE**

### **A. Aller dans le Bon Répertoire**
```cmd
# Recommandé : Utiliser E:\labrute
E:
cd labrute

# OU si problème avec E:
C:
cd C:\Users\User\labrute

# Vérifier qu'on est au bon endroit
dir
# Doit montrer : package.json, .env, client/, server/, etc.
```

### **B. Vérifier l'État Git**
```cmd
git status
git log --oneline -3
```

### **C. Mettre à Jour les Dépendances (si nécessaire)**
```cmd
# Seulement si premier démarrage ou après pull
yarn install
```

---

## 🎮 **ÉTAPE 3 : DÉMARRER LES SERVICES**

### **🚀 Option A : Démarrage Automatique (RECOMMANDÉ)**
```cmd
# Une seule commande pour tout démarrer
yarn dev

# Attendre que tous les services démarrent :
# [ETWIN] started server at http://localhost:50320/
# [SERVER] Server listening on port 9000
# [CLIENT] Local: http://localhost:3000
```

### **🔧 Option B : Démarrage Manuel (3 terminaux)**

#### **Terminal 1 - EternalTwin OAuth** 🔐
```cmd
cd E:\labrute
yarn eternaltwin:start

# Attendre le message :
# "started server at http://localhost:50320/"
```

#### **Terminal 2 - Backend API** ⚙️
```cmd
cd E:\labrute\server
npm start

# Attendre le message :
# "Server listening on port 9000"
```

#### **Terminal 3 - Frontend React** 🖥️
```cmd
cd E:\labrute\client
npm start

# Attendre le message :
# "Local: http://localhost:3000"
# "On Your Network: http://192.168.x.x:3000"
```

---

## ✅ **ÉTAPE 4 : VÉRIFICATION**

### **A. Vérifier les Ports**
```cmd
netstat -ano | findstr ":3000"    # Frontend
netstat -ano | findstr ":9000"    # Backend  
netstat -ano | findstr ":50320"   # OAuth
```

### **B. Tester l'Application**
1. **Ouvrir** : http://localhost:3000
2. **Cliquer** : Bouton de connexion
3. **Vérifier** : Redirection OAuth fonctionne
4. **Se connecter** : Avec un compte test

### **C. Vérifier les Logs**
- **Frontend** : Console navigateur (F12)
- **Backend** : Terminal du serveur
- **OAuth** : Terminal EternalTwin

---

## 🛠️ **DÉVELOPPEMENT QUOTIDIEN**

### **📝 Workflow Git Recommandé**
```cmd
# 1. Créer une branche pour la feature
git checkout -b ma-nouvelle-feature

# 2. Développer (modifier les fichiers)
# ...

# 3. Sauvegarder régulièrement
git add .
git commit -m "Description des changements"

# 4. Pousser sur GitHub
git push origin ma-nouvelle-feature

# 5. Créer une Pull Request sur GitHub
```

### **🔄 Hot Reloading**
- **Frontend** : Reload automatique à chaque modification
- **Backend** : Restart automatique avec `start:watch`
- **OAuth** : Restart manuel si modification config

### **📁 Fichiers Importants à Modifier**
```
client/src/          # Interface utilisateur React
server/src/          # API et logique backend  
core/src/            # Règles du jeu partagées
prisma/schema.prisma # Structure base de données
.env                 # Variables d'environnement
```

---

## 🛑 **ARRÊT DU PROJET**

### **A. Arrêter les Services**
```cmd
# Dans chaque terminal ouvert :
Ctrl + C

# OU tuer tous les processus Node.js
taskkill //F //IM node.exe
```

### **B. Arrêter PostgreSQL (Optionnel)**
```cmd
# Si tu veux économiser la mémoire
net stop postgresql-x64-13
```

### **C. Sauvegarder le Travail**
```cmd
git add .
git commit -m "Travail de la session"
git push origin ma-branche
```

---

## 🐛 **RÉSOLUTION DE PROBLÈMES**

### **Problème : Port déjà utilisé**
```cmd
# Tuer tous les processus Node.js
taskkill //F //IM node.exe

# Redémarrer
yarn dev
```

### **Problème : PostgreSQL ne démarre pas**
```cmd
# Vérifier le service
services.msc > postgresql

# Ou redémarrer manuellement
net stop postgresql-x64-13
net start postgresql-x64-13
```

### **Problème : OAuth ne fonctionne pas**
```cmd
# Vérifier la config EternalTwin
cd E:\labrute
npx eternaltwin config

# Vérifier le fichier
notepad eternaltwin.local.toml
```

### **Problème : Base de données vide**
```cmd
# Réinitialiser la DB
cd E:\labrute\server
npx prisma db reset
npx prisma db seed
```

### **Problème : Dépendances manquantes**
```cmd
# Nettoyer et réinstaller
rmdir /s node_modules
del yarn.lock
yarn install
```

---

## ⚡ **COMMANDES RAPIDES**

### **🚀 Démarrage Express**
```cmd
E: && cd labrute && yarn dev
```

### **🔍 Debug Rapide**
```cmd
# Vérifier tout en une fois
netstat -ano | findstr ":3000\|:9000\|:50320"
```

### **📊 Vérifier Base de Données**
```cmd
psql -U postgres -h localhost -p 5432 -c "\l"
```

### **🔄 Restart Complet**
```cmd
taskkill //F //IM node.exe && yarn dev
```

---

## 📱 **SHORTCUTS UTILES**

### **Visual Studio Code**
```cmd
# Ouvrir le projet
code E:\labrute

# OU depuis le répertoire
cd E:\labrute
code .
```

### **Terminal Intégré VSCode**
- `Ctrl + Shift + `` ` (backtick) : Ouvrir terminal
- `Ctrl + Shift + 5` : Diviser le terminal
- `Ctrl + PageUp/PageDown` : Naviguer entre terminaux

### **Hot Keys Git dans VSCode**
- `Ctrl + Shift + G` : Panneau Git
- `Ctrl + K Ctrl + C` : Commiter
- `Ctrl + Shift + P` : Palette de commandes

---

## 🎯 **CHECKLIST QUOTIDIENNE**

### **🌅 Début de Session**
- [ ] PostgreSQL démarré
- [ ] PGAdmin 4 ouvert et connecté
- [ ] `cd E:\labrute`
- [ ] `git status` (vérifier branche)
- [ ] `yarn dev`
- [ ] Ouvrir http://localhost:3000
- [ ] Tester connexion OAuth

### **🌙 Fin de Session**
- [ ] Sauvegarder travail (`git add . && git commit`)
- [ ] Pousser sur GitHub (`git push`)
- [ ] Arrêter services (`Ctrl+C` partout)
- [ ] Fermer PGAdmin 4
- [ ] (Optionnel) Arrêter PostgreSQL

---

## 📞 **AIDE RAPIDE**

### **🆘 En Cas de Galère**
1. **Redémarrer tout** : `taskkill //F //IM node.exe && yarn dev`
2. **Vérifier ports** : `netstat -ano | findstr ":3000\|:9000\|:50320"`
3. **Revenir à la version qui marche** : `git checkout working-oauth-version`

### **📋 Commande Magique du Matin**
```cmd
# Copier-coller cette ligne chaque matin :
E: && cd labrute && git status && yarn dev
```

**C'est tout ! Tu es maintenant équipé pour un workflow quotidien parfait ! 🚀**