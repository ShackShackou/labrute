# 🎮 LaBrute Symbol Mapper

Outil automatique pour créer un mapping complet de tous les assets du fichier `mini_perso.swf` de LaBrute.

## 🚀 Fonctionnalités

- **Extraction automatique** : Extrait tous les sprites du SWF avec JPEXS
- **Analyse par IA** : Utilise GPT-4 Vision pour identifier chaque sprite
- **Interface de validation** : Vérifiez et corrigez les classifications
- **Export complet** : JSON, CSV, et rapports détaillés

## 📋 Prérequis

1. **Python 3.8+**
2. **Java** (pour JPEXS)
3. **JPEXS Free Flash Decompiler** : [Télécharger ici](https://github.com/jindrapetrik/jpexs-decompiler/releases)
4. **Clé API OpenAI** avec accès GPT-4 Vision

## 🛠️ Installation

1. **Installer les dépendances Python** :
```bash
pip install -r requirements.txt
```

2. **Configurer votre clé API** :
```bash
# Créer le fichier .env
echo "OPENAI_API_KEY=sk-proj-..." > .env
```

3. **Télécharger JPEXS** et placer `ffdec.jar` dans ce dossier ou l'installer normalement

## 📖 Guide d'utilisation

### Étape 1 : Extraire les sprites du SWF

```bash
python extract_symbols.py
```

Cela va :
- Chercher `mini_perso.swf` (dans ce dossier ou le parent)
- Extraire tous les sprites dans `sprites_extraits/`
- Organiser les fichiers par catégorie

### Étape 2 : Analyser avec GPT-4 Vision

```bash
python analyze_with_gpt4.py
```

Options :
- **Test** : Commencez avec `limit=5` pour tester
- **Complet** : Décommentez `analyzer.process_all_sprites()` pour tout analyser

### Étape 3 : Valider et corriger

```bash
python mapping_tool.py
```

Interface graphique pour :
- Visualiser chaque sprite
- Corriger les classifications
- Ajouter des notes
- Générer des rapports

## 📊 Structure du mapping

```json
{
  "version": "1.0",
  "analyzer": "GPT-4 Vision",
  "symbols": {
    "463": {
      "id": "463",
      "filename": "Symbol_463.png",
      "dimensions": {"width": 60, "height": 80},
      "type": "head",
      "subtype": "tête normale",
      "confidence": 0.95,
      "details": "Tête de personnage masculin avec cheveux courts",
      "colors": ["brun", "beige"],
      "verified": true
    }
  }
}
```

## 💰 Estimation des coûts

- GPT-4 Vision : ~$0.01 par image
- 1000 sprites ≈ $10
- Recommandation : Testez avec 10-20 sprites d'abord

## 🔧 Personnalisation

### Modifier les catégories

Dans `analyze_with_gpt4.py`, ligne 35 :
```python
CATÉGORIES POSSIBLES :
- head : tête/visage
- body : torse/corps
# Ajoutez vos catégories ici
```

### Ajuster la confiance

Dans `analyze_with_gpt4.py`, ligne 78 :
```python
temperature=0.1  # Plus bas = plus déterministe
```

## 📁 Structure des fichiers

```
labrute-symbol-mapper/
├── .env                    # Clé API (NE PAS COMMIT)
├── extract_symbols.py      # Extraction du SWF
├── analyze_with_gpt4.py    # Analyse IA
├── mapping_tool.py         # Interface de validation
├── sprites_extraits/       # Sprites extraits
│   ├── shapes/
│   ├── sprites/
│   └── images/
├── labrute_mapping.json    # Mapping généré
└── mapping_report.csv      # Rapport Excel
```

## 🐛 Dépannage

### "JPEXS introuvable"
- Téléchargez JPEXS et placez `ffdec.jar` dans ce dossier
- Ou installez-le normalement dans Program Files

### "Java n'est pas installé"
- Installez Java : https://www.java.com/

### "Erreur GPT-4"
- Vérifiez votre clé API dans `.env`
- Vérifiez vos limites de rate
- Essayez avec moins d'images

## 🎯 Workflow recommandé

1. **Extraction** : `python extract_symbols.py`
2. **Test** : Analysez 5-10 sprites pour vérifier
3. **Analyse complète** : Si OK, analysez tout
4. **Validation** : Utilisez l'interface pour corriger
5. **Export** : Générez les rapports finaux

## 📝 Notes importantes

- Les sprites sont analysés individuellement
- GPT-4V peut se tromper sur des sprites similaires
- Toujours valider manuellement les résultats importants
- Sauvegardez régulièrement votre mapping

## 🤝 Contribution

Pour améliorer le mapping :
1. Ajoutez des catégories spécifiques à LaBrute
2. Affinez les prompts GPT-4
3. Partagez vos mappings validés

---

**Créé pour le projet LaBrute - Mapping automatique des assets du jeu**