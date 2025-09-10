@echo off
echo.
echo ========================================
echo   INSTALLATION AUTOMATIQUE DE JPEXS
echo ========================================
echo.
echo Ce script va telecharger et installer JPEXS
echo.
pause

powershell -ExecutionPolicy Bypass -File INSTALLER_JPEXS_AUTO.ps1

echo.
echo Une fois JPEXS installe, lancez JPEXS_HELPER.bat
pause