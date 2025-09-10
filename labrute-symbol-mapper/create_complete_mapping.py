#!/usr/bin/env python3
"""
Crée un mapping complet des symboles LaBrute en utilisant les données existantes
"""

import json
import os
from pathlib import Path

def create_complete_mapping():
    """Crée un mapping complet basé sur les données du sprite editor"""
    
    print("Creation du mapping complet LaBrute")
    print("=" * 50)
    
    # Structure complète du mapping
    mapping = {
        "version": "2.0",
        "source": "labrute-sprite-editor + analyse du code",
        "date": "2025-08-01",
        "main_symbols": {
            "Symbol460": {
                "name": "Personnage masculin complet",
                "type": "full_character",
                "gender": "male",
                "description": "Symbole principal contenant toutes les animations du personnage masculin"
            },
            "Symbol752": {
                "name": "Personnage féminin complet", 
                "type": "full_character",
                "gender": "female",
                "description": "Symbole principal contenant toutes les animations du personnage féminin"
            }
        },
        "body_parts": {
            "p1": {
                "name": "Base",
                "description": "Élément de base de la brute (toujours présent)",
                "category": "Base",
                "variants": 1,
                "symbol_range": "1-50"
            },
            "p1a": {
                "name": "Ceinture",
                "description": "Ceinture basique autour de la taille",
                "category": "Accessoires",
                "variants": 1,
                "symbol_range": "51-60"
            },
            "p1b": {
                "name": "Ceinture Romaine",
                "description": "Ceinture de style romain/gladiateur",
                "category": "Accessoires",
                "variants": 1,
                "symbol_range": "61-70"
            },
            "p2": {
                "name": "Taille du Corps",
                "description": "Détermine la corpulence de la brute (hommes seulement)",
                "category": "Corps",
                "variants_male": 7,
                "variants_female": 0,
                "symbol_range": "100-170"
            },
            "p3": {
                "name": "Cheveux/Coiffure",
                "description": "Style de cheveux de la brute",
                "category": "Tête",
                "variants": 11,
                "symbol_range": "200-310"
            },
            "p4": {
                "name": "Barbe (H) / Mèches (F)",
                "description": "Barbe pour les hommes, mèches avant pour les femmes",
                "category": "Tête",
                "variants_male": 5,
                "variants_female": 3,
                "symbol_range": "320-380"
            },
            "p5": {
                "name": "Chemise/Haut",
                "description": "Port d'un haut ou torse nu",
                "category": "Vêtements",
                "variants": 1,
                "symbol_range": "400-410"
            },
            "p6": {
                "name": "Bas",
                "description": "Type de vêtement pour le bas du corps",
                "category": "Vêtements",
                "variants": 1,
                "symbol_range": "420-430"
            },
            "p7": {
                "name": "Vêtement Principal",
                "description": "Tenue principale du combattant",
                "category": "Vêtements",
                "variants": 6,
                "symbol_range": "500-560"
            },
            "p7b": {
                "name": "Dessous de Chaussures",
                "description": "Visibilité de la semelle des chaussures",
                "category": "Accessoires",
                "variants": 2,
                "symbol_range": "570-590"
            },
            "p8": {
                "name": "Chaussures (Buggé)",
                "description": "Censé être les chaussures mais ne change rien visuellement (bug du jeu)",
                "category": "Accessoires",
                "variants": 4,
                "symbol_range": "600-640"
            }
        },
        "colors": {
            "col0": {"name": "Couleur de Peau", "type": "skin"},
            "col0a": {"name": "Couleur du Visage", "type": "skin"},
            "col0c": {"name": "Couleur des Oreilles", "type": "skin"},
            "col1": {"name": "Couleur des Cheveux", "type": "hair"},
            "col1a": {"name": "Cheveux Arrière", "type": "hair"},
            "col1b": {"name": "Cheveux Arrière 2", "type": "hair"},
            "col1c": {"name": "Cheveux Avant", "type": "hair"},
            "col1d": {"name": "Sourcils", "type": "hair"},
            "col2": {"name": "Couleur Secondaire", "type": "clothing"},
            "col2a": {"name": "Accent 3", "type": "clothing"},
            "col2b": {"name": "Accent 1", "type": "clothing"},
            "col3": {"name": "Couleur Primaire (inclut les yeux)", "type": "clothing"},
            "col3b": {"name": "Accent 2", "type": "clothing"},
            "col4": {"name": "Couleur de la Chemise", "type": "clothing"},
            "col4a": {"name": "Accent des Chaussures", "type": "clothing"},
            "col4b": {"name": "Couleur Mystère", "type": "clothing"}
        },
        "animations": {
            "idle": "Animation de repos",
            "walk": "Animation de marche",
            "run": "Animation de course",
            "hit": "Animation de frappe",
            "block": "Animation de blocage",
            "evade": "Animation d'esquive",
            "hurt": "Animation de blessure",
            "death": "Animation de mort",
            "win": "Animation de victoire",
            "throw": "Animation de lancer",
            "grab": "Animation de saisie"
        },
        "weapons": {
            "fist": "Poings",
            "sword": "Épée",
            "axe": "Hache", 
            "lance": "Lance",
            "hammer": "Marteau",
            "whip": "Fouet",
            "knife": "Couteau",
            "shield": "Bouclier",
            "mug": "Chope",
            "fan": "Éventail",
            "keyboard": "Clavier",
            "leek": "Poireau",
            "fryingPan": "Poêle à frire",
            "noodleBowl": "Bol de nouilles"
        },
        "estimated_symbol_ids": {
            "1-99": "Éléments de base et système",
            "100-199": "Corps et corpulence",
            "200-399": "Têtes, cheveux et accessoires faciaux",
            "400-499": "Vêtements hauts",
            "500-599": "Vêtements principaux et accessoires",
            "600-699": "Pieds et chaussures",
            "700-799": "Armes",
            "800-899": "Effets et animations spéciales",
            "900-999": "Éléments divers"
        },
        "notes": {
            "important": [
                "Les Symbol IDs exacts nécessitent l'extraction avec JPEXS",
                "Le système utilise des symboles imbriqués (symboles dans symboles)",
                "Ne jamais modifier les IDs existants, seulement ajouter après le dernier",
                "Symbol460 et Symbol752 sont les conteneurs principaux"
            ],
            "bugs_connus": [
                "p8 (chaussures) ne s'affiche pas correctement",
                "Certaines combinaisons de couleurs peuvent créer des conflits"
            ]
        }
    }
    
    # Sauvegarder le mapping complet
    output_file = "labrute_complete_mapping.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Mapping complet cree : {output_file}")
    
    # Créer aussi une version simplifiée pour référence rapide
    simple_mapping = {
        "body_parts": {
            part: {
                "name": info["name"],
                "variants": info.get("variants", 
                    f"{info.get('variants_male', 0)}/{info.get('variants_female', 0)}")
            }
            for part, info in mapping["body_parts"].items()
        },
        "main_symbols": {
            "Symbol460": "Homme",
            "Symbol752": "Femme"
        }
    }
    
    simple_file = "labrute_simple_reference.json"
    with open(simple_file, 'w', encoding='utf-8') as f:
        json.dump(simple_mapping, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Reference simplifiee : {simple_file}")
    
    # Afficher un résumé
    print("\nResume du mapping :")
    print(f"  - Symboles principaux : 2 (homme/femme)")
    print(f"  - Parties du corps : {len(mapping['body_parts'])}")
    print(f"  - Canaux de couleur : {len(mapping['colors'])}")
    print(f"  - Types d'animations : {len(mapping['animations'])}")
    print(f"  - Armes référencées : {len(mapping['weapons'])}")
    
    return mapping

def generate_documentation():
    """Génère une documentation Markdown du mapping"""
    
    mapping = create_complete_mapping()
    
    doc = """# 📋 Documentation complète des Symboles LaBrute

## 🎯 Symboles Principaux

- **Symbol460** : Personnage masculin complet (contient toutes les animations)
- **Symbol752** : Personnage féminin complet (contient toutes les animations)

## 🧩 Parties du Corps (Body Parts)

| Code | Nom | Description | Variantes H/F |
|------|-----|-------------|---------------|
"""
    
    for part, info in mapping["body_parts"].items():
        variants = info.get("variants", "")
        if not variants:
            variants = f"{info.get('variants_male', 0)}/{info.get('variants_female', 0)}"
        doc += f"| {part} | {info['name']} | {info['description']} | {variants} |\n"
    
    doc += """
## 🎨 Système de Couleurs

| Code | Nom | Type |
|------|-----|------|
"""
    
    for color, info in mapping["colors"].items():
        doc += f"| {color} | {info['name']} | {info['type']} |\n"
    
    doc += """
## 🎬 Animations Disponibles

"""
    
    for anim, desc in mapping["animations"].items():
        doc += f"- **{anim}** : {desc}\n"
    
    doc += """
## ⚔️ Armes

"""
    
    for weapon, name in mapping["weapons"].items():
        doc += f"- **{weapon}** : {name}\n"
    
    doc += """
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
"""
    
    doc_file = "LABRUTE_SYMBOLS_DOCUMENTATION.md"
    with open(doc_file, 'w', encoding='utf-8') as f:
        f.write(doc)
    
    print(f"[OK] Documentation creee : {doc_file}")

if __name__ == "__main__":
    create_complete_mapping()
    generate_documentation()
    
    print("\nMapping complet termine !")
    print("\nFichiers créés :")
    print("  - labrute_complete_mapping.json (mapping détaillé)")
    print("  - labrute_simple_reference.json (référence rapide)")
    print("  - LABRUTE_SYMBOLS_DOCUMENTATION.md (documentation)")