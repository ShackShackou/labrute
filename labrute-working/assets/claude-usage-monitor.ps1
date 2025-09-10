# Claude Code Usage Monitor
# Helps track your subscription usage and provides insights

Write-Host "📊 Claude Code Usage Monitor" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Function to display subscription tier information
function Show-SubscriptionInfo {
    Write-Host "💳 Subscription Tier Information:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Claude Pro ($20/month):" -ForegroundColor Green
    Write-Host "  • Web Usage: ~45 messages every 5 hours" -ForegroundColor White
    Write-Host "  • Claude Code: 10-40 prompts per 5-hour window" -ForegroundColor White
    Write-Host "  • Weekly Cap: 40-80 hours of Sonnet 4" -ForegroundColor White
    Write-Host "  • Model Access: Claude Sonnet 4 only" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Claude Max ($100/month):" -ForegroundColor Blue
    Write-Host "  • Limits: 5x Pro levels" -ForegroundColor White
    Write-Host "  • Claude Code: 50-200 prompts per 5-hour window" -ForegroundColor White
    Write-Host "  • Weekly Cap: 140-280 hours of Sonnet 4" -ForegroundColor White
    Write-Host "  • Model Access: Claude Sonnet 4 only" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Claude Max ($200/month):" -ForegroundColor Magenta
    Write-Host "  • Limits: 20x Pro levels" -ForegroundColor White
    Write-Host "  • Claude Code: 50-200+ prompts per 5-hour window" -ForegroundColor White
    Write-Host "  • Weekly Cap: 240-480 hours of Sonnet 4" -ForegroundColor White
    Write-Host "  • Model Access: Claude Sonnet 4 + Opus 4" -ForegroundColor White
    Write-Host "  • Additional: Opus 4 hours included" -ForegroundColor White
    Write-Host ""
}

# Function to show usage optimization tips
function Show-OptimizationTips {
    Write-Host "💡 Usage Optimization Tips:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "1. Batch Related Questions:" -ForegroundColor Green
    Write-Host "   • Combine multiple related queries in one prompt" -ForegroundColor White
    Write-Host "   • Use context effectively to avoid re-explaining" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2. Efficient Context Usage:" -ForegroundColor Green
    Write-Host "   • Focus on specific files/functions rather than entire codebase" -ForegroundColor White
    Write-Host "   • Use targeted semantic searches" -ForegroundColor White
    Write-Host ""
    
    Write-Host "3. Session Management:" -ForegroundColor Green
    Write-Host "   • Use 'claude --continue' to resume sessions" -ForegroundColor White
    Write-Host "   • Plan coding sessions around 5-hour limit resets" -ForegroundColor White
    Write-Host ""
    
    Write-Host "4. Model Selection (Max users):" -ForegroundColor Green
    Write-Host "   • Use Sonnet 4 for most tasks" -ForegroundColor White
    Write-Host "   • Reserve Opus 4 for complex architectural decisions" -ForegroundColor White
    Write-Host "   • Let system auto-downgrade to preserve Opus hours" -ForegroundColor White
    Write-Host ""
}

# Function to show API cost comparison
function Show-CostComparison {
    Write-Host "💰 Cost Comparison: Subscription vs API" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "API Pricing (Pay-as-you-go):" -ForegroundColor Red
    Write-Host "  • Sonnet 4: $3 input / $15 output per million tokens" -ForegroundColor White
    Write-Host "  • Opus 4: $15 input / $75 output per million tokens" -ForegroundColor White
    Write-Host "  • Haiku 3.5: $0.80 input / $4 output per million tokens" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Estimated Daily Coding Costs (API):" -ForegroundColor Red
    Write-Host "  • Light usage: $2-4/day (~$60-120/month)" -ForegroundColor White
    Write-Host "  • Medium usage: $5-10/day (~$150-300/month)" -ForegroundColor White
    Write-Host "  • Heavy usage: $15-30/day (~$450-900/month)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Subscription Benefits:" -ForegroundColor Green
    Write-Host "  • Predictable monthly cost" -ForegroundColor White
    Write-Host "  • No per-token billing surprises" -ForegroundColor White
    Write-Host "  • Includes web interface access" -ForegroundColor White
    Write-Host "  • Ideal for regular development work" -ForegroundColor White
    Write-Host ""
}

