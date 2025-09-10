#!/usr/bin/env python3
"""
Script simple pour extraire et analyser mini_perso.swf sans GPT-4
Utilise des heuristiques simples pour classifier les sprites
"""

import os
import json
import shutil
from pathlib import Path
from PIL import Image
import subprocess

def extract_swf_simple():
    """Extrait le SWF en utilisant JPEXS en mode batch"""
    print("🔍 Recherche de mini_perso.swf...")
    
    # Chercher le SWF
    swf_paths = [
        "../mini_perso.swf",
        "../../mini_perso.swf", 
        "../client/public/mini_perso.swf",
        "./mini_perso.swf"
    ]
    
    swf_path = None
    for path in swf_paths:
        if os.path.exists(path):
            swf_path = path
            print(f"✅ Trouvé : {path}")
            break
    
    if not swf_path:
        print("❌ mini_perso.swf introuvable !")
        return False
    
    # Créer le dossier de sortie
    output_dir = "sprites_extraits_simple"
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)
    
    print(f"📁 Extraction vers : {output_dir}")
    
    # Méthode alternative sans JPEXS (si pas installé)
    print("\n💡 Options d'extraction :")
    print("1. Avec JPEXS (recommandé)")
    print("2. Copier les sprites déjà extraits")
    
    choice = input("\nVotre choix (1 ou 2) : ").strip()
    
    if choice == "1":
        # Utiliser JPEXS
        return extract_with_jpexs_batch(swf_path, output_dir)
    else:
        # Copier depuis le sprite editor
        sprite_editor_path = "../labrute-sprite-editor"
        if os.path.exists(sprite_editor_path):
            print(f"📂 Copie depuis {sprite_editor_path}...")
            # Chercher des images
            copied = 0
            for ext in ['*.png', '*.jpg']:
                for img in Path(sprite_editor_path).rglob(ext):
                    if 'symbol' in img.name.lower():
                        dest = Path(output_dir) / img.name
                        shutil.copy2(img, dest)
                        copied += 1
            print(f"✅ {copied} images copiées")
            return copied > 0
        else:
            print("❌ Dossier sprite editor introuvable")
            return False

def extract_with_jpexs_batch(swf_path, output_dir):
    """Extraction avec JPEXS en mode batch"""
    # Chercher JPEXS
    jpexs_paths = [
        "ffdec.jar",
        r"C:\Program Files\JPEXS Free Flash Decompiler\ffdec.jar",
        r"C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.jar"
    ]
    
    jpexs_jar = None
    for path in jpexs_paths:
        if os.path.exists(path):
            jpexs_jar = path
            break
    
    if not jpexs_jar:
        print("❌ JPEXS introuvable. Utilisez l'option 2.")
        return False
    
    # Commande d'extraction
    cmd = [
        "java", "-jar", jpexs_jar,
        "-export", "image",
        "-format", "image:png",
        output_dir,
        swf_path
    ]
    
    print("🚀 Extraction en cours...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            # Compter les fichiers
            png_count = len(list(Path(output_dir).glob("**/*.png")))
            print(f"✅ {png_count} images extraites")
            return True
        else:
            print(f"❌ Erreur : {result.stderr}")
            return False
    except:
        print("❌ Java non installé ou erreur d'exécution")
        return False

def analyze_sprite_simple(image_path):
    """Analyse simple d'un sprite basée sur des heuristiques"""
    img = Image.open(image_path)
    width, height = img.size
    aspect_ratio = width / height if height > 0 else 1
    
    # Nom du fichier
    filename = image_path.name.lower()
    
    # Classification basique par taille et nom
    sprite_type = "unknown"
    subtype = ""
    
    # Heuristiques simples
    if width < 20 and height < 20:
        sprite_type = "ui_element"
        subtype = "petit élément"
    elif aspect_ratio > 2:  # Très large
        sprite_type = "weapon"
        subtype = "arme horizontale"
    elif aspect_ratio < 0.5:  # Très haut
        sprite_type = "weapon"
        subtype = "arme verticale"
    elif 40 <= width <= 100 and 40 <= height <= 100:
        if aspect_ratio > 0.8 and aspect_ratio < 1.2:  # Carré
            sprite_type = "head"
            subtype = "tête possible"
        else:
            sprite_type = "body_part"
            subtype = "partie du corps"
    elif width > 150 or height > 150:
        sprite_type = "full_character"
        subtype = "personnage complet"
    
    # Analyse par nom
    if "head" in filename or "tete" in filename:
        sprite_type = "head"
    elif "body" in filename or "corps" in filename:
        sprite_type = "body"
    elif "arm" in filename or "bras" in filename:
        sprite_type = "arm"
    elif "leg" in filename or "jambe" in filename:
        sprite_type = "leg"
    elif "weapon" in filename or "arme" in filename:
        sprite_type = "weapon"
    elif "hair" in filename or "cheveux" in filename:
        sprite_type = "hair"
    
    # Extraire l'ID
    symbol_id = "unknown"
    if "symbol" in filename:
        # Essayer d'extraire le numéro
        parts = filename.replace("symbol", "").replace(".png", "").strip("_- ")
        if parts.isdigit():
            symbol_id = parts
    else:
        # Utiliser le nom sans extension
        symbol_id = Path(filename).stem
    
    return {
        "id": symbol_id,
        "filename": image_path.name,
        "type": sprite_type,
        "subtype": subtype,
        "dimensions": {"width": width, "height": height},
        "aspect_ratio": round(aspect_ratio, 2),
        "confidence": 0.5,  # Confiance faible car heuristique
        "method": "heuristic"
    }

def create_simple_mapping():
    """Crée un mapping simple sans GPT-4"""
    sprites_dir = Path("sprites_extraits_simple")
    
    if not sprites_dir.exists():
        print("❌ Dossier sprites_extraits_simple introuvable")
        print("Lancez d'abord l'extraction")
        return
    
    # Lister tous les PNG
    png_files = list(sprites_dir.glob("**/*.png"))
    print(f"\n📊 Analyse de {len(png_files)} sprites...")
    
    mapping = {}
    
    # Analyser chaque sprite
    for i, img_path in enumerate(png_files):
        if i % 10 == 0:
            print(f"  Progression : {i}/{len(png_files)}")
        
        analysis = analyze_sprite_simple(img_path)
        mapping[analysis["id"]] = analysis
    
    # Statistiques
    type_counts = {}
    for data in mapping.values():
        t = data["type"]
        type_counts[t] = type_counts.get(t, 0) + 1
    
    print("\n📈 Résultats :")
    for sprite_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sprite_type}: {count}")
    
    # Sauvegarder
    output = {
        "version": "1.0",
        "analyzer": "heuristic",
        "total_symbols": len(mapping),
        "symbols": mapping
    }
    
    with open("labrute_mapping_simple.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Mapping sauvegardé : labrute_mapping_simple.json")
    print(f"📊 Total : {len(mapping)} sprites mappés")

