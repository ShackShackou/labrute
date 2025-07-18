@echo off
echo === RESTAURATION LABRUTE DATABASES ===
echo.

REM Lister les sauvegardes disponibles
echo Sauvegardes disponibles:
echo.
dir /b /ad backups
echo.

REM Demander quelle sauvegarde restaurer
set /p BACKUP_FOLDER="Entrez le nom du dossier de sauvegarde à restaurer: "

if not exist "backups\%BACKUP_FOLDER%" (
    echo Erreur: Le dossier de sauvegarde '%BACKUP_FOLDER%' n'existe pas!
    pause
    exit /b 1
)

echo.
echo ATTENTION: Cette opération va ÉCRASER les bases de données actuelles!
set /p CONFIRM="Êtes-vous sûr de vouloir continuer? (oui/non): "

if /i not "%CONFIRM%"=="oui" (
    echo Opération annulée.
    pause
    exit /b 0
)

echo.
echo Arrêt des services...
taskkill /F /IM node.exe >nul 2>&1

echo Suppression des bases existantes...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS labrute;"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS etwin;"

echo Recréation des bases vides...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE labrute;"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE etwin;"

echo.
echo [1/2] Restauration de la base 'labrute'...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d labrute -f "backups\%BACKUP_FOLDER%\labrute.sql"
if %errorlevel% equ 0 (
    echo ✓ Base 'labrute' restaurée avec succès
) else (
    echo ✗ Erreur lors de la restauration de 'labrute'
)

echo [2/2] Restauration de la base 'etwin'...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d etwin -f "backups\%BACKUP_FOLDER%\etwin.sql"
if %errorlevel% equ 0 (
    echo ✓ Base 'etwin' restaurée avec succès
) else (
    echo ✗ Erreur lors de la restauration de 'etwin'
)

echo.
echo === RESTAURATION TERMINÉE ===
echo.
echo Vous pouvez maintenant redémarrer les services avec: dev.cmd
echo.
pause