@echo off
echo.
echo ========================================
echo    ASSISTANT JPEXS POUR LABRUTE
echo ========================================
echo.
echo Ce script va vous aider avec JPEXS
echo.

:menu
echo Que voulez-vous faire ?
echo.
echo 1. Telecharger JPEXS
echo 2. J'ai deja JPEXS, comment l'utiliser ?
echo 3. Ouvrir le template pour noter les symbols
echo 4. Voir le guide complet
echo 5. Quitter
echo.
set /p choice="Votre choix (1-5) : "

if "%choice%"=="1" goto download
if "%choice%"=="2" goto howto
if "%choice%"=="3" goto template
if "%choice%"=="4" goto guide
if "%choice%"=="5" goto end

:download
echo.
echo TELECHARGEMENT DE JPEXS :
echo.
echo 1. Ouvrez votre navigateur
echo 2. Allez sur : https://github.com/jindrapetrik/jpexs-decompiler/releases
echo 3. Telecharger : ffdec_XX.X.X_setup.exe (pour Windows)
echo 4. Installez normalement
echo.
pause
goto menu

:howto
echo.
echo UTILISATION DE JPEXS :
echo.
echo 1. Lancez JPEXS
echo 2. File - Open
echo 3. Ouvrez : C:\Users\User\labrute\mini_perso.swf
echo 4. Dans l'arbre a gauche, explorez :
echo    - sprites/ (pour les DefineSprite)
echo    - shapes/ (pour les formes)
echo 5. Cliquez sur chaque element pour le voir
echo 6. Notez le numero et ce que c'est
echo.
echo CONSEIL : Commencez par DefineSprite (460) et (752)
echo Ce sont les personnages principaux !
echo.
pause
goto menu

:template
echo.
echo Ouverture du template...
notepad labrute-symbol-mapper\template_mapping_jpexs.txt
goto menu

:guide
echo.
echo Ouverture du guide complet...
notepad GUIDE_JPEXS_EXTRACTION.md
goto menu

:end
echo.
echo Bonne exploration des sprites !
echo N'oubliez pas de noter chaque Symbol ID.
echo.
pause