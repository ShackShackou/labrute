# 🎮 GUIDE COMPLET : Lancer LaBrute

## 📋 CHECKLIST PRÉ-DÉMARRAGE

### 1. Vérifier que les services Windows tournent :
```cmd
# Ouvrir une invite de commandes en ADMINISTRATEUR
net start postgresql-x64-17
# OU vérifier dans services.msc que PostgreSQL est démarré
```

### 2. Vérifier que Docker/PgAdmin4 sont lancés :
- Docker Desktop doit être ouvert
- PgAdmin4 doit être accessible

---

## 🚀 DÉMARRAGE SIMPLE (1 seule commande)

### Méthode recommandée :
```cmd
# Aller dans le dossier du projet
cd C:\Users\User\labrute

# Lancer TOUT automatiquement (avec sauvegarde auto)
dev.cmd
```

**Cette commande va :**
- ✅ Faire une sauvegarde automatique de tes données
- ✅ Compiler le TypeScript
- ✅ Lancer le backend (port 9000)
- ✅ Lancer le frontend (port 3000)
- ✅ Ouvrir Prisma Studio (port 5555)

---

## 🔧 DÉMARRAGE MANUEL (si problème)

### Si dev.cmd ne marche pas, faire étape par étape :

#### Étape 1 : EternalTwin (OAuth)
```cmd
cd C:\Users\User\labrute
npm run eternaltwin:start
# Attendre le message : "started server at http://localhost:50320/"
```

#### Étape 2 : Backend
```cmd
# NOUVEAU TERMINAL
cd C:\Users\User\labrute
npx tsc -b tsconfig.build.json
cd server
node lib/main.js
# Attendre : "Server listening on port 9000"
```

#### Étape 3 : Frontend
```cmd
# NOUVEAU TERMINAL  
cd C:\Users\User\labrute\client
set PORT=3000
npm start
# Attendre : "webpack compiled"
```

---

## 🌐 ACCÉDER AU JEU

### URLs importantes :
- **🎮 Jeu principal** : http://localhost:3000
- **🔧 Admin DB** : http://localhost:5555 (Prisma Studio)
- **🔐 OAuth** : http://localhost:50320 (EternalTwin)
- **⚙️ Backend API** : http://localhost:9000

### Se connecter :
1. Aller sur http://localhost:3000
2. Cliquer "Se connecter"
3. Utiliser ton compte EternalTwin "JCDUSSE" (ou en créer un nouveau)
4. Créer tes brutes et jouer !

---

## 🛠️ RÉSOLUTION DE PROBLÈMES

### Si le frontend ne démarre pas :
```cmd
cd client
echo DANGEROUSLY_DISABLE_HOST_CHECK=true > .env
echo PORT=3000 >> .env
npm start
```

### Si PostgreSQL ne répond pas :
```cmd
# En ADMINISTRATEUR
net stop postgresql-x64-17
net start postgresql-x64-17
```

### Si tout plante :
```cmd
# Tuer tous les processus Node
taskkill /F /IM node.exe
# Puis relancer dev.cmd
```

---

## 💾 SAUVEGARDES

### Avant de jouer (optionnel) :
```cmd
quick-backup.cmd
```

### Sauvegarde complète :
```cmd
backup-db.cmd
```

### Restaurer si problème :
```cmd
restore-db.cmd
# Puis choisir la sauvegarde à restaurer
```

---

## ✅ VERIFICATION QUE TOUT MARCHE

### Ports à vérifier :
```cmd
netstat -ano | findstr "3000 9000 50320 5432"
```

**Tu dois voir :**
- Port 3000 : Frontend React
- Port 9000 : Backend API  
- Port 50320 : EternalTwin OAuth
- Port 5432 : PostgreSQL

### Test rapide :
```cmd
curl http://localhost:3000/api/csrf
# Doit retourner un token JSON
```

---

## 📱 RÉSUMÉ ULTRA-SIMPLE

**90% du temps, il suffit de :**
1. `cd C:\Users\User\labrute`
2. `dev.cmd`
3. Aller sur http://localhost:3000
4. Jouer ! 🎮

**En cas de problème, utilise les scripts de sauvegarde/restauration que j'ai créés !**