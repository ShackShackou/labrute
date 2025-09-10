@echo off
echo.
echo ============================================
echo   EXTRACTION AUTOMATIQUE DES SYMBOL IDs
echo ============================================
echo.

:: Chercher JPEXS
set JPEXS_EXE=
if exist "C:\Program Files\JPEXS Free Flash Decompiler\ffdec.exe" (
    set JPEXS_EXE="C:\Program Files\JPEXS Free Flash Decompiler\ffdec.exe"
) else if exist "C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.exe" (
    set JPEXS_EXE="C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.exe"
)

if defined JPEXS_EXE (
    echo [OK] JPEXS trouve!
    echo.
    echo Ouverture de mini_perso.swf dans JPEXS...
    start "" %JPEXS_EXE% "%~dp0mini_perso.swf"
    echo.
    echo JPEXS est en cours d'ouverture!
    echo.
    echo INSTRUCTIONS RAPIDES:
    echo ====================
    echo 1. Dans l'arbre a gauche, cherchez "sprites"
    echo 2. Cliquez sur DefineSprite (460) = Homme
    echo 3. Cliquez sur DefineSprite (752) = Femme
    echo 4. Notez tous les numeros que vous voyez
    echo.
    echo Les Symbol IDs sont au format: DefineSprite (XXX)
    echo Notez-les comme: SymbolXXX
    echo.
) else (
    echo [INFO] Je ne trouve pas JPEXS.exe
    echo.
    echo Essayons avec le raccourci du menu demarrer...
    echo.
    
    :: Utiliser PowerShell pour trouver et lancer JPEXS
    powershell -Command "& {$jpexs = Get-ChildItem -Path 'C:\ProgramData\Microsoft\Windows\Start Menu\Programs' -Filter '*JPEXS*' -Recurse | Select-Object -First 1; if ($jpexs) { Start-Process $jpexs.FullName -ArgumentList '%~dp0mini_perso.swf' } else { Write-Host 'JPEXS non trouve dans le menu demarrer' }}"
    
    echo.
    echo Si JPEXS ne s'ouvre pas automatiquement:
    echo 1. Lancez JPEXS manuellement
    echo 2. File > Open
    echo 3. Selectionnez: %~dp0mini_perso.swf
)

echo.
echo FICHIERS CREES POUR VOUS:
echo ========================
echo - labrute-symbol-mapper\template_symbol_ids.txt (pour noter)
echo - labrute-symbol-mapper\jpexs_visual_guide.txt (guide visuel)
echo - labrute-symbol-mapper\labrute_symbols_guide.json (structure)
echo.
pause