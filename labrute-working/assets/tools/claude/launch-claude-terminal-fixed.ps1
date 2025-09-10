Write-Host "🤖 Lancement de Claude Code (Cline) en mode terminal uniquement" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Répertoire actuel: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 INSTRUCTIONS D'AUTHENTIFICATION:" -ForegroundColor Green
Write-Host "Quand Claude Code démarre, vous verrez les options d'authentification." -ForegroundColor White
Write-Host ""
Write-Host "✅ SÉLECTIONNEZ: 'Claude App (with Pro or Max plan)'" -ForegroundColor Green
Write-Host "✅ CONNECTEZ-VOUS: Utilisez vos identifiants Claude.ai" -ForegroundColor Green
Write-Host "❌ REFUSEZ: Toutes les options de crédit API (pour utiliser uniquement l'abonnement)" -ForegroundColor Red
Write-Host ""

Write-Host "💳 Avantages de votre Plan Max:" -ForegroundColor Magenta
Write-Host "• 50-200 prompts par fenêtre de 5 heures" -ForegroundColor White
Write-Host "• Accès à Claude Sonnet 4" -ForegroundColor White
Write-Host "• Accès à Claude Opus 4 (si vous avez le plan $200)" -ForegroundColor White
Write-Host "• 140-480 heures hebdomadaires (selon le niveau $100 ou $200)" -ForegroundColor White
Write-Host ""

Write-Host "🎮 Votre Projet LaBrute:" -ForegroundColor Yellow
Write-Host "Claude Code vous aidera avec:" -ForegroundColor White
Write-Host "• Améliorations du système de combat" -ForegroundColor White
Write-Host "• Amélioration des retours hit/dodge" -ForegroundColor White
Write-Host "• Optimisation et débogage du code" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Démarrage de Claude Code en mode terminal..." -ForegroundColor Green
Write-Host "Appuyez sur Ctrl+C pour quitter Claude Code." -ForegroundColor Yellow
Write-Host ""

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js détected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Définir les variables d'environnement pour éviter l'ouverture du navigateur
$env:NO_BROWSER = "true"
$env:BROWSER = "none"
$env:CLAUDE_NO_BROWSER = "true"

Write-Host "🔧 Configuration en mode terminal uniquement..." -ForegroundColor Gray
Write-Host ""

# Lancer Claude Code avec la bonne commande
Write-Host "▶️ Exécution de: npx @anthropic-ai/claude-code" -ForegroundColor Green
Write-Host ""

try {
    # Utiliser la commande correcte selon la documentation
    npx @anthropic-ai/claude-code
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors du lancement de Claude Code" -ForegroundColor Red
    Write-Host "Essai avec une installation globale..." -ForegroundColor Yellow
    
    try {
        # Essayer avec une installation globale
        claude-code
    } catch {
        Write-Host ""
        Write-Host "❌ Claude Code n'est pas installé correctement" -ForegroundColor Red
        Write-Host "Tentative d'installation..." -ForegroundColor Yellow
        
        try {
            npm install -g @anthropic-ai/claude-code
            Write-Host "✅ Installation terminée, redémarrage..." -ForegroundColor Green
            npx @anthropic-ai/claude-code
        } catch {
            Write-Host "❌ Impossible d'installer Claude Code" -ForegroundColor Red
            Write-Host "Veuillez installer manuellement avec: npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Session Claude Code terminee" -ForegroundColor Cyan
pause
