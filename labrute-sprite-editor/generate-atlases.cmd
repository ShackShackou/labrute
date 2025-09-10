@echo off
echo Génération des atlas de sprites LaBrute...
echo.

REM Vérifier si TexturePacker est installé
where TexturePacker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: TexturePacker n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer TexturePacker depuis: https://www.codeandweb.com/texturepacker
    pause
    exit /b 1
)

REM Aller dans le dossier client
cd ..\client

REM Générer les atlas
echo Génération de male-brute.png/json...
TexturePacker textures-male-brute.tps

echo Génération de female-brute.png/json...
TexturePacker textures-female-brute.tps

echo Génération de bear.png/json...
TexturePacker textures-bear.tps

echo Génération de dog.png/json...
TexturePacker textures-dog.tps

echo Génération de panther.png/json...
TexturePacker textures-panther.tps

echo Génération de misc.png/json...
TexturePacker textures-misc.tps

echo Génération de thrown-weapons.png/json...
TexturePacker textures-thrown-weapons.tps

echo.
echo Atlas générés avec succès !
echo Les fichiers sont dans client/public/images/game/

REM Revenir au dossier de l'éditeur
cd ..\labrute-sprite-editor

pause
