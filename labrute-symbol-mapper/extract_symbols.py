import subprocess
import os
from pathlib import Path
import shutil
import sys

def find_jpexs():
    """Cherche JPEXS dans les emplacements communs"""
    possible_paths = [
        r"C:\Program Files\JPEXS Free Flash Decompiler\ffdec.jar",
        r"C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.jar",
        r"C:\jpexs\ffdec.jar",
        "./ffdec.jar",
        "../ffdec.jar"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # Si introuvable
    print("❌ JPEXS introuvable !")
    print("Téléchargez-le depuis : https://github.com/jindrapetrik/jpexs-decompiler/releases")
    print("Puis placez ffdec.jar dans ce dossier")
    return None

def extract_with_jpexs(swf_path: str, output_dir: str):
    """Extrait tous les sprites d'un SWF avec JPEXS"""
    
    # Vérifier que le SWF existe
    if not os.path.exists(swf_path):
        print(f"❌ Fichier SWF introuvable : {swf_path}")
        # Chercher dans le projet parent
        parent_swf = "../mini_perso.swf"
        if os.path.exists(parent_swf):
            print(f"✅ Trouvé dans le dossier parent : {parent_swf}")
            swf_path = parent_swf
        else:
            print("Placez mini_perso.swf dans ce dossier ou le dossier parent")
            return False
    
    # Trouver JPEXS
    jpexs_path = find_jpexs()
    if not jpexs_path:
        return False
    
    # Créer le dossier de sortie
    Path(output_dir).mkdir(exist_ok=True)
    
    # Commande JPEXS pour extraire les images
    cmd = [
        "java", "-jar", jpexs_path,
        "-export", "image",  # Exporter toutes les images
        output_dir,
        swf_path
    ]
    
    print(f"🔧 Extraction des sprites de {swf_path}...")
    print(f"📁 Vers : {output_dir}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            # Compter les fichiers extraits
            png_files = list(Path(output_dir).glob("**/*.png"))
            jpg_files = list(Path(output_dir).glob("**/*.jpg"))
            total_files = len(png_files) + len(jpg_files)
            
            print(f"✅ {total_files} images extraites !")
            print(f"   - PNG : {len(png_files)}")
            print(f"   - JPG : {len(jpg_files)}")
            
            # Afficher quelques exemples
            if png_files:
                print("\n📋 Exemples de fichiers extraits :")
                for i, file in enumerate(png_files[:5]):
                    print(f"   - {file.name}")
                if len(png_files) > 5:
                    print(f"   ... et {len(png_files) - 5} autres")
                    
            return True
        else:
            print(f"❌ Erreur JPEXS : {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Java n'est pas installé ou pas dans le PATH")
        print("Installez Java depuis : https://www.java.com/")
        return False

def organize_sprites(input_dir: str):
    """Organise les sprites extraits par type"""
    input_path = Path(input_dir)
    
    # Créer des dossiers par catégorie
    categories = {
        "shapes": [],
        "sprites": [],
        "images": [],
        "others": []
    }
    
    # Parcourir tous les fichiers
    for file in input_path.glob("**/*"):
        if file.is_file():
            if "shape" in file.name.lower():
                categories["shapes"].append(file)
            elif "sprite" in file.name.lower() or "symbol" in file.name.lower():
                categories["sprites"].append(file)
            elif file.suffix.lower() in [".png", ".jpg", ".jpeg"]:
                categories["images"].append(file)
            else:
                categories["others"].append(file)
    
    print("\n📊 Organisation des fichiers extraits :")
    for category, files in categories.items():
        if files:
            print(f"\n{category.upper()} ({len(files)} fichiers) :")
            # Créer le dossier
            category_dir = input_path / category
            category_dir.mkdir(exist_ok=True)
            
            # Déplacer les fichiers
            for file in files[:5]:  # Afficher les 5 premiers
                print(f"  - {file.name}")
                # Copier dans le bon dossier
                dest = category_dir / file.name
                if not dest.exists():
                    shutil.copy2(file, dest)
            
            if len(files) > 5:
                print(f"  ... et {len(files) - 5} autres")

if __name__ == "__main__":
    # Configuration
    SWF_FILE = "mini_perso.swf"  # ou le chemin complet
    OUTPUT_DIR = "sprites_extraits"
    
    print("🎮 LaBrute Symbol Extractor")
    print("=" * 50)
    
    # Extraction
    if extract_with_jpexs(SWF_FILE, OUTPUT_DIR):
        # Organisation
        organize_sprites(OUTPUT_DIR)
        
        print("\n✅ Extraction terminée !")
        print(f"📁 Les sprites sont dans : {OUTPUT_DIR}")
        print("\n🚀 Prochaine étape : python analyze_with_gpt4.py")
    else:
        print("\n❌ Extraction échouée. Vérifiez les erreurs ci-dessus.")