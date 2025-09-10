@echo off
echo.
echo ========================================
echo   RELANCEMENT AVEC NOUVEAU mini_perso.swf
echo ========================================
echo.

echo Nettoyage du cache...
del /Q "%TEMP%\*.swf" 2>nul

echo.
echo Verification des fichiers SWF...
echo.
for /f "tokens=*" %%a in ('powershell -Command "(Get-FileHash 'client\public\mini_perso.swf').Hash.Substring(0,10)"') do set HASH1=%%a
for /f "tokens=*" %%a in ('powershell -Command "(Get-FileHash 'client\public\images\mini_perso.swf').Hash.Substring(0,10)"') do set HASH2=%%a
echo Hash public: %HASH1%
echo Hash images: %HASH2%

echo.
echo Compilation TypeScript...
call npx tsc -b tsconfig.build.json

echo.
echo Demarrage du backend...
start "Backend" cmd /k "cd server && node lib/main.js"

timeout /t 3 /nobreak >nul

echo.
echo Demarrage du frontend (avec cache desactive)...
start "Frontend" cmd /k "cd client && set PORT=3000 && set GENERATE_SOURCEMAP=false && npm start"

echo.
echo ========================================
echo   IMPORTANT POUR VOIR LES CHANGEMENTS:
echo ========================================
echo.
echo 1. Attendez que le frontend demarre (http://localhost:3000)
echo 2. Ouvrez le navigateur en mode prive/incognito
echo 3. OU faites Ctrl+Shift+R pour forcer le rechargement
echo 4. OU videz le cache: Ctrl+Shift+Delete
echo.
echo Le nouveau SWF est en place dans:
echo - client/public/mini_perso.swf
echo - client/public/images/mini_perso.swf
echo.
pause