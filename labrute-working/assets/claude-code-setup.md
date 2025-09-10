# Claude Code Setup with Claude.ai Subscription

## Overview
Claude Code works seamlessly with your existing Claude.ai subscription (Pro or Max), eliminating the need for separate API keys or per-token billing. This guide walks you through the complete setup process.

## Prerequisites
- Active Claude.ai subscription (Pro $20/month or Max $100-200/month)
- Node.js installed on your system
- Terminal/PowerShell access

## Installation Steps

### 1. Install Claude Code
```powershell
npm install -g @anthropic-ai/claude-code
```

### 2. Navigate to Your Project Directory
```powershell
cd "c:\Users\thesh\OneDrive\Documents\CODES\__ROSEBUD-AI-LABRUTE\LaBrute Reborn - Arena Combat-Strengthen guaranteed hit and dodge feedback systems (1)"
```

### 3. Start Claude Code
```powershell
npx @anthropic-ai/claude-code
```
*Note: Use `npx` to ensure you're running the correct terminal-based Claude Code*

### 3. Initialize Claude Code
```powershell
npx @anthropic-ai/claude-code
```

### 4. Authentication Setup
When Claude Code starts:
1. **Trust the folder** when prompted (select "Yes, proceed")
2. Claude Code may auto-authenticate or prompt for login
3. **If authentication is needed**, use `/login` command within Claude Code
4. **Check your setup** with `/status` command
5. **Important**: Ensure you're using subscription authentication, not API billing

## Usage Limits by Plan

### Claude Pro ($20/month)
- **Web Usage**: ~45 messages every 5 hours
- **Claude Code**: 10-40 prompts per 5-hour window
- **Weekly Cap**: 40-80 hours of Sonnet 4
- **Best For**: Individual developers, repositories under 1,000 lines

### Claude Max ($100/month)
- **Limits**: 5x Pro levels
- **Claude Code**: 50-200 prompts per 5-hour window
- **Weekly Cap**: 140-280 hours of Sonnet 4
- **Best For**: Professional development, medium projects

### Claude Max ($200/month)
- **Limits**: 20x Pro levels
- **Models**: Full access to Claude Opus 4 + Sonnet 4
- **Weekly Cap**: 240-480 hours of Sonnet 4 + Opus hours
- **Best For**: Enterprise development, large codebases

## Key Commands

### Authentication Management
```powershell
# Check current authentication status and setup
/status

# Change authentication method (run within Claude Code)
/login

# Alternative: Start fresh session
npx @anthropic-ai/claude-code
```

### Model Selection (Max subscribers only)
```powershell
# Switch between models
/model sonnet-4
/model opus-4

# System auto-downgrades when approaching Opus limits
```

### Session Management
```powershell
# Start new session
npx @anthropic-ai/claude-code

# Continue existing session (within Claude Code)
/continue

# Exit Claude Code (within Claude Code)
/exit
```

## Authentication Options

### 1. Subscription Authentication (Recommended)
- Uses Claude.ai credentials
- Counts against subscription limits
- No additional API costs
- Secure credential storage in system Keychain

### 2. API Authentication (Optional)
- Pay-as-you-go pricing: $3/$15 per million tokens (Sonnet 4)
- Unlimited usage without rate limits
- Better for CI/CD integration
- Can be used as overflow option

### 3. Enterprise Options
- Amazon Bedrock integration
- Google Vertex AI integration
- Custom authentication scripts via `apiKeyHelper`

## Cost Comparison

### Subscription vs API
- **Daily coding with Sonnet 4 API**: ~$9.18/month
- **Claude Pro subscription**: $20/month (includes web access)
- **Break-even point**: Heavy usage favors subscription model

### API Pricing (for reference)
- **Sonnet 4**: $3 input / $15 output per million tokens
- **Opus 4**: $15 input / $75 output per million tokens
- **Haiku 3.5**: $0.80 input / $4 output per million tokens

## Features Available to All Users
- 200K token context window
- Full tool support (bash commands, file operations)
- IDE integrations
- Codebase understanding
- Repository analysis
- Code generation and debugging

## Troubleshooting

### Reset to Subscription-Only Mode
If you previously configured API access:
```powershell
claude logout
claude login
# Select "Claude App (with Pro or Max plan)"
# Decline API credit options
```

### Check Usage Limits
- Monitor usage in Claude.ai web interface
- Weekly caps reset every Sunday
- 5-hour limits reset automatically

### Switch Authentication Methods
```powershell
# Use in-session command
/login
# Follow prompts to change authentication type
```

## Best Practices

1. **Start with subscription authentication** for simplicity
2. **Monitor usage** through Claude.ai dashboard
3. **Use API overflow** only when needed for critical deadlines
4. **Choose Max plan** for professional development workflows
5. **Keep sessions focused** to maximize prompt efficiency

## Security Notes
- Credentials stored securely in system Keychain (macOS) or equivalent
- No API keys needed for subscription authentication
- Authentication tokens encrypted at rest
- Session data isolated per project directory

## Getting Help
- Use `/help` command within Claude Code
- Check Claude.ai status page for service updates
- Contact Anthropic support for subscription issues
- Review documentation at docs.anthropic.com

---

*This setup ensures you get the full Claude Code experience using only your existing Claude.ai subscription, with no additional API costs or complexity.*
