# 🎨 Guide de l'Artiste pour LaBrute

## ✅ Ce qui a été fait

1. **Mapping complet des symboles** créé dans `labrute-symbol-mapper/`
   - `labrute_complete_mapping.json` : Mapping détaillé de tous les éléments
   - `labrute_simple_reference.json` : Référence rapide
   - `LABRUTE_SYMBOLS_DOCUMENTATION.md` : Documentation complète

2. **Outils créés** :
   - Extracteur de sprites (avec ou sans GPT-4)
   - Analyseur de symboles
   - Interface de validation

3. **Ce qu'on sait maintenant** :
   - **Symbol460** = Personnage masculin complet
   - **Symbol752** = Personnage féminin complet
   - 11 parties du corps (p1 à p8)
   - 16 canaux de couleur
   - Le fichier `mini_perso.swf` contient tout

## 🚀 Pour commencer à créer vos sprites

### Option 1 : Utiliser le Sprite Editor existant (PLUS SIMPLE)
```bash
cd labrute-sprite-editor
python -m http.server 8000
# Ouvrir http://localhost:8000/custom-sprite-editor.html
```

### Option 2 : Modifier directement le SWF
1. Télécharger JPEXS : https://github.com/jindrapetrik/jpexs-decompiler
2. Ouvrir `mini_perso.swf`
3. Modifier les sprites SANS changer les IDs
4. Exporter en SWF

## 📋 Référence rapide des Body Parts

| Code | Nom | Variantes |
|------|-----|-----------|
| p1 | Base | 1 |
| p2 | Corpulence | 7 (homme) / 0 (femme) |
| p3 | Cheveux | 11 |
| p4 | Barbe/Mèches | 5 (homme) / 3 (femme) |
| p5 | Chemise | 1 |
| p7 | Vêtement principal | 6 |

## 🎯 Workflow recommandé

1. **Dessiner vos sprites** :
   - Format : PNG avec transparence
   - Taille : ~60x60 pixels par élément
   - Nommer clairement : `tete_robot.png`, `corps_armure.png`

2. **Tester dans le sprite editor** :
   - Upload vos sprites
   - Mapper aux body parts
   - Prévisualiser

3. **Pour intégrer définitivement** :
   - Contacter Zenoo avec vos créations
   - Ou utiliser JPEXS pour modifier le SWF

## ⚠️ Règles d'or

1. **NE JAMAIS** modifier les Symbol IDs existants
2. **TOUJOURS** ajouter après le dernier ID
3. **TESTER** chaque modification
4. **SAUVEGARDER** l'original

## 📁 Structure du projet

```
labrute/
├── mini_perso.swf          # Fichier principal avec tous les sprites
├── labrute-sprite-editor/  # Éditeur visuel (déjà fonctionnel)
└── labrute-symbol-mapper/  # Outils de mapping (créés aujourd'hui)
    ├── labrute_complete_mapping.json
    ├── extract_symbols.py
    └── analyze_with_gpt4.py
```

## 💬 Questions pour Zenoo

Si vous voulez aller plus loin, demandez à Zenoo :
1. Comment intégrer vos nouveaux sprites dans le système ?
2. Y a-t-il un système pour gérer les probabilités d'apparition ?
3. Peut-on ajouter de nouvelles animations ?

## 🎉 Vous êtes prêt !

Vous avez maintenant :
- Le mapping complet des symboles
- Les outils pour extraire et analyser
- Un sprite editor fonctionnel
- La documentation complète

Commencez par créer quelques sprites simples (une nouvelle tête, une arme) et testez dans le sprite editor !

---
*Guide créé le 01/08/2025 pour faciliter la création de sprites LaBrute*