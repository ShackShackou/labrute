# 📋 Documentation complète des Symboles LaBrute

## 🎯 Symboles Principaux

- **Symbol460** : Personnage masculin complet (contient toutes les animations)
- **Symbol752** : Personnage féminin complet (contient toutes les animations)

## 🧩 Parties du Corps (Body Parts)

| Code | Nom | Description | Variantes H/F |
|------|-----|-------------|---------------|
| p1 | Base | Élément de base de la brute (toujours présent) | 1 |
| p1a | Ceinture | Ceinture basique autour de la taille | 1 |
| p1b | Ceinture Romaine | Ceinture de style romain/gladiateur | 1 |
| p2 | Taille du Corps | Détermine la corpulence de la brute (hommes seulement) | 7/0 |
| p3 | Cheveux/Coiffure | Style de cheveux de la brute | 11 |
| p4 | Barbe (H) / Mèches (F) | Barbe pour les hommes, mèches avant pour les femmes | 5/3 |
| p5 | Chemise/Haut | Port d'un haut ou torse nu | 1 |
| p6 | Bas | Type de vêtement pour le bas du corps | 1 |
| p7 | Vêtement Principal | Tenue principale du combattant | 6 |
| p7b | Dessous de Chaussures | Visibilité de la semelle des chaussures | 2 |
| p8 | Chaussures (Buggé) | Censé être les chaussures mais ne change rien visuellement (bug du jeu) | 4 |

## 🎨 Système de Couleurs

| Code | Nom | Type |
|------|-----|------|
| col0 | Couleur de Peau | skin |
| col0a | Couleur du Visage | skin |
| col0c | Couleur des Oreilles | skin |
| col1 | Couleur des Cheveux | hair |
| col1a | Cheveux Arrière | hair |
| col1b | Cheveux Arrière 2 | hair |
| col1c | Cheveux Avant | hair |
| col1d | Sourcils | hair |
| col2 | Couleur Secondaire | clothing |
| col2a | Accent 3 | clothing |
| col2b | Accent 1 | clothing |
| col3 | Couleur Primaire (inclut les yeux) | clothing |
| col3b | Accent 2 | clothing |
| col4 | Couleur de la Chemise | clothing |
| col4a | Accent des Chaussures | clothing |
| col4b | Couleur Mystère | clothing |

## 🎬 Animations Disponibles

- **idle** : Animation de repos
- **walk** : Animation de marche
- **run** : Animation de course
- **hit** : Animation de frappe
- **block** : Animation de blocage
- **evade** : Animation d'esquive
- **hurt** : Animation de blessure
- **death** : Animation de mort
- **win** : Animation de victoire
- **throw** : Animation de lancer
- **grab** : Animation de saisie

## ⚔️ Armes

- **fist** : Poings
- **sword** : Épée
- **axe** : Hache
- **lance** : Lance
- **hammer** : Marteau
- **whip** : Fouet
- **knife** : Couteau
- **shield** : Bouclier
- **mug** : Chope
- **fan** : Éventail
- **keyboard** : Clavier
- **leek** : Poireau
- **fryingPan** : Poêle à frire
- **noodleBowl** : Bol de nouilles

## 📝 Notes Importantes

### Workflow pour ajouter des sprites

1. **Ne JAMAIS modifier** les Symbol IDs existants
2. **Toujours ajouter** après le dernier ID utilisé
3. **Utiliser JPEXS** pour éditer le SWF
4. **Tester** chaque modification

### Structure des IDs (estimation)

- 1-99 : Éléments système
- 100-199 : Corps
- 200-399 : Têtes et cheveux
- 400-599 : Vêtements
- 600-699 : Pieds
- 700-799 : Armes
- 800+ : Effets et divers

### Bugs connus

- p8 (chaussures) ne fonctionne pas visuellement
- Certaines combinaisons peuvent créer des conflits

---

*Documentation générée automatiquement depuis les données du projet LaBrute*
