@echo off
echo.
echo ====================================
echo   ANALYSE AUTOMATIQUE AVEC GPT-4V
echo ====================================
echo.
cd labrute-symbol-mapper
echo.
echo Etape 1 : Extraction des sprites...
echo.
python extract_symbols.py
echo.
echo Etape 2 : Analyse avec GPT-4 Vision...
echo.
echo ATTENTION : Cela va couter environ 0.01$ par image !
echo Commencez avec limit=5 pour tester.
echo.
pause
echo.
python analyze_with_gpt4.py
echo.
echo Etape 3 : Validation manuelle (optionnel)...
echo.
pause
python mapping_tool.py
echo.
echo Termine !
pause