def export_symbol_list():
    """Exporte une liste simple des Symbol IDs"""
    mapping_file = "labrute_mapping_simple.json"
    
    if not os.path.exists(mapping_file):
        print("❌ Fichier mapping introuvable. Lancez d'abord l'analyse.")
        return
    
    with open(mapping_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    symbols = data["symbols"]
    
    # Créer une liste triée
    symbol_list = []
    for sid, sdata in symbols.items():
        symbol_list.append({
            "id": sid,
            "type": sdata["type"],
            "subtype": sdata.get("subtype", ""),
            "size": f"{sdata['dimensions']['width']}x{sdata['dimensions']['height']}"
        })
    
    # Trier par ID (numérique si possible)
    def sort_key(item):
        try:
            return int(item["id"])
        except:
            return item["id"]
    
    symbol_list.sort(key=sort_key)
    
    # Exporter en texte simple
    with open("symbol_list.txt", "w", encoding="utf-8") as f:
        f.write("LISTE DES SYMBOLS LABRUTE\n")
        f.write("=" * 50 + "\n\n")
        
        current_type = None
        for item in symbol_list:
            # Grouper par type
            if item["type"] != current_type:
                current_type = item["type"]
                f.write(f"\n--- {current_type.upper()} ---\n")
            
            f.write(f"Symbol {item['id']}: {item['size']} - {item['subtype']}\n")
    
    print("✅ Liste exportée : symbol_list.txt")

if __name__ == "__main__":
    print("🎮 LaBrute Symbol Mapper - Version Simple")
    print("=" * 50)
    print("Mapping SANS GPT-4 Vision (gratuit)\n")
    
    print("1. Extraire les sprites du SWF")
    print("2. Analyser les sprites extraits")
    print("3. Exporter la liste des symbols")
    print("4. Tout faire (1 + 2 + 3)")
    
    choice = input("\nVotre choix : ").strip()
    
    if choice == "1":
        extract_swf_simple()
    elif choice == "2":
        create_simple_mapping()
    elif choice == "3":
        export_symbol_list()
    elif choice == "4":
        if extract_swf_simple():
            create_simple_mapping()
            export_symbol_list()
    else:
        print("Choix invalide")