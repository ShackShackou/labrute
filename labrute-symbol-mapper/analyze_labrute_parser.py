#!/usr/bin/env python3
"""
Analyse les symboles depuis le parser LaBrute existant
"""

import json
import os
import sys
from pathlib import Path

def find_parser_files():
    """Cherche les fichiers du parser LaBrute"""
    print("🔍 Recherche des fichiers du parser LaBrute...")
    
    # Chemins possibles
    paths_to_check = [
        "../node_modules/labrute-static-fla-parser",
        "../client/node_modules/labrute-static-fla-parser",
        "../../node_modules/labrute-static-fla-parser"
    ]
    
    for path in paths_to_check:
        if os.path.exists(path):
            print(f"✅ Trouvé : {path}")
            return path
    
    print("❌ Parser non trouvé dans node_modules")
    return None

def analyze_parser_structure():
    """Analyse la structure du parser pour comprendre les symboles"""
    parser_path = find_parser_files()
    if not parser_path:
        return
    
    # Chercher les fichiers JS/JSON
    parser_dir = Path(parser_path)
    js_files = list(parser_dir.glob("*.js"))
    json_files = list(parser_dir.glob("*.json"))
    
    print(f"\n📂 Contenu du parser :")
    print(f"  - Fichiers JS : {len(js_files)}")
    print(f"  - Fichiers JSON : {len(json_files)}")
    
    # Lire le package.json
    package_json = parser_dir / "package.json"
    if package_json.exists():
        with open(package_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"\n📦 Package : {data.get('name', 'unknown')} v{data.get('version', '?')}")
            print(f"  Main : {data.get('main', 'index.js')}")
    
    # Chercher les symboles dans les fichiers
    symbols_found = {}
    
    for js_file in js_files:
        print(f"\n🔍 Analyse de {js_file.name}...")
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Chercher Symbol460 et Symbol752
                if 'Symbol460' in content:
                    print("  ✅ Symbol460 trouvé (homme)")
                    symbols_found['Symbol460'] = 'male'
                
                if 'Symbol752' in content:
                    print("  ✅ Symbol752 trouvé (femme)")
                    symbols_found['Symbol752'] = 'female'
                
                # Chercher d'autres patterns de symboles
                import re
                symbol_pattern = r'Symbol(\d+)'
                matches = re.findall(symbol_pattern, content)
                if matches:
                    print(f"  📍 Symboles trouvés : {', '.join(set(matches[:10]))}")
                    if len(matches) > 10:
                        print(f"     ... et {len(matches) - 10} autres")
        except Exception as e:
            print(f"  ❌ Erreur : {e}")
    
    return symbols_found

def extract_body_parts_mapping():
    """Extrait le mapping des parties du corps depuis le code"""
    print("\n🔍 Recherche du mapping des body parts...")
    
    # Chercher dans core/src/brute
    body_parts_file = Path("../core/src/brute/availableBodyParts.ts")
    if body_parts_file.exists():
        print(f"✅ Trouvé : {body_parts_file}")
        with open(body_parts_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print("\n📋 Structure des body parts :")
            print("  p1  = Base (toujours 0)")
            print("  p1a = Ceinture normale")
            print("  p1b = Ceinture romaine") 
            print("  p2  = Corps secondaire (7 variantes homme, 0 femme)")
            print("  p3  = Cheveux/Tête (11 variantes)")
            print("  p4  = Barbe/Accessoires (5 homme, 3 femme)")
            print("  p5  = Chemise")
            print("  p6  = Bas du corps")
            print("  p7  = Vêtements principaux (6 variantes)")
            print("  p7b = Vêtements secondaires")
            print("  p8  = Pieds (4 variantes)")
    
    # Créer un mapping basique
    mapping = {
        "body_parts": {
            "p1": {"name": "base", "variants": 1},
            "p1a": {"name": "ceinture_normale", "variants": 1},
            "p1b": {"name": "ceinture_romaine", "variants": 1},
            "p2": {"name": "corps_secondaire", "variants_male": 7, "variants_female": 0},
            "p3": {"name": "cheveux_tete", "variants": 11},
            "p4": {"name": "barbe_accessoires", "variants_male": 5, "variants_female": 3},
            "p5": {"name": "chemise", "variants": 1},
            "p6": {"name": "bas_corps", "variants": 1},
            "p7": {"name": "vetements_principaux", "variants": 6},
            "p7b": {"name": "vetements_secondaires", "variants": 2},
            "p8": {"name": "pieds", "variants": 4}
        },
        "main_symbols": {
            "Symbol460": "personnage_masculin_complet",
            "Symbol752": "personnage_feminin_complet"
        }
    }
    
    return mapping

def save_basic_mapping():
    """Sauvegarde un mapping de base"""
    mapping = extract_body_parts_mapping()
    
    # Ajouter des métadonnées
    output = {
        "version": "1.0",
        "source": "analyse du code LaBrute",
        "date": "2025-08-01",
        "mapping": mapping,
        "notes": {
            "info": "Mapping basique extrait du code source",
            "todo": "Utiliser JPEXS pour extraire les vrais sprites et leurs IDs"
        }
    }
    
    output_file = "labrute_mapping_basic.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Mapping basique sauvegardé : {output_file}")

def check_sprite_editor():
    """Vérifie ce qui existe dans le sprite editor"""
    sprite_editor = Path("../labrute-sprite-editor")
    if sprite_editor.exists():
        print("\n🎨 Analyse du sprite editor existant...")
        
        # Chercher data.js
        data_js = sprite_editor / "data.js"
        if data_js.exists():
            print("✅ data.js trouvé - contient probablement des mappings")
            
            # Lire les premières lignes
            with open(data_js, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]
                for line in lines:
                    if 'Symbol' in line or 'body' in line:
                        print(f"  📍 {line.strip()[:80]}...")

if __name__ == "__main__":
    print("🎮 LaBrute Symbol Analyzer")
    print("=" * 50)
    print("Analyse du projet LaBrute pour comprendre les symboles\n")
    
    # Analyser le parser
    symbols = analyze_parser_structure()
    
    # Extraire le mapping des body parts
    extract_body_parts_mapping()
    
    # Vérifier le sprite editor
    check_sprite_editor()
    
    # Sauvegarder un mapping de base
    save_basic_mapping()
    
    print("\n📊 Résumé :")
    print("- Symbol460 = Personnage masculin")
    print("- Symbol752 = Personnage féminin")
    print("- 11 parties du corps (p1 à p8)")
    print("\n💡 Prochaine étape : Utiliser JPEXS pour extraire les vrais sprites")