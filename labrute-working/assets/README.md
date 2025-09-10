# 🤖 Claude Code + LaBrute Reborn Development Setup

This directory contains everything you need to set up and use Claude Code with your Claude.ai subscription for developing the LaBrute Reborn arena combat game.

## 📁 Files Overview

### 📚 Documentation
- **`claude-code-setup.md`** - Complete setup guide with authentication options
- **`README.md`** - This file, your starting point

### 🔧 Setup Scripts
- **`setup-claude-code.ps1`** - Automated installation and setup script
- **`claude-usage-monitor.ps1`** - Usage tracking and optimization tool

### ⚙️ Configuration
- **`claude-config-template.json`** - Advanced configuration template

### 🎮 Game Assets
- **`background.png`** - Arena background
- **`fight1.png`** & **`fight2.png`** - Combat sprites
- **`hammerWeapon.png`** & **`swordWeapon.png`** - Weapon assets
- **`trombone3-1 (1).gif`** - Animation asset

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```powershell
# Run the automated setup script
.\assets\setup-claude-code.ps1
```

### Option 2: Manual Setup
```powershell
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Navigate to project
cd "c:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute Reborn - Arena Combat-Strengthen guaranteed hit and dodge feedback systems (1)"

# Start Claude Code
claude
```

## 💳 Subscription Requirements

You need an active Claude.ai subscription:

| Plan | Cost | Claude Code Usage | Best For |
|------|------|-------------------|----------|
| **Pro** | $20/month | 10-40 prompts per 5h | Individual development |
| **Max** | $100/month | 50-200 prompts per 5h | Professional projects |
| **Max Premium** | $200/month | 50-200+ prompts + Opus 4 | Enterprise development |

## 🎯 LaBrute-Specific Usage

### Combat System Development
```powershell
# Start Claude Code in your project
claude

# Example prompts for your arena combat system:
"Analyze the hit and dodge feedback systems in my LaBrute combat code"
"Help me strengthen the guaranteed hit mechanics"
"Review my weapon damage calculations for balance"
"Optimize the combat animation timing"
```

### Asset Integration
```powershell
# Load game assets into context
"Review my weapon sprites and suggest combat animations"
"Help integrate the background.png into the arena system"
"Optimize the trombone animation for combat feedback"
```

### Code Architecture
```powershell
# System design assistance
"Design a robust hit/miss feedback system for turn-based combat"
"Create modular weapon damage calculation functions"
"Implement arena state management with visual feedback"
```

## 📊 Usage Monitoring

Run the usage monitor to track your limits:
```powershell
.\assets\claude-usage-monitor.ps1
```

This tool provides:
- Real-time usage information
- Optimization suggestions
- Cost comparisons
- Troubleshooting guides

## 🔧 Authentication Setup

### Subscription-Only Mode (Recommended)
1. Run `claude login`
2. Select "Claude App (with Pro or Max plan)"
3. **Decline API credit options**
4. Log in with your Claude.ai credentials

### Ensure Subscription-Only Usage
```powershell
# Reset to subscription-only if you have API configured
claude logout
claude login
# Select subscription option and decline API credits
```

## ⚡ Essential Commands

### Session Management
```powershell
claude                    # Start new session
claude --continue         # Resume last session
```

### In-Session Commands
```
/help                     # Show all commands
/model sonnet-4          # Use Sonnet 4 (default)
/model opus-4            # Use Opus 4 (Max $200 only)
/login                   # Change authentication
/exit                    # Exit session
```

### Authentication Commands
```powershell
claude status            # Check current auth method
claude logout           # Sign out completely
claude login            # Change authentication
```

## 🎮 Game Development Workflow

### 1. Combat System Analysis
```powershell
# Start Claude Code
claude

# Analyze existing combat mechanics
"Review my arena combat system and identify areas for improvement"
```

### 2. Asset Integration
```powershell
# Load assets into context
"Help me integrate these weapon sprites into my combat system: hammerWeapon.png, swordWeapon.png"
```

### 3. Feedback System Enhancement
```powershell
# Strengthen hit/dodge feedback
"Design a more responsive hit confirmation system for my arena combat"
"Create visual and audio feedback for successful hits and dodges"
```

### 4. Code Optimization
```powershell
# Performance improvements
"Optimize my combat calculation functions for better performance"
"Review memory usage in my arena rendering system"
```

## 🛠️ Troubleshooting

### Common Issues

**"Hit usage limit" message:**
- Wait for 5-hour reset or weekly reset (Sundays)
- Check usage at claude.ai dashboard
- Consider upgrading subscription tier

**Authentication problems:**
```powershell
claude logout
claude login
# Select "Claude App (with Pro or Max plan)"
```

**Unexpected API charges:**
```powershell
claude logout
claude login
# Decline API credit options during setup
```

**Model access issues:**
- Opus 4 requires Max $200 plan
- Use `/model sonnet-4` to switch back
- Verify subscription at claude.ai

### Get Help
- Use `/help` in Claude Code sessions
- Run `.\assets\claude-usage-monitor.ps1` for guidance
- Check Claude.ai status page for service updates
- Review `claude-code-setup.md` for detailed instructions

## 🎯 Project Goals

Using Claude Code to enhance your LaBrute Reborn arena combat system:

1. **Strengthen hit/dodge feedback** - Visual and audio confirmations
2. **Improve combat balance** - Weapon damage and timing
3. **Optimize performance** - Efficient rendering and calculations
4. **Enhance user experience** - Responsive and engaging combat

## 💡 Pro Tips

1. **Batch related questions** to maximize prompt efficiency
2. **Use specific file references** rather than general queries
3. **Plan coding sessions** around 5-hour limit resets
4. **Monitor usage** regularly through the dashboard
5. **Use Opus 4 sparingly** for complex architectural decisions (Max users)

## 📈 Getting the Most Value

### For Pro Users ($20/month)
- Focus on specific features rather than broad refactoring
- Use targeted queries about individual functions
- Plan major development sessions around limit resets

### For Max Users ($100-200/month)
- Leverage full codebase analysis capabilities
- Use architectural planning and system design features
- Take advantage of Opus 4 for complex decision making

---

**Ready to enhance your LaBrute arena combat system? Start with the automated setup script and begin coding with AI assistance!**

```powershell
.\assets\setup-claude-code.ps1
```
