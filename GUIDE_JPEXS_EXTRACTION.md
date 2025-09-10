# 🔍 Guide pour extraire les Symbol IDs avec JPEXS

## Étape 1 : Télécharger JPEXS

1. Allez sur : https://github.com/jindrapetrik/jpexs-decompiler/releases
2. Téléchargez la dernière version :
   - **Windows** : `ffdec_XX.X.X_setup.exe` (installateur)
   - ou `ffdec_XX.X.X.zip` (version portable)

## Étape 2 : Installer/Lancer JPEXS

- Si vous avez l'installateur : installez normalement
- Si vous avez le ZIP : extrayez et lancez `ffdec.exe`

## Étape 3 : Ouvrir mini_perso.swf

1. Dans JPEXS : **File → Open**
2. Naviguez vers `C:\Users\User\labrute\mini_perso.swf`
3. Ouvrez le fichier

## Étape 4 : Explorer les symboles

### 🎯 OÙ CHERCHER :

Dans l'arborescence à gauche, explorez :
```
mini_perso.swf
├── sprites/
│   ├── DefineSprite (460)    ← C'est Symbol460 (homme)
│   ├── DefineSprite (752)    ← C'est Symbol752 (femme)
│   └── ... autres sprites
├── shapes/
│   └── DefineShape, DefineShape2, etc.
└── images/
    └── DefineBitsLossless, etc.
```

### 📋 CE QU'IL FAUT NOTER :

Pour chaque sprite/shape, notez :
- Le **numéro** (ex: DefineSprite (245))
- Ce que ça **représente** visuellement
- La **catégorie** probable (tête, corps, arme, etc.)

## Étape 5 : Visualiser les sprites

1. Cliquez sur un sprite dans la liste
2. Il s'affiche dans le panneau de droite
3. Vous pouvez voir à quoi il ressemble !

## Étape 6 : Créer votre mapping

Créez un fichier texte et notez :
```
TÊTES :
Symbol 35 = Tête chauve
Symbol 36 = Tête cheveux courts
Symbol 37 = Tête cheveux longs
...

CORPS :
Symbol 120 = Corps maigre
Symbol 121 = Corps normal
Symbol 122 = Corps musclé
...

ARMES :
Symbol 245 = Épée
Symbol 246 = Hache
...
```

## 💡 ASTUCES :

1. **Utilisez la recherche** : Ctrl+F pour chercher des numéros
2. **Exportez des images** : Clic droit → Export selection → PNG
3. **Prenez des screenshots** : Pour documenter ce que vous trouvez
4. **Commencez par les gros sprites** : 460 et 752 contiennent tout

## ⚠️ ATTENTION :

- Les sprites sont **imbriqués** : un sprite peut contenir d'autres sprites
- Les numéros ne sont pas forcément dans l'ordre
- Certains sprites sont des animations (plusieurs frames)

## 🎯 OBJECTIF FINAL :

Avoir une liste comme :
```
Symbol1 = Base personnage
Symbol35 = p3 variante 0 (cheveux courts)
Symbol36 = p3 variante 1 (cheveux mi-longs)
Symbol245 = Weapon_sword
Symbol463 = p2 variante 3 (corps musclé)
etc.
```

---

**Une fois terminé, vous aurez ENFIN les vrais Symbol IDs !**