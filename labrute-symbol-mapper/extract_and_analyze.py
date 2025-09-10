#!/usr/bin/env python3
"""
Script pour extraire et analyser les sprites de mini_perso.swf
Version sans dépendances externes complexes
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def check_jpexs():
    """Vérifie si JPEXS est disponible"""
    print("Recherche de JPEXS...")
    
    jpexs_paths = [
        r"C:\Program Files\JPEXS Free Flash Decompiler\ffdec.jar",
        r"C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.jar",
        "ffdec.jar",
        r"C:\jpexs\ffdec.jar"
    ]
    
    for path in jpexs_paths:
        if os.path.exists(path):
            print(f"[OK] JPEXS trouve : {path}")
            return path
    
    print("[ERREUR] JPEXS non trouve!")
    print("Telechargez-le depuis : https://github.com/jindrapetrik/jpexs-decompiler/releases")
    return None

def check_java():
    """Vérifie si Java est installé"""
    try:
        result = subprocess.run(["java", "-version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("[OK] Java est installe")
            return True
    except:
        pass
    
    print("[ERREUR] Java n'est pas installe!")
    print("Installez Java depuis : https://www.java.com/")
    return False

def find_swf():
    """Trouve le fichier mini_perso.swf"""
    print("\nRecherche de mini_perso.swf...")
    
    swf_paths = [
        "../mini_perso.swf",
        "../../mini_perso.swf",
        "../client/public/mini_perso.swf",
        "mini_perso.swf"
    ]
    
    for path in swf_paths:
        if os.path.exists(path):
            print(f"[OK] SWF trouve : {path}")
            return os.path.abspath(path)
    
    print("[ERREUR] mini_perso.swf introuvable!")
    return None

def extract_sprites(jpexs_jar, swf_file, output_dir="sprites_extraits"):
    """Extrait les sprites du SWF"""
    print(f"\nExtraction des sprites vers {output_dir}...")
    
    # Créer le dossier de sortie
    os.makedirs(output_dir, exist_ok=True)
    
    # Commande JPEXS pour extraire TOUT
    cmd = [
        "java", "-jar", jpexs_jar,
        "-export", "all",
        output_dir,
        swf_file
    ]
    
    print("Commande : " + " ".join(cmd))
    print("Extraction en cours... (peut prendre quelques minutes)")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("[OK] Extraction terminee!")
            
            # Compter les fichiers extraits
            total_files = 0
            for root, dirs, files in os.walk(output_dir):
                total_files += len(files)
            
            print(f"[INFO] {total_files} fichiers extraits")
            return True
        else:
            print(f"[ERREUR] {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERREUR] {str(e)}")
        return False

def analyze_extracted_files(output_dir="sprites_extraits"):
    """Analyse les fichiers extraits et crée un mapping basique"""
    print(f"\nAnalyse des fichiers extraits dans {output_dir}...")
    
    if not os.path.exists(output_dir):
        print("[ERREUR] Dossier non trouve")
        return
    
    # Structure pour stocker le mapping
    mapping = {
        "sprites": {},
        "shapes": {},
        "images": {},
        "autres": {}
    }
    
    # Parcourir les fichiers
    for root, dirs, files in os.walk(output_dir):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, output_dir)
            
            # Extraire le numéro du symbol si possible
            symbol_match = None
            if "symbol" in file.lower():
                # Chercher un numéro dans le nom
                import re
                numbers = re.findall(r'\d+', file)
                if numbers:
                    symbol_match = numbers[0]
            
            # Classifier par type
            if "sprite" in rel_path.lower():
                category = "sprites"
            elif "shape" in rel_path.lower():
                category = "shapes"
            elif file.endswith(('.png', '.jpg', '.jpeg')):
                category = "images"
            else:
                category = "autres"
            
            # Ajouter au mapping
            if symbol_match:
                key = f"Symbol{symbol_match}"
                mapping[category][key] = {
                    "file": rel_path,
                    "type": "a_determiner",
                    "description": f"Extrait de {file}"
                }
    
    # Sauvegarder le mapping
    mapping_file = "mapping_extrait_auto.json"
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Mapping sauvegarde : {mapping_file}")
    
    # Afficher un résumé
    print("\nResume de l'extraction :")
    for category, items in mapping.items():
        if items:
            print(f"  {category} : {len(items)} elements")
            # Afficher les 5 premiers
            for i, (key, value) in enumerate(items.items()):
                if i >= 5:
                    print(f"    ... et {len(items) - 5} autres")
                    break
                print(f"    - {key} : {value['file']}")

def create_visual_index(output_dir="sprites_extraits"):
    """Crée un index HTML pour visualiser les sprites extraits"""
    print("\nCreation de l'index visuel...")
    
    html = """<!DOCTYPE html>
