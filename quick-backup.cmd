@echo off
REM Sauvegarde rapide et silencieuse (pour usage quotidien)

set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=backups\quick_%TIMESTAMP%

mkdir "%BACKUP_DIR%" 2>nul

echo Sauvegarde rapide en cours...

"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -f "%BACKUP_DIR%\labrute.sql" labrute
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -f "%BACKUP_DIR%\etwin.sql" etwin

echo Sauvegarde terminée: %BACKUP_DIR%