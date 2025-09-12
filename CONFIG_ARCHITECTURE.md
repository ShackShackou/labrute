# 🏗️ ARCHITECTURE ET CONFIGURATION LABRUTE-SHACKERS

## 📋 RÉSUMÉ DU PROJET
Clone de LaBrute avec renderer **Pixi.js v8 + Spine 2D** pour remplacer le Flash original.

---

## ⚙️ CONFIGURATION ACTUELLE (DÉVELOPPEMENT)

### 🔌 Services et Ports
| Service | Port | Description | Statut |
|---------|------|-------------|--------|
| **PostgreSQL Docker** | 5432 | Base de données (container: pg-labrute) | ✅ Actif |
| **EternalTwin LOCAL** | 50320 | Authentification OAuth | ✅ Actif |
| **Backend API** | 9000 | Logique du jeu, API REST | ✅ Actif |
| **Frontend React** | 3000 | Interface utilisateur avec Pixi v8 | ✅ Actif |
| **Prisma Studio** | 5555 | Interface de gestion BDD | ✅ Actif |

### 📁 Fichiers de Configuration

#### `server/.env`
```env
DATABASE_URL=postgresql://postgres:010582@localhost:5432/labrute?schema=public
ETERNALTWIN_URL=http://localhost:50320
ETERNALTWIN_CLIENT_REF=brute_dev@clients
ETERNALTWIN_SECRET=dev
ETERNALTWIN_APP=brute_dev
ETERNALTWIN_CHANNEL=clients
PORT=9000
SELF_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
CORS_REGEX=^http://localhost:3000$
COOKIE_SECRET=devcookies
CSRF_SECRET=devcsrf
```

#### `client/.env`
```env
PORT=3000
REACT_APP_SERVER_URL=http://localhost:9000
REACT_APP_ETERNALTWIN_URL=http://localhost:50320
GENERATE_SOURCEMAP=false
```

#### `eternaltwin.local.toml`
```toml
[postgres]
host = "localhost"
port = 5432
name = "etwin"
user = "postgres"
password = "010582"
admin_user = "postgres"
admin_password = "010582"

[seed.app.brute_dev]
display_name = "LaBrute"
uri = "http://localhost:3000/"
oauth_callback = "http://localhost:9000/oauth/callback"
secret = "dev"
```

---

## 🚀 COMMANDES DE DÉMARRAGE

### Tout lancer d'un coup
```bash
# Option 1 : Script complet
dev.cmd

# Option 2 : Script de démarrage
START_LABRUTE.cmd
```

### Lancer manuellement
```bash
# 1. Base de données PostgreSQL
docker start pg-labrute

# 2. EternalTwin OAuth
npm run eternaltwin:start

# 3. Backend API
cd server && npm run start:watch

# 4. Frontend React
cd client && npm start

# 5. Prisma Studio (optionnel)
cd server && npm run studio
```

---

## 🔐 DIFFÉRENCES OAUTH : DEV vs PRODUCTION

### OAuth Local (Développement)
- **URL** : `localhost:50320`
- **Sécurité** : HTTP simple, pas de validation email
- **Comptes test** : alice/aaaaaaaaaa, bob/bbbbbbbbbb
- **Client ID** : `brute_dev@clients` (auto-configuré)
- **Callback** : Auto-accepté sans vérification stricte

### OAuth Production (2 options)

#### Option 1 : Ton propre EternalTwin
```env
ETERNALTWIN_URL=https://auth.shackers.com
ETERNALTWIN_CLIENT_REF=shackers@clients
# Tu gères tes propres comptes utilisateurs
```

#### Option 2 : EternalTwin Officiel
```env
ETERNALTWIN_URL=https://eternaltwin.com
ETERNALTWIN_CLIENT_REF=shackers_prod@apps
# Les joueurs utilisent leurs comptes EternalTwin existants
```

---

## 🗄️ BASES DE DONNÉES

