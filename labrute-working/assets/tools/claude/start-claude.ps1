Write-Host "🤖 Setting up Claude Code with your Anthropic Max Plan" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Current Location: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 AUTHENTICATION INSTRUCTIONS:" -ForegroundColor Green
Write-Host "When Claude Code starts, you'll see authentication options." -ForegroundColor White
Write-Host ""
Write-Host "✅ SELECT: 'Claude App (with Pro or Max plan)'" -ForegroundColor Green
Write-Host "✅ LOG IN: Use your Claude.ai account credentials" -ForegroundColor Green
Write-Host "❌ DECLINE: Any API credit options (to use subscription-only)" -ForegroundColor Red
Write-Host ""

Write-Host "💳 Your Max Plan Benefits:" -ForegroundColor Magenta
Write-Host "• 50-200 prompts per 5-hour window" -ForegroundColor White
Write-Host "• Access to Claude Sonnet 4" -ForegroundColor White
Write-Host "• Access to Claude Opus 4 (if you have $200 plan)" -ForegroundColor White
Write-Host "• 140-480 hours weekly (depending on $100 or $200 tier)" -ForegroundColor White
Write-Host ""

Write-Host "🎮 Your LaBrute Project:" -ForegroundColor Yellow
Write-Host "Claude Code will help you with:" -ForegroundColor White
Write-Host "• Combat system improvements" -ForegroundColor White
Write-Host "• Hit/dodge feedback enhancement" -ForegroundColor White
Write-Host "• Code optimization and debugging" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting Claude Code now..." -ForegroundColor Green
Write-Host "Press Ctrl+C to exit Claude Code when done." -ForegroundColor Yellow
Write-Host ""

# Start Claude Code in terminal mode only (no browser)
claude --no-browser --terminal-only
