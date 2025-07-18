@echo off
echo Starting La Brute development servers...

cd /d %~dp0

REM Sauvegarde automatique au démarrage
if exist backups\nul (
    echo Sauvegarde automatique...
    call quick-backup.cmd
    echo.
)

echo Compiling TypeScript...
call npx tsc -b tsconfig.build.json

echo Starting backend server...
start "Backend" cmd /k "cd server && node lib/main.js"

echo Starting frontend...
start "Frontend" cmd /k "cd client && set PORT=3000 && npm start"

echo Starting Prisma Studio...
start "Prisma Studio" cmd /k "cd server && npx prisma studio"

echo All services started!
echo Backend: http://localhost:9000
echo Frontend: http://localhost:3000  
echo Prisma Studio: http://localhost:5555
pause