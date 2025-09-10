import os
import base64
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
from PIL import Image
import openai
from dotenv import load_dotenv
from tqdm import tqdm

# Charger les variables d'environnement
load_dotenv()

# Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    raise ValueError("Ajoutez OPENAI_API_KEY dans votre fichier .env !")

class LaBruteSymbolAnalyzer:
    def __init__(self, sprites_folder: str, output_file: str = "mapping.json"):
        self.sprites_folder = Path(sprites_folder)
        self.output_file = output_file
        self.mapping = {}
        self.errors = []
        
    def encode_image(self, image_path: Path) -> str:
        """Encode une image en base64 pour GPT-4V"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def analyze_sprite(self, image_path: Path) -> Dict:
        """Analyse un sprite avec GPT-4 Vision"""
        try:
            # Préparer l'image
            base64_image = self.encode_image(image_path)
            
            # Prompt optimisé pour LaBrute
            prompt = """Tu es un expert en analyse de sprites de jeux de combat 2D.
            
Analyse cette image et détermine précisément ce que c'est :

CATÉGORIES POSSIBLES :
- head : tête/visage de personnage
- body : torse/corps
- arm_left : bras gauche
- arm_right : bras droit  
- leg_left : jambe gauche
- leg_right : jambe droite
- weapon : arme (épée, hache, lance, etc.)
- shield : bouclier
- accessory : accessoire (chapeau, lunettes, etc.)
- effect : effet visuel (feu, sang, etc.)
- full_character : personnage complet animé
- unknown : impossible à déterminer

Réponds UNIQUEMENT avec ce format JSON :
{
    "type": "category",
    "subtype": "description courte",
    "confidence": 0.95,
    "details": "description détaillée",
    "colors": ["couleur1", "couleur2"],
    "has_animation": false
}"""

            response = openai.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300,
                temperature=0.1  # Plus déterministe
            )
            
            # Parser la réponse
            result_text = response.choices[0].message.content
            
            # Nettoyer le JSON (au cas où GPT ajoute du texte)
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1
            json_str = result_text[json_start:json_end]
            
            return json.loads(json_str)
            
        except Exception as e:
            print(f"Erreur avec {image_path.name}: {str(e)}")
            return {
                "type": "error",
                "error": str(e),
                "confidence": 0
            }
    
    def get_sprite_info(self, image_path: Path) -> Dict:
        """Récupère les infos basiques du sprite"""
        img = Image.open(image_path)
        width, height = img.size
        
        # Extraire l'ID du nom de fichier
        # Format attendu : symbol_463.png ou 463.png
        filename = image_path.stem
        symbol_id = filename.split('_')[-1] if '_' in filename else filename
        
        return {
            "id": symbol_id,
            "filename": image_path.name,
            "dimensions": {"width": width, "height": height},
            "aspect_ratio": round(width / height, 2)
        }
    
    def process_all_sprites(self, limit: Optional[int] = None):
        """Traite tous les sprites du dossier"""
        # Lister tous les PNG
        sprite_files = list(self.sprites_folder.glob("*.png"))
        
        if limit:
            sprite_files = sprite_files[:limit]
        
        print(f"🎨 Analyse de {len(sprite_files)} sprites avec GPT-4 Vision...")
        
        # Barre de progression
        for sprite_path in tqdm(sprite_files, desc="Analyse"):
            # Infos basiques
            sprite_info = self.get_sprite_info(sprite_path)
            symbol_id = sprite_info["id"]
            
            # Analyse GPT-4V
            analysis = self.analyze_sprite(sprite_path)
            
            # Combiner les infos
            self.mapping[symbol_id] = {
                **sprite_info,
                **analysis,
                "analyzed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # Pause pour respecter les limites de rate
            time.sleep(0.5)
            
            # Sauvegarder régulièrement
            if len(self.mapping) % 10 == 0:
                self.save_mapping()
    
    def save_mapping(self):
        """Sauvegarde le mapping en JSON"""
        output = {
            "version": "1.0",
            "analyzer": "GPT-4 Vision",
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_symbols": len(self.mapping),
            "symbols": self.mapping
        }
        
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Mapping sauvegardé : {self.output_file}")
    
    def generate_report(self):
        """Génère un rapport d'analyse"""
        # Compter les types
        type_counts = {}
        high_confidence = 0
        
        for symbol_id, data in self.mapping.items():
            sprite_type = data.get('type', 'unknown')
            type_counts[sprite_type] = type_counts.get(sprite_type, 0) + 1
            
            if data.get('confidence', 0) > 0.8:
                high_confidence += 1
        
        print("\n📊 RAPPORT D'ANALYSE")
        print("=" * 50)
        print(f"Total symbols analysés : {len(self.mapping)}")
        print(f"Haute confiance (>80%) : {high_confidence}")
        print("\nRépartition par type :")
        for sprite_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {sprite_type}: {count}")
        
        # Sauvegarder aussi en CSV pour Excel
        import pandas as pd
        df = pd.DataFrame.from_dict(self.mapping, orient='index')
        df.to_csv('mapping_report.csv', index_label='symbol_id')
        print(f"\n📄 Rapport CSV sauvegardé : mapping_report.csv")

# Script principal
if __name__ == "__main__":
    # Configuration
    SPRITES_FOLDER = "sprites_extraits"  # Dossier avec vos PNG
    OUTPUT_FILE = "labrute_mapping.json"
    
    # Créer l'analyseur
    analyzer = LaBruteSymbolAnalyzer(SPRITES_FOLDER, OUTPUT_FILE)
    
    # Analyser (limite à 5 pour tester)
    print("🚀 Démarrage de l'analyse...")
    print("💡 Conseil : Commencez avec limit=5 pour tester !")
    
    # Décommenter pour analyser tous les sprites
    # analyzer.process_all_sprites()
    
    # Pour tester avec 5 sprites
    analyzer.process_all_sprites(limit=5)
    
    # Générer le rapport
    analyzer.generate_report()