<html>
<head>
    <title>LaBrute Sprites Extraits</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .category { margin: 20px 0; }
        .sprites { display: flex; flex-wrap: wrap; gap: 10px; }
        .sprite { border: 1px solid #ccc; padding: 10px; text-align: center; }
        .sprite img { max-width: 100px; max-height: 100px; display: block; }
        .sprite .name { font-size: 12px; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>LaBrute - Sprites Extraits</h1>
"""
    
    # Lister tous les PNG
    png_files = []
    for root, dirs, files in os.walk(output_dir):
        for file in files:
            if file.endswith('.png'):
                rel_path = os.path.relpath(os.path.join(root, file), output_dir)
                png_files.append(rel_path)
    
    # Grouper par dossier
    by_folder = {}
    for png in png_files:
        folder = os.path.dirname(png) or "racine"
        if folder not in by_folder:
            by_folder[folder] = []
        by_folder[folder].append(png)
    
    # Générer le HTML
    for folder, files in sorted(by_folder.items()):
        html += f'<div class="category"><h2>{folder}</h2><div class="sprites">'
        
        for file in sorted(files)[:20]:  # Limiter à 20 par dossier
            name = os.path.basename(file)
            html += f'''
            <div class="sprite">
                <img src="{output_dir}/{file.replace(os.sep, '/')}" alt="{name}">
                <div class="name">{name}</div>
            </div>
            '''
        
        if len(files) > 20:
            html += f'<div class="sprite">... et {len(files) - 20} autres</div>'
        
        html += '</div></div>'
    
    html += """
</body>
</html>
"""
    
    # Sauvegarder
    index_file = "sprites_index.html"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"[OK] Index visuel cree : {index_file}")
    print("Ouvrez ce fichier dans votre navigateur pour voir les sprites!")

def main():
    print("=== LaBrute Symbol Extractor ===")
    print("Version automatique sans GPT-4\n")
    
    # Vérifications
    if not check_java():
        return
    
    jpexs_jar = check_jpexs()
    if not jpexs_jar:
        return
    
    swf_file = find_swf()
    if not swf_file:
        return
    
    # Menu
    print("\nQue voulez-vous faire ?")
    print("1. Extraire tous les sprites")
    print("2. Analyser les sprites deja extraits")
    print("3. Creer un index visuel HTML")
    print("4. Tout faire (1 + 2 + 3)")
    
    choice = input("\nVotre choix : ").strip()
    
    if choice == "1" or choice == "4":
        if extract_sprites(jpexs_jar, swf_file):
            print("\n[OK] Extraction reussie!")
        else:
            print("\n[ERREUR] Extraction echouee")
            return
    
    if choice == "2" or choice == "4":
        analyze_extracted_files()
    
    if choice == "3" or choice == "4":
        create_visual_index()
    
    print("\n[TERMINE] Consultez les fichiers generes :")
    print("- sprites_extraits/ : Tous les fichiers extraits")
    print("- mapping_extrait_auto.json : Mapping basique")
    print("- sprites_index.html : Index visuel")

if __name__ == "__main__":
    main()