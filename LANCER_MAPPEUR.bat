@echo off
echo.
echo === LaBrute Symbol Mapper ===
echo.
cd labrute-symbol-mapper
echo.
echo Outils disponibles :
echo.
echo 1. simple_extractor.py - Extraire et mapper sans GPT-4 (GRATUIT)
echo 2. mapping_tool.py - Interface graphique pour valider le mapping
echo 3. Voir les mappings deja crees (JSON)
echo.
echo Que voulez-vous faire ?
echo.
set /p choice="Votre choix (1, 2 ou 3) : "

if "%choice%"=="1" (
    python simple_extractor.py
) else if "%choice%"=="2" (
    python mapping_tool.py
) else if "%choice%"=="3" (
    echo.
    echo Fichiers de mapping :
    echo - labrute_complete_mapping.json
    echo - labrute_simple_reference.json
    echo - LABRUTE_SYMBOLS_DOCUMENTATION.md
    echo.
    notepad labrute_simple_reference.json
) else (
    echo Choix invalide
)

pause