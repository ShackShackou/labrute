#!/usr/bin/env python3
"""
Analyse la structure du SWF et génère une liste des Symbol IDs probables
basée sur notre connaissance de LaBrute
"""

import json
from pathlib import Path

def generate_symbol_mapping():
    """Génère un mapping des Symbol IDs basé sur l'analyse du code"""
    
    print("=== Génération du Mapping des Symbol IDs LaBrute ===\n")
    
    # Structure connue basée sur l'analyse
    mapping = {
        "personnages_principaux": {
            "Symbol460": {
                "nom": "Personnage Masculin Complet",
                "description": "Container principal pour le personnage masculin",
                "type": "DefineSprite",
                "contient": {
                    "p1": "Base du corps",
                    "p1a": "Ceinture basique", 
                    "p1b": "Ceinture romaine",
                    "p2": "Taille du corps (7 variantes)",
                    "p3": "Cheveux (11 styles)",
                    "p4": "Barbe (5 styles)",
                    "p5": "Chemise/Haut",
                    "p6": "Bas (shorts/pantalons)",
                    "p7": "Vêtement principal (6 types)",
                    "p7b": "Dessous chaussures",
                    "p8": "Chaussures"
                }
            },
            "Symbol752": {
                "nom": "Personnage Féminin Complet",
                "description": "Container principal pour le personnage féminin",
                "type": "DefineSprite",
                "contient": {
                    "p1": "Base du corps",
                    "p1a": "Ceinture basique",
                    "p1b": "Ceinture romaine", 
                    "p2": "Corps (pas de variation)",
                    "p3": "Cheveux (11 styles)",
                    "p4": "Mèches avant (3 styles)",
                    "p5": "Chemise/Haut",
                    "p6": "Bas (shorts/rien)",
                    "p7": "Vêtement principal (6 types)",
                    "p7b": "Dessous chaussures",
                    "p8": "Chaussures"
                }
            }
        },
        "estimation_symbols": {
            "corps_homme": {
                "description": "Variantes de musculature (p2)",
                "nombre": 7,
                "symbols_probables": "Symbol100-Symbol106"
            },
            "cheveux": {
                "description": "Styles de cheveux (p3)",
                "nombre": 11,
                "symbols_probables": "Symbol200-Symbol210"
            },
            "barbes": {
                "description": "Styles de barbe (p4 homme)",
                "nombre": 5,
                "symbols_probables": "Symbol300-Symbol304"
            },
            "vetements": {
                "description": "Vêtements principaux (p7)",
                "nombre": 6,
                "symbols_probables": "Symbol400-Symbol405"
            }
        },
        "armes": {
            "description": "Les armes ont leurs propres Symbol IDs",
            "liste": [
                "sword (épée)",
                "axe (hache)",
                "lance",
                "hammer (marteau)",
                "whip (fouet)",
                "knife (couteau)",
                "baton (gourdin)",
                "trident",
                "halbard (hallebarde)",
                "morningStar (étoile du matin)",
                "flail (fléau)",
                "scimitar (cimeterre)",
                "sai",
                "hatchet (hachette)",
                "fryingPan (poêle à frire)",
                "keyboard (clavier)",
                "leek (poireau)",
                "mug (chope)",
                "mammothBone (os de mammouth)",
                "fan (éventail)",
                "racquet (raquette)",
                "noodleBowl (bol de nouilles)",
                "piopio",
                "trombone",
                "shuriken"
            ],
            "symbols_probables": "Symbol500-Symbol525"
        },
        "animaux": {
            "bear": "Ours",
            "dog": "Chien", 
            "panther": "Panthère",
            "symbols_probables": "Symbol600-Symbol602"
        },
        "instructions_jpexs": {
            "etape1": "Ouvrez JPEXS Free Flash Decompiler",
            "etape2": "File > Open > mini_perso.swf",
            "etape3": "Dans l'arbre à gauche, explorez 'sprites'",
            "etape4": "Cherchez DefineSprite (460) et DefineSprite (752)",
            "etape5": "Notez tous les Symbol IDs que vous trouvez",
            "conseil": "Les Symbol IDs sont dans l'ordre: DefineSprite (XXX)"
        }
    }
    
    # Créer un guide visuel
    visual_guide = """
GUIDE VISUEL POUR JPEXS
=======================

Quand vous ouvrez mini_perso.swf dans JPEXS, voici ce que vous verrez:

📁 mini_perso.swf
  📁 scripts/
  📁 sprites/
    📄 DefineSprite (460)  <-- HOMME COMPLET
    📄 DefineSprite (752)  <-- FEMME COMPLETE
    📄 DefineSprite (XXX)  <-- Autres sprites
  📁 shapes/
    📄 DefineShape (XXX)   <-- Formes individuelles
  📁 images/
  📁 frames/

COMMENT LIRE LES SYMBOL IDs:
- DefineSprite (460) → Symbol460
- DefineShape (123) → Symbol123

PRIORITÉ D'EXPLORATION:
1. Symbol460 (homme) - Cliquez dessus pour voir p1-p8
2. Symbol752 (femme) - Cliquez dessus pour voir p1-p8
3. Chaque partie (p1-p8) référence d'autres symbols
4. Notez chaque Symbol ID avec sa description
"""
    
    # Sauvegarder le mapping
    with open("labrute_symbols_guide.json", "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    with open("jpexs_visual_guide.txt", "w", encoding="utf-8") as f:
        f.write(visual_guide)
    
    # Créer un template pour noter les symbols
    template = """TEMPLATE POUR NOTER LES SYMBOL IDs
===================================

Date: _____________
Outil: JPEXS Free Flash Decompiler

PERSONNAGES PRINCIPAUX:
----------------------
Symbol460 = Personnage masculin complet ✓
Symbol752 = Personnage féminin complet ✓

PARTIES DU CORPS HOMME (dans Symbol460):
----------------------------------------
p1 (base) = Symbol____
p2 (musculature) variante 0 = Symbol____
p2 (musculature) variante 1 = Symbol____
p2 (musculature) variante 2 = Symbol____
p2 (musculature) variante 3 = Symbol____
p2 (musculature) variante 4 = Symbol____
p2 (musculature) variante 5 = Symbol____
p2 (musculature) variante 6 = Symbol____

p3 (cheveux) style 0 = Symbol____
p3 (cheveux) style 1 = Symbol____
[... continuer pour les 11 styles ...]

p4 (barbe) style 0 = Symbol____
[... continuer pour les 5 styles ...]

ARMES:
------
Épée = Symbol____
Hache = Symbol____
Lance = Symbol____
[... continuer pour toutes les armes ...]

ANIMAUX:
--------
Ours = Symbol____
Chien = Symbol____
Panthère = Symbol____

AUTRES ÉLÉMENTS:
----------------
Symbol____ = ________________
Symbol____ = ________________
"""
    
    with open("template_symbol_ids.txt", "w", encoding="utf-8") as f:
        f.write(template)
    
    print("[OK] Guide généré: labrute_symbols_guide.json")
    print("[OK] Guide visuel: jpexs_visual_guide.txt")
    print("[OK] Template: template_symbol_ids.txt")
    print("\nPour obtenir les Symbol IDs exacts:")
    print("1. Ouvrez JPEXS")
    print("2. Chargez mini_perso.swf")
    print("3. Utilisez le template pour noter chaque Symbol ID")

if __name__ == "__main__":
    generate_symbol_mapping()