# Guide d'installation de LaBrute

Ce document explique comment cloner le projet, installer les dépendances et récupérer les assets originaux pour obtenir une version fonctionnelle du jeu **LaBrute**.

## 1. Cloner les dépôts

```bash
git clone https://github.com/Zenoo/labrute.git
# Outils pour extraire les assets (optionnel)
git clone https://github.com/Zenoo/labrute-fla-parser.git
git clone https://github.com/Zenoo/labrute-static-fla-parser.git
```

## 2. Installer les dépendances

### Frontend (React/TypeScript)
```bash
cd labrute/client
npm install
```

### Backend (Node/Express)
```bash
cd ../server
# Facultatif : créer un environnement virtuel si vous utilisez Python pour d'autres outils
npm install
```

### Outils d'extraction des assets
```bash
# labrute-fla-parser
cd ../../labrute-fla-parser
npm install

# labrute-static-fla-parser
cd ../labrute-static-fla-parser
npm install
```

## 3. Extraction des assets graphiques

1. Récupérez les fichiers `.fla` originaux sur [EternalTwin](https://gitlab.com/eternaltwin/labrute).
2. Lancez l'extraction avec l'outil `labrute-static-fla-parser` (recommandé) :
   ```bash
   cd labrute-static-fla-parser
   npm run batch-parse /chemin/vers/vos/assets-fla
   ```
3. Copiez le contenu du dossier généré dans `labrute/client/public/assets/`.

## 4. Lancer l'application

Dans deux terminaux distincts :

**Backend**
```bash
cd labrute/server
npm run start
```

**Frontend**
```bash
cd labrute/client
npm run dev
```

Ouvrez ensuite `http://localhost:5173` dans votre navigateur pour accéder au jeu.

---

Vérifiez que les images des brutes s'affichent correctement pour confirmer la bonne installation.
