@echo off
echo.
echo === Ouverture du LaBrute Sprite Editor ===
echo.
cd labrute-sprite-editor
echo Demarrage du serveur local...
echo.
echo Une fois le serveur lance, ouvrez votre navigateur et allez a :
echo http://localhost:8000/custom-sprite-editor.html
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
python -m http.server 8000