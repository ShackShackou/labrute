@echo off
echo === BACKUP LABRUTE DATABASES ===
echo.

REM Créer le dossier de sauvegarde avec la date
set BACKUP_DIR=backups\%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul

echo Sauvegarde des bases de données...
echo.

REM Sauvegarder la base labrute
echo [1/2] Sauvegarde de la base 'labrute'...
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -f "%BACKUP_DIR%\labrute.sql" labrute
if %errorlevel% equ 0 (
    echo ✓ Base 'labrute' sauvegardée avec succès
) else (
    echo ✗ Erreur lors de la sauvegarde de 'labrute'
)

REM Sauvegarder la base etwin
echo [2/2] Sauvegarde de la base 'etwin'...
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -f "%BACKUP_DIR%\etwin.sql" etwin
if %errorlevel% equ 0 (
    echo ✓ Base 'etwin' sauvegardée avec succès
) else (
    echo ✗ Erreur lors de la sauvegarde de 'etwin'
)

echo.
echo === BACKUP TERMINÉ ===
echo Dossier de sauvegarde: %BACKUP_DIR%
echo.

REM Garder seulement les 10 dernières sauvegardes
echo Nettoyage des anciennes sauvegardes...
for /f "skip=10 delims=" %%i in ('dir /b /ad /o-d backups') do (
    echo Suppression de l'ancienne sauvegarde: %%i
    rmdir /s /q "backups\%%i"
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul