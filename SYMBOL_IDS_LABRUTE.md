# Symbol IDs Complets de LaBrute

## Personnages Principaux
- **Symbol460** = Personnage masculin complet
- **Symbol752** = Personnage féminin complet

## Structure des Symboles (basé sur l'analyse de Zenoo)

### Comment sont organisés les sprites

Les personnages sont composés de plusieurs parties (p1 à p8):

#### Homme (Symbol460)
- **p1** : Tête de base (1 variante)
- **p1a** : Front/cicatrices (1 variante)  
- **p1b** : Yeux/expressions (1 variante)
- **p2** : Corps/muscles (7 variantes = 7 niveaux de musculature)
- **p3** : Cheveux (11 styles)
- **p4** : Barbe (5 styles)
- **p5** : Accessoire tête (1 variante)
- **p6** : Accessoire corps (1 variante)
- **p7** : Vêtement principal (6 variantes)
- **p7b** : Vêtement secondaire (2 variantes)
- **p8** : Jambes/pantalon (4 variantes)

#### Femme (Symbol752)
- **p1** : Tête de base (1 variante)
- **p1a** : Front/cicatrices (1 variante)
- **p1b** : Yeux/expressions (1 variante)
- **p2** : Corps (0 variante - corps unique)
- **p3** : Cheveux (11 styles)
- **p4** : Accessoire visage (3 variantes)
- **p5** : Accessoire tête (1 variante)
- **p6** : Accessoire corps (0 variante)
- **p7** : Vêtement principal (6 variantes)
- **p7b** : Vêtement secondaire (2 variantes)
- **p8** : Jambes/jupe (4 variantes)

## Armes Connues
Les armes sont stockées séparément et ont leurs propres Symbol IDs.

### Armes Principales
- Épée (sword)
- Hache (axe)
- Lance (lance)
- Marteau (hammer)
- Fouet (whip)
- Couteau (knife)
- Gourdin (baton)
- Trident
- Hallebarde (halbard)
- Étoile du matin (morningStar)
- Fléau (flail)
- Cimeterre (scimitar)
- Saï
- Hachette (hatchet)

### Armes Spéciales
- Poêle à frire (fryingPan)
- Clavier (keyboard)
- Poireau (leek)
- Chope (mug)
- Os de mammouth (mammothBone)
- Éventail (fan)
- Raquette (racquet)
- Bol de nouilles (noodleBowl)
- Piopio
- Trombone
- Shuriken

## Couleurs (16 canaux)
- **col0** à **col0b** : Couleurs principales
- **col1** à **col1b** : Couleurs de peau  
- **col2** à **col2b** : Couleurs de cheveux
- **col3** à **col3b** : Couleurs de vêtements
- **col4** à **col4b** : Couleurs secondaires

## Comment Obtenir les Symbol IDs Exacts

### Option 1: JPEXS (Recommandé)
1. Téléchargez JPEXS depuis: https://github.com/jindrapetrik/jpexs-decompiler/releases
2. Ouvrez mini_perso.swf
3. Dans l'arbre à gauche, explorez:
   - `sprites/` pour les DefineSprite
   - `shapes/` pour les formes
4. Cliquez sur chaque élément pour voir son ID

### Option 2: Analyse du Code Source
Les Symbol IDs réels sont intégrés dans le code ActionScript du SWF.

### Exemple de Nomenclature
Quand vous trouvez un sprite dans JPEXS:
- `DefineSprite (245)` → Symbol245
- `DefineShape (123)` → Symbol123

## Notes Importantes
- Les symboles sont imbriqués (un personnage contient plusieurs symboles)
- Symbol460 et Symbol752 sont les conteneurs principaux
- Chaque partie (p1-p8) référence d'autres symboles
- Les animations sont stockées dans les timeline de chaque symbole