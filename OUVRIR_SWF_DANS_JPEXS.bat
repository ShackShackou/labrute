@echo off
echo.
echo ========================================
echo   OUVERTURE DE mini_perso.swf DANS JPEXS
echo ========================================
echo.

set SWF_PATH=%~dp0mini_perso.swf

echo Recherche de JPEXS...

:: Chercher JPEXS dans les emplacements courants
if exist "C:\Program Files\JPEXS Free Flash Decompiler\ffdec.exe" (
    set JPEXS="C:\Program Files\JPEXS Free Flash Decompiler\ffdec.exe"
    goto found
)
if exist "C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.exe" (
    set JPEXS="C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.exe"
    goto found
)

:: Chercher via le menu démarrer
for /f "tokens=*" %%i in ('where /r "%ProgramData%\Microsoft\Windows\Start Menu" "JPEXS*.lnk" 2^>nul') do (
    echo Raccourci trouve: %%i
    start "" "%%i" "%SWF_PATH%"
    goto instructions
)

echo [ERREUR] JPEXS non trouve!
echo.
echo Lancez JPEXS manuellement puis:
echo 1. File - Open
echo 2. Selectionnez: %SWF_PATH%
goto end

:found
echo [OK] JPEXS trouve!
echo.
echo Ouverture de mini_perso.swf...
start "" %JPEXS% "%SWF_PATH%"

:instructions
echo.
echo ========================================
echo   INSTRUCTIONS POUR TROUVER LES SYMBOL IDs
echo ========================================
echo.
echo 1. Dans l'arbre a gauche, cherchez:
echo    - sprites/ (DefineSprite)
echo    - shapes/ (DefineShape)
echo.
echo 2. COMMENCEZ PAR:
echo    - DefineSprite (460) = Homme complet
echo    - DefineSprite (752) = Femme complete
echo.
echo 3. Cliquez sur chaque element pour voir:
echo    - Le numero du Symbol
echo    - L'apercu visuel
echo    - Le contenu (sous-elements)
echo.
echo 4. NOTEZ chaque Symbol ID important:
echo    Format: Symbol[numero] = [description]
echo    Exemple: Symbol245 = Epee
echo.
echo 5. Les parties du corps sont dans:
echo    - p1 a p8 (dans Symbol460/752)
echo    - Chaque partie a son propre Symbol ID
echo.
echo CONSEIL: Utilisez la fonction recherche (Ctrl+F)
echo pour trouver rapidement les elements!
echo.

:end
pause