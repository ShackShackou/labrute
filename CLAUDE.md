# Configuration de développement qui fonctionne ✅

## 🚀 Services requis (tous doivent être démarrés)

1. **Frontend React**: http://localhost:3000
2. **Backend Node.js**: http://localhost:9000  
3. **EternalTwin OAuth**: http://localhost:50320

## 🔧 Démarrage des services

### Option 1: Démarrage automatique (recommandé)
```bash
cd labrute
yarn dev
```

### Option 2: Démarrage manuel (3 terminaux séparés)
```bash
# Terminal 1 - EternalTwin OAuth
cd labrute
npx eternaltwin start

# Terminal 2 - Backend 
cd labrute/server
npm start

# Terminal 3 - Frontend
cd labrute/client
npm start
```

## 🗄️ Bases de données PostgreSQL requises

- **labrute** - Données du jeu (utilisateurs, brutes, combats)
- **etwin** - Données OAuth (authentification)

### Connexion PostgreSQL
- Host: localhost:5432
- User: postgres  
- Password: 010582

## 📁 Fichiers de configuration critiques

| Fichier | Description |
|---------|-------------|
| `.env` | Variables d'environnement (ports, URLs, secrets) |
| `eternaltwin.local.toml` | Configuration OAuth EternalTwin |
| `server/src/config.ts` | Configuration du serveur backend |
| `client/package.json` | Configuration proxy frontend |

## 🛡️ Comment sauvegarder avant de développer

```bash
# Créer une nouvelle branche pour développer
git checkout -b ma-nouvelle-feature

# Développer, tester...

# Sauvegarder régulièrement
git add .
git commit -m "Description des changements"

# Si problème, retour à la version qui marche
git checkout working-oauth-version
```

## 🎮 Structure du projet pour le développement

### Frontend (Interface utilisateur)
- `client/src/views/` - Pages principales
- `client/src/components/` - Composants réutilisables  
- `client/src/components/Brute/` - Affichage des personnages

### Backend (Logique du jeu)
- `server/src/controllers/` - API endpoints
- `server/src/utils/` - Fonctions utilitaires
- `server/prisma/schema.prisma` - Structure base de données

### Core (Règles du jeu)
- `core/src/brute/` - Logique des brutes
- `core/src/brute/createRandomBruteStats.ts` - Génération personnages
- `core/src/brute/skills.ts` - Compétences
- `core/src/brute/weapons.ts` - Armes

## 🔧 Modifications courantes

### Changer l'apparence des personnages
```
client/src/components/Brute/BruteBodyAndStats.tsx
```

### Modifier les statistiques
```  
core/src/brute/createRandomBruteStats.ts
core/src/brute/getFinalStats.ts
```

### Ajouter de nouvelles pages
```
client/src/views/NouvellePageView.tsx
client/src/routes.tsx (ajouter la route)
```

### Créer de nouvelles API
```
server/src/controllers/NouveauController.ts
server/src/routes.ts (ajouter les routes)
```

## ⚠️ En cas de problème

### Revenir à la version qui fonctionne
```bash
git checkout working-oauth-version
```

### Redémarrer tous les services
```bash
# Tuer tous les processus Node.js
taskkill //F //IM node.exe

# Redémarrer
yarn dev
```

### Vérifier que tous les services fonctionnent
```bash
netstat -ano | findstr "3000\|9000\|50320"
```

## 📝 Commandes utiles

### Logs et debug
```bash
# Voir les logs du backend
cd labrute/server && npm start

# Tester l'API
curl http://localhost:9000/api/health

# Tester OAuth
curl http://localhost:50320/
```

### Base de données
```bash
# Ouvrir Prisma Studio
cd labrute/server && npx prisma studio

# Réinitialiser la DB
cd labrute/server && npx prisma db reset
```

## 🎯 Version sauvegardée

Cette configuration a été sauvegardée dans:
- **Commit**: Fix OAuth configuration - Working version
- **Branche**: `working-oauth-version`
- **Date**: 2025-07-18

**Toujours tester sur une nouvelle branche avant de modifier la version qui marche !**