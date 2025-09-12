# 🚀 DÉMARRAGE RAPIDE - LABRUTE

## 📋 COMMANDES À COPIER-COLLER EN ARRIVANT

### 1️⃣ VÉRIFIER LA BRANCHE
```bash
git checkout version-stable-pixi-oauth-12septembre
```

### 2️⃣ LANCER LE PROJET

#### 🟢 MÉTHODE SIMPLE (tout-en-un)
```bash
yarn dev
```
Cette commande lance automatiquement :
- PostgreSQL (DB)
- Server (port 3500)
- Client (port 3000)
- EternalTwin (port 50320)

#### 🔵 MÉTHODE MANUELLE (si yarn dev bug)
Ouvrir 3 terminaux :
```bash
# Terminal 1
cd server && yarn start

# Terminal 2
cd client && yarn start

# Terminal 3
npx @eternaltwin/cli start
```

## ✅ VÉRIFIER QUE TOUT MARCHE

1. **Client** : http://localhost:3000
2. **EternalTwin** : http://localhost:50320
3. **Server API** : http://localhost:3500

## ⚠️ RÈGLES D'OR
- **TOUJOURS** utiliser `yarn`, JAMAIS `npm`
- **TOUJOURS** être sur la branche `version-stable-pixi-oauth-12septembre`
- **NE PAS** toucher aux fichiers prisma

## 🆘 SI PROBLÈME

### Erreur de batcher dans le navigateur
```bash
# Faire Ctrl+F5 dans le navigateur
```

### Erreur au démarrage
```bash
git reset --hard
yarn install
```

### Port déjà utilisé
```bash
# Windows - Tuer tous les Node
taskkill /F /IM node.exe
```

## 📝 POUR CLAUDE CODE
Dire exactement :
> "Regarde DEMARRAGE_RAPIDE.md et lance le projet"

---
VERSION STABLE DU 12 SEPTEMBRE 2025 ✅