### Container Docker Principal
- **Container** : `pg-labrute`
- **Port** : 5432
- **Database** : `labrute`
- **Utilisateur** : postgres / 010582
- **Contient** : Compte JCDUSS (id: e99ab88c-8be2-4fd0-8519-a0c4bf7a3705)

### Containers Non Utilisés (peuvent être supprimés)
- labrute-postgres-1 (port 5434)
- labrute-etwin-postgres-1 (port 5435)
- pg-labrute-2 (port 55432) - backup optionnel

---

## 🎮 ACCÈS AU JEU

### Page principale
```
http://localhost:3000
```

### Compte JCDUSS (HerveVenere)
```
http://localhost:3000/HerveVenere
```

### Page COMPARE (Flash vs Pixi)
```
http://localhost:3000/HerveVenere/fight/[FIGHT_ID]?renderer=compare
```

### OAuth Direct (si problème)
```
http://localhost:3000/direct-oauth.html
```

---

## ⚠️ NOTES IMPORTANTES

### Erreur "client/build/index.html"
**C'EST NORMAL !** Le backend cherche les fichiers statiques compilés du frontend. Cette erreur n'empêche PAS le fonctionnement de l'API sur port 9000.

### Rôle du Backend (Port 9000)
**CRUCIAL !** Sans le backend :
- ❌ Pas d'authentification
- ❌ Pas d'accès à la base de données
- ❌ Pas de logique de combat
- ❌ Pas de sauvegarde
- ❌ Le frontend ne peut rien faire

### Architecture Complète
```
PostgreSQL (5432) → Stockage données
     ↓
Backend API (9000) → Logique métier
     ↓
Frontend (3000) → Interface utilisateur
     ↑
EternalTwin (50320) → Authentification
```

---

## 📦 MIGRATION VERS PRODUCTION

### Étapes nécessaires
1. **HTTPS** sur tous les services
2. **Domaine** personnalisé (ex: shackers.com)
3. **PostgreSQL** en production (pas Docker local)
4. **Variables d'environnement** sécurisées
5. **Build** du frontend (`npm run build`)
6. **PM2/Forever** pour le backend Node.js
7. **Nginx/Apache** comme reverse proxy

### Configuration Production Exemple
```nginx
server {
    listen 443 ssl;
    server_name shackers.com;
    
    location / {
        root /var/www/labrute-client/build;
    }
    
    location /api {
        proxy_pass http://localhost:9000;
    }
}
```

---

## 🔧 DÉPANNAGE

### Ports occupés
```bash
# Windows - Tuer un processus sur un port
netstat -ano | findstr :9000
taskkill /PID [PID] /F

# ou PowerShell
Get-Process -Id [PID] | Stop-Process -Force
```

### Relancer proprement
```bash
# Script de nettoyage complet
restart-clean.cmd
```

### Vérifier les services
```bash
# PostgreSQL
docker ps | grep pg-labrute

# Backend
curl http://localhost:9000/api

# EternalTwin
curl http://localhost:50320

# Frontend
curl http://localhost:3000
```

---

## 📚 STRUCTURE DU PROJET

```
C:\Users\User\labrute\
├── client/                 # Frontend React + Pixi v8
│   ├── src/
│   │   ├── renderers/     # Renderers Pixi et Flash
│   │   └── components/    # Composants React
│   └── public/            # Assets statiques
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── controllers/  # Logique API
│   │   └── config.ts     # Configuration
│   └── prisma/           # Schéma base de données
├── eternaltwin.local.toml # Config OAuth local
├── dev.cmd               # Script de démarrage
└── docker-compose.yml    # Services Docker
```

---

## 🚦 STATUT ACTUEL

✅ **Version stable** : Commit 8e40c00a
✅ **OAuth local** fonctionnel
✅ **Base de données** avec compte JCDUSS
✅ **Renderer Pixi v8** avec Spine 2D
✅ **Page COMPARE** pour tests

---

*Document généré le 12/09/2025*
*Projet : LaBrute-Shackers (Pixi v8 + Spine 2D)*