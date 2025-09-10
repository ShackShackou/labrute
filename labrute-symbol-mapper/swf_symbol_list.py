#!/usr/bin/env python3
"""
Script pour lister les symboles du SWF sans extraction complète
Utilise swftools si disponible, sinon donne les instructions
"""

import os
import sys
import subprocess
import struct

def read_swf_header(filename):
    """Lit l'en-tête SWF pour info basique"""
    print(f"\nAnalyse de {filename}...")
    
    with open(filename, 'rb') as f:
        # Signature
        signature = f.read(3).decode('ascii', errors='ignore')
        print(f"Signature: {signature}")
        
        # Version
        version = struct.unpack('B', f.read(1))[0]
        print(f"Version: {version}")
        
        # Taille du fichier
        file_length = struct.unpack('<I', f.read(4))[0]
        print(f"Taille: {file_length} bytes")

def check_swftools():
    """Vérifie si swftools est installé"""
    try:
        result = subprocess.run(["swfdump", "--help"], capture_output=True)
        if result.returncode == 0:
            return True
    except:
        pass
    return False

def extract_symbol_names_with_swftools(swf_file):
    """Extrait les noms des symboles avec swftools"""
    print("\nExtraction des symboles avec swftools...")
    
    cmd = ["swfdump", "-D", swf_file]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            
            symbols = []
            for line in lines:
                # Chercher les DefineSprite
                if "DEFINESPRITE" in line:
                    # Format: [00c] 12345 DEFINESPRITE defines id 0123
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == "id" and i+1 < len(parts):
                            symbol_id = parts[i+1]
                            symbols.append(f"Symbol{symbol_id}")
                            break
            
            return symbols
        else:
            print(f"Erreur swfdump: {result.stderr}")
            return None
    except Exception as e:
        print(f"Erreur: {e}")
        return None

def manual_swf_parse(filename):
    """Parse manuel basique du SWF pour trouver des indices de symboles"""
    print("\nAnalyse manuelle du SWF...")
    
    known_symbols = {
        460: "Personnage masculin complet",
        752: "Personnage féminin complet"
    }
    
    print("\nSymboles connus dans LaBrute:")
    for sid, desc in known_symbols.items():
        print(f"  Symbol{sid} = {desc}")
    
    print("\nPour une liste complète, vous avez besoin de:")
    print("1. JPEXS Free Flash Decompiler (GUI)")
    print("2. Ou swftools (ligne de commande)")
    print("\nTéléchargez swftools depuis: http://www.swftools.org/download.html")

def main():
    print("=== LaBrute SWF Symbol Lister ===\n")
    
    # Trouver le SWF
    swf_paths = [
        "../mini_perso.swf",
        "../../mini_perso.swf",
        "../client/public/mini_perso.swf",
        "mini_perso.swf"
    ]
    
    swf_file = None
    for path in swf_paths:
        if os.path.exists(path):
            swf_file = os.path.abspath(path)
            break
    
    if not swf_file:
        print("[ERREUR] mini_perso.swf introuvable!")
        return
    
    print(f"[OK] SWF trouvé: {swf_file}")
    
    # Lire l'en-tête
    read_swf_header(swf_file)
    
    # Vérifier swftools
    if check_swftools():
        print("\n[OK] swftools détecté!")
        symbols = extract_symbol_names_with_swftools(swf_file)
        
        if symbols:
            print(f"\n{len(symbols)} symboles trouvés!")
            print("\nPremiers symboles:")
            for sym in symbols[:20]:
                print(f"  - {sym}")
            
            # Sauvegarder la liste
            with open("symbol_list.txt", "w") as f:
                for sym in symbols:
                    f.write(f"{sym}\n")
            
            print(f"\nListe complète sauvegardée dans: symbol_list.txt")
        else:
            print("\n[ERREUR] Impossible d'extraire les symboles")
    else:
        print("\n[INFO] swftools non trouvé")
        manual_swf_parse(swf_file)

if __name__ == "__main__":
    main()