# Function to show troubleshooting steps
function Show-TroubleshootingSteps {
    Write-Host "🔧 Common Issues and Solutions:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "1. 'Hit usage limit' message:" -ForegroundColor Red
    Write-Host "   • Wait for 5-hour reset or weekly reset (Sundays)" -ForegroundColor White
    Write-Host "   • Check usage at claude.ai dashboard" -ForegroundColor White
    Write-Host "   • Consider upgrading to Max plan" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2. Authentication issues:" -ForegroundColor Red
    Write-Host "   • Run: claude logout && claude login" -ForegroundColor White
    Write-Host "   • Ensure you select 'Claude App (with Pro or Max plan)'" -ForegroundColor White
    Write-Host "   • Verify subscription is active at claude.ai" -ForegroundColor White
    Write-Host ""
    
    Write-Host "3. Unexpected API charges:" -ForegroundColor Red
    Write-Host "   • Run: claude logout && claude login" -ForegroundColor White
    Write-Host "   • Decline API credit options during setup" -ForegroundColor White
    Write-Host "   • Check authentication with: claude status" -ForegroundColor White
    Write-Host ""
    
    Write-Host "4. Model not available:" -ForegroundColor Red
    Write-Host "   • Opus 4 requires Max $200 plan" -ForegroundColor White
    Write-Host "   • Use /model sonnet-4 to switch back" -ForegroundColor White
    Write-Host "   • Check subscription tier at claude.ai" -ForegroundColor White
    Write-Host ""
}

# Main menu
function Show-Menu {
    Write-Host "Select an option:" -ForegroundColor Cyan
    Write-Host "1. Show Subscription Information" -ForegroundColor White
    Write-Host "2. Usage Optimization Tips" -ForegroundColor White
    Write-Host "3. Cost Comparison" -ForegroundColor White
    Write-Host "4. Troubleshooting Guide" -ForegroundColor White
    Write-Host "5. Quick Commands Reference" -ForegroundColor White
    Write-Host "6. Exit" -ForegroundColor White
    Write-Host ""
}

function Show-QuickCommands {
    Write-Host "⚡ Quick Commands Reference:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Authentication:" -ForegroundColor Green
    Write-Host "  claude login          # Change authentication method" -ForegroundColor White
    Write-Host "  claude logout         # Sign out completely" -ForegroundColor White
    Write-Host "  claude status         # Check current authentication" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Session Management:" -ForegroundColor Green
    Write-Host "  claude                # Start new session" -ForegroundColor White
    Write-Host "  claude --continue     # Resume last session" -ForegroundColor White
    Write-Host "  /exit                 # Exit current session" -ForegroundColor White
    Write-Host ""
    
    Write-Host "In-Session Commands:" -ForegroundColor Green
    Write-Host "  /help                 # Show all commands" -ForegroundColor White
    Write-Host "  /model sonnet-4       # Switch to Sonnet 4" -ForegroundColor White
    Write-Host "  /model opus-4         # Switch to Opus 4 (Max only)" -ForegroundColor White
    Write-Host "  /login                # Change auth without exiting" -ForegroundColor White
    Write-Host "  /clear                # Clear conversation" -ForegroundColor White
    Write-Host ""
    
    Write-Host "PowerShell Setup:" -ForegroundColor Green
    Write-Host "  npm install -g @anthropic-ai/claude-code" -ForegroundColor White
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
    Write-Host ""
}

# Main script execution
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-6)"
    
    switch ($choice) {
        "1" { Clear-Host; Show-SubscriptionInfo; Write-Host ""; Read-Host "Press Enter to continue"; Clear-Host }
        "2" { Clear-Host; Show-OptimizationTips; Write-Host ""; Read-Host "Press Enter to continue"; Clear-Host }
        "3" { Clear-Host; Show-CostComparison; Write-Host ""; Read-Host "Press Enter to continue"; Clear-Host }
        "4" { Clear-Host; Show-TroubleshootingSteps; Write-Host ""; Read-Host "Press Enter to continue"; Clear-Host }
        "5" { Clear-Host; Show-QuickCommands; Write-Host ""; Read-Host "Press Enter to continue"; Clear-Host }
        "6" { Write-Host "👋 Happy coding with Claude!" -ForegroundColor Green; break }
        default { Write-Host "Invalid choice. Please select 1-6." -ForegroundColor Red }
    }
} while ($choice -ne "6")
