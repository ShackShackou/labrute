@echo off
title LABRUTE-SHACKERS LAUNCHER (Pixi v8 + Spine 2D)
color 0A
cls

echo ========================================================
echo    LABRUTE-SHACKERS - PIXI v8 + SPINE 2D RENDERER
echo ========================================================
echo.
echo Configuration:
echo   - Frontend React (Port 3000) avec Pixi v8
echo   - Backend API (Port 9000)
echo   - PostgreSQL Docker (Port 5432)
echo   - EternalTwin OAuth (Port 50320)
echo   - Prisma Studio (Port 5555)
echo.
echo ========================================================
echo.

cd /d C:\Users\User\labrute

echo [1/6] Verification Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Docker n'est pas installe ou pas dans le PATH
    echo Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [2/6] Demarrage PostgreSQL Docker...
docker ps | findstr pg-labrute >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting pg-labrute container...
    docker start pg-labrute >nul 2>&1
    if %errorlevel% neq 0 (
        echo Creating pg-labrute container...
        docker run -d --name pg-labrute -p 5432:5432 -e POSTGRES_PASSWORD=010582 -e POSTGRES_DB=labrute postgres:16-alpine
    )
    timeout /t 3 /nobreak >nul
) else (
    echo PostgreSQL already running
)

echo [3/6] Compilation TypeScript...
call npx tsc -b tsconfig.build.json 2>nul
if %errorlevel% neq 0 (
    echo Compilation warnings detected, continuing...
)

echo [4/6] Lancement EternalTwin OAuth...
start /min "EternalTwin" cmd /c "npm run eternaltwin:start 2>nul"
timeout /t 2 /nobreak >nul

echo [5/6] Lancement Backend API...
start /min "Backend API" cmd /c "cd server && node lib/main.js"
timeout /t 2 /nobreak >nul

echo [6/6] Lancement Frontend React + Pixi v8...
start /min "Frontend React" cmd /c "cd client && set PORT=3000 && npm start"

echo.
echo ========================================================
echo    TOUS LES SERVICES SONT EN COURS DE DEMARRAGE!
echo ========================================================
echo.
echo Attendez 10-15 secondes puis accedez a:
echo.
echo   JEU PRINCIPAL:     http://localhost:3000
echo   MODE COMPARE:      http://localhost:3000/HerveVenere/fight/[ID]?renderer=compare
echo   API BACKEND:       http://localhost:9000
echo   ADMIN DB:          http://localhost:5555
echo   OAUTH:             http://localhost:50320
echo.
echo Compte test: JCDUSS
echo.
echo ========================================================
echo.

timeout /t 5 /nobreak >nul

echo Lancement Prisma Studio...
start /min "Prisma Studio" cmd /c "cd server && npx prisma studio"

timeout /t 10 /nobreak >nul

echo.
echo Ouverture du jeu dans le navigateur...
start http://localhost:3000

echo.
echo ========================================================
echo    LABRUTE-SHACKERS EST PRET!
echo ========================================================
echo.
echo Appuyez sur une touche pour voir les logs...
pause >nul

echo.
echo === VERIFICATION DES SERVICES ===
netstat -ano | findstr "3000 9000 5432 5555 50320" | findstr LISTENING
echo.
echo Pour arreter tous les services: CTRL+C puis taskkill /F /IM node.exe
echo.
pause