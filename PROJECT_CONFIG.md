# 🎮 CONFIGURATION PROJET LABRUTE-SHACKERS (PIXI v8 + SPINE 2D)

## 🎯 OBJECTIF DU PROJET
Clone de LaBrute avec renderer **Pixi.js v8 + Spine 2D** pour remplacer le Flash original.

## ⚙️ CONFIGURATION PAR DÉFAUT

### 📊 Architecture des Services
```
✅ Frontend     : Port 3000 (React + Pixi v8)
✅ Backend      : Port 9000 (API Node.js)
✅ PostgreSQL   : Port 5432 (Docker: pg-labrute)
✅ EternalTwin  : Port 50320 (OAuth local)
✅ Prisma Studio: Port 5555 (Admin DB)
```

### 📁 Structure Fichiers
```
C:\Users\User\labrute\
├── client/              # Frontend React + Pixi v8
│   ├── .env            # PORT=3000
│   └── src/components/Arena/
│       ├── PixiFight.tsx    # Renderer Pixi v8 + Spine
│       └── CompareFight.tsx # Mode comparaison
├── server/              # Backend API
│   └── .env            # PORT=9000, DATABASE_URL
├── dev.cmd             # Script démarrage TOUT-EN-UN
└── docker-compose.yml  # PostgreSQL uniquement
```

### 🗄️ Base de Données
- **Container Docker**: `pg-labrute`
- **Port**: 5432
- **Database**: `labrute`
- **User**: `postgres`
- **Password**: `010582`
- **Compte test**: `JCDUSS`

## 🚀 DÉMARRAGE RAPIDE (1 COMMANDE)

```cmd
cd C:\Users\User\labrute && dev.cmd
```

**Cette commande lance AUTOMATIQUEMENT :**
1. ✅ PostgreSQL Docker (si pas déjà lancé)
2. ✅ Compilation TypeScript
3. ✅ Backend API (port 9000)
4. ✅ Frontend React (port 3000)
5. ✅ Prisma Studio (port 5555)
6. ✅ EternalTwin OAuth (port 50320)

## 🌐 URLS D'ACCÈS

- **Jeu**: http://localhost:3000
- **Mode Compare**: http://localhost:3000/[brute]/fight/[id]?renderer=compare
- **API**: http://localhost:9000
- **Admin DB**: http://localhost:5555
- **OAuth**: http://localhost:50320

## 🔧 RENDERER PIXI v8 + SPINE

### Fichier Principal
`client/src/components/Arena/PixiFight.tsx`

### Paramètres URL
- `?renderer=compare` - Mode comparaison côte-à-côte
- `?pixiDiag=1` - Afficher diagnostics
- `?pixiMulL=1` - Multiplicateur vitesse gauche
- `?pixiMulR=1.66` - Multiplicateur vitesse droite

### État Actuel
- ✅ Pixi.js v8 intégré
- ✅ Animations Spine 2D fonctionnelles
- ✅ Mode comparaison avec renderer officiel
- ✅ Mouvements Y parasites corrigés
- ⚠️ Calibrage distances en cours

## 📝 NOTES IMPORTANTES

1. **Docker = UNIQUEMENT pour PostgreSQL**
   - Ne PAS utiliser `sebastienwojda101/labrute_shack` (cassé)
   - Utiliser le code LOCAL avec `dev.cmd`

2. **Compte JCDUSS**
   - Dans PostgreSQL Docker `pg-labrute`
   - Database: `labrute`
   - Table: `User`

3. **Développement Shackers**
   - Page COMPARE développée en local (pas Docker)
   - Renderer Pixi v8 dans `PixiFight.tsx`
   - Test sur brute `HerveVenere`

## 🔄 COMMANDES UTILES

```cmd
# Démarrage complet
cd C:\Users\User\labrute && dev.cmd

# Docker PostgreSQL seulement
docker start pg-labrute

# Arrêt propre
docker stop pg-labrute
taskkill /F /IM node.exe

# Sauvegarde DB
quick-backup.cmd

# Restauration DB
restore-db.cmd
```

## ⚠️ EN CAS DE PROBLÈME

1. **PostgreSQL ne démarre pas**:
   ```cmd
   docker start pg-labrute
   # OU
   docker restart pg-labrute
   ```

2. **Ports occupés**:
   ```cmd
   netstat -ano | findstr "3000 9000 5432"
   taskkill /F /PID [PID_NUMBER]
   ```

3. **Tout relancer**:
   ```cmd
   docker restart pg-labrute
   taskkill /F /IM node.exe
   dev.cmd
   ```

---
**PROJET ACTIF: Clone LaBrute avec Pixi v8 + Spine 2D**
*Configuration validée et fonctionnelle*