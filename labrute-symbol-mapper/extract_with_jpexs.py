#!/usr/bin/env python3
"""
Extrait les Symbol IDs depuis mini_perso.swf en utilisant JPEXS
"""

import os
import subprocess
import json
import re
from pathlib import Path

def find_jpexs():
    """Trouve JPEXS sur le système"""
    possible_paths = [
        r"C:\Program Files\JPEXS Free Flash Decompiler\ffdec.jar",
        r"C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.jar",
        r"C:\jpexs\ffdec.jar"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    return None

def extract_symbols(jpexs_path, swf_file):
    """Extrait la liste des symboles du SWF"""
    print("Extraction des Symbol IDs...")
    
    # Créer le dossier de sortie
    output_dir = "jpexs_extraction"
    os.makedirs(output_dir, exist_ok=True)
    
    # Commande pour lister tous les éléments
    cmd = [
        "java", "-jar", jpexs_path,
        "-selectid", "1-9999",
        "-format", "sprite:text",
        "-export", "text", output_dir,
        swf_file
    ]
    
    try:
        # Export de base pour obtenir la structure
        print("Export de la structure...")
        result = subprocess.run([
            "java", "-jar", jpexs_path,
            "-export", "script",
            output_dir,
            swf_file
        ], capture_output=True, text=True)
        
        # Analyser les fichiers exportés pour trouver les Symbol IDs
        symbols = {}
        
        # Parcourir les fichiers exportés
        for root, dirs, files in os.walk(output_dir):
            for file in files:
                if "sprite" in file.lower() or "symbol" in file.lower():
                    # Extraire le numéro du symbol
                    match = re.search(r'(\d+)', file)
                    if match:
                        symbol_id = match.group(1)
                        symbols[f"Symbol{symbol_id}"] = {
                            "file": file,
                            "type": "sprite"
                        }
        
        # Ajouter les symboles connus
        symbols.update({
            "Symbol460": {
                "type": "DefineSprite",
                "description": "Personnage masculin complet",
                "contains": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p7b", "p8"]
            },
            "Symbol752": {
                "type": "DefineSprite", 
                "description": "Personnage féminin complet",
                "contains": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p7b", "p8"]
            }
        })
        
        return symbols
        
    except Exception as e:
        print(f"Erreur: {e}")
        return None

def create_symbol_mapping():
    """Crée le mapping complet des Symbol IDs"""
    print("=== Extraction des Symbol IDs LaBrute ===\n")
    
    # Trouver JPEXS
    jpexs = find_jpexs()
    if not jpexs:
        print("[ERREUR] JPEXS non trouvé!")
        print("JPEXS est installé mais je ne peux pas le localiser.")
        print("\nSolution manuelle:")
        print("1. Ouvrez JPEXS")
        print("2. File > Open > mini_perso.swf")
        print("3. Explorez l'arbre à gauche")
        print("4. Notez chaque DefineSprite avec son numéro")
        return
    
    # Trouver le SWF
    swf_file = None
    for path in ["mini_perso.swf", "../mini_perso.swf"]:
        if os.path.exists(path):
            swf_file = os.path.abspath(path)
            break
    
    if not swf_file:
        print("[ERREUR] mini_perso.swf non trouvé!")
        return
    
    print(f"[OK] SWF trouvé: {swf_file}")
    print(f"[OK] JPEXS trouvé: {jpexs}\n")
    
    # Extraire les symboles
    symbols = extract_symbols(jpexs, swf_file)
    
    if symbols:
        # Créer le mapping final
        mapping = {
            "personnages": {
                "Symbol460": "Personnage masculin complet",
                "Symbol752": "Personnage féminin complet"
            },
            "sprites_extraits": symbols,
            "structure": {
                "p1": "Base du corps",
                "p2": "Taille/Muscles (homme)",
                "p3": "Cheveux (11 styles)",
                "p4": "Barbe (homme) / Mèches (femme)",
                "p5": "Chemise/Haut",
                "p6": "Bas",
                "p7": "Vêtement principal",
                "p7b": "Dessous chaussures",
                "p8": "Chaussures"
            }
        }
        
        # Sauvegarder
        with open("symbol_ids_extraits.json", "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2, ensure_ascii=False)
        
        print(f"\n[OK] {len(symbols)} symboles trouvés!")
        print("[OK] Mapping sauvegardé: symbol_ids_extraits.json")
    else:
        print("\n[INFO] Ouverture manuelle de JPEXS recommandée")

if __name__ == "__main__":
    create_symbol_mapping()