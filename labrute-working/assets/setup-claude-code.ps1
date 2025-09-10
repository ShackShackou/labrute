# Claude Code Quick Setup Script for Windows PowerShell
# Run this script to automatically set up Claude Code with your Claude.ai subscription

Write-Host "🤖 Claude Code Setup with Subscription Authentication" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if npm is available
Write-Host "Checking npm availability..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please ensure npm is installed with Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Installing Claude Code globally..." -ForegroundColor Yellow
try {
    npm install -g @anthropic-ai/claude-code
    Write-Host "✅ Claude Code installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Claude Code. You may need to run PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Try running: Start-Process PowerShell -Verb RunAs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📁 Navigating to project directory..." -ForegroundColor Yellow
$projectPath = "c:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute Reborn - Arena Combat-Strengthen guaranteed hit and dodge feedback systems (1)"
Set-Location $projectPath
Write-Host "✅ Current directory: $(Get-Location)" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Starting Claude Code..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 IMPORTANT SETUP INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. When prompted, select 'Claude App (with Pro or Max plan)'" -ForegroundColor White
Write-Host "2. Log in with your Claude.ai credentials" -ForegroundColor White
Write-Host "3. DECLINE API credit options to use subscription-only mode" -ForegroundColor Red
Write-Host "4. Your usage will count against your Claude.ai subscription limits" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to launch Claude Code..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Launch Claude Code
claude

Write-Host ""
Write-Host "✅ Claude Code setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Your subscription limits:" -ForegroundColor Cyan
Write-Host "• Pro ($20/month): 10-40 prompts per 5-hour window" -ForegroundColor White
Write-Host "• Max ($100/month): 50-200 prompts per 5-hour window" -ForegroundColor White  
Write-Host "• Max ($200/month): 50-200 prompts + Opus 4 access" -ForegroundColor White
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Cyan
Write-Host "• /help - Show all available commands" -ForegroundColor White
Write-Host "• /model - Switch between models (Max only)" -ForegroundColor White
Write-Host "• /login - Change authentication method" -ForegroundColor White
Write-Host "• /exit - Exit Claude Code" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy coding with Claude!" -ForegroundColor Green
