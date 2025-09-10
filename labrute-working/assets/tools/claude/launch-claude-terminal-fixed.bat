@echo off
echo 🤖 Lancement de Claude Code (Cline) en mode terminal uniquement
echo ================================================================
echo.

echo 📍 Répertoire actuel: %CD%
echo.

echo 📝 INSTRUCTIONS D'AUTHENTIFICATION:
echo Quand Claude Code démarre, vous verrez les options d'authentification.
echo.
echo ✅ SÉLECTIONNEZ: 'Claude App (with Pro or Max plan)'
echo ✅ CONNECTEZ-VOUS: Utilisez vos identifiants Claude.ai
echo ❌ REFUSEZ: Toutes les options de crédit API (pour utiliser uniquement l'abonnement)
echo.

echo 💳 Avantages de votre Plan Max:
echo • 50-200 prompts par fenêtre de 5 heures
echo • Accès à Claude Sonnet 4
echo • Accès à Claude Opus 4 (si vous avez le plan $200)
echo • 140-480 heures hebdomadaires (selon le niveau $100 ou $200)
echo.

echo 🎮 Votre Projet LaBrute:
echo Claude Code vous aidera avec:
echo • Améliorations du système de combat
echo • Amélioration des retours hit/dodge
echo • Optimisation et débogage du code
echo.

echo 🚀 Démarrage de Claude Code en mode terminal...
echo Appuyez sur Ctrl+C pour quitter Claude Code.
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé ou pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js détecté: %%i
)

REM Définir les variables d'environnement pour éviter l'ouverture du navigateur
set NO_BROWSER=true
set BROWSER=none
set CLAUDE_NO_BROWSER=true

echo 🔧 Configuration en mode terminal uniquement...
echo.

REM Lancer Claude Code avec la bonne commande
echo ▶️ Exécution de: npx @anthropic-ai/claude-code
echo.

REM Utiliser la commande correcte selon la documentation
npx @anthropic-ai/claude-code
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du lancement de Claude Code
    echo Essai avec une installation globale...
    
    claude-code
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Claude Code n'est pas installé correctement
        echo Tentative d'installation...
        
        npm install -g @anthropic-ai/claude-code
        if %errorlevel% equ 0 (
            echo ✅ Installation terminée, redémarrage...
            npx @anthropic-ai/claude-code
        ) else (
            echo ❌ Impossible d'installer Claude Code
            echo Veuillez installer manuellement avec: npm install -g @anthropic-ai/claude-code
        )
    )
)

echo.
echo 👋 Session Claude Code terminée
pause
