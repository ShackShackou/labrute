/**
 * SHACKERS Design System
 * Cyberpunk/Sci-Fi theme with neon cyan and flame accents
 */

export const shackersTheme = {
  colors: {
    // Primary - Cyan/Turquoise (neon glow)
    primary: {
      main: '#00E5FF',      // Bright cyan
      light: '#62EFFF',     // Light cyan
      dark: '#00B8D4',      // Deep cyan
      glow: '#00E5FF40',    // Cyan with transparency for glow effects
    },

    // Secondary - Red/Orange (flame)
    secondary: {
      main: '#FF5252',      // Red flame
      light: '#FF6E40',     // Orange flame
      dark: '#E53935',      // Deep red
      glow: '#FF525240',    // Red with transparency for glow effects
    },

    // Background
    background: {
      default: '#000000',   // Pure black
      paper: '#0A0A0A',     // Slightly lighter black for cards
      paperLight: '#141414', // Lighter cards/panels
      paperAccent: '#1A1A1A', // Accent panels
      gradient: 'linear-gradient(135deg, #000000 0%, #0A1929 100%)', // Dark blue-black gradient
    },

    // Text
    text: {
      primary: '#FFFFFF',   // White
      secondary: '#B0BEC5', // Light gray
      disabled: '#546E7A',  // Medium gray
      cyan: '#00E5FF',      // Cyan text for highlights
      red: '#FF5252',       // Red text for accents
    },

    // Semantic colors
    success: '#00E676',     // Neon green (wins, positive)
    error: '#FF5252',       // Red (losses, damage)
    warning: '#FFD600',     // Yellow (alerts)
    info: '#00E5FF',        // Cyan (info)

    // UI borders
    border: {
      main: '#00E5FF80',    // Cyan border with transparency
      dark: '#00E5FF40',    // Darker cyan border
      outer: '#00E5FF',     // Solid cyan border
      glow: '0 0 10px #00E5FF, 0 0 20px #00E5FF40', // Neon glow effect
    },

    // Combat-specific
    combat: {
      hp: '#FF5252',        // HP bar red
      hpBg: '#4A0000',      // HP bar background
      xp: '#00E5FF',        // XP bar cyan
      xpBg: '#003D4A',      // XP bar background
      damage: '#FF5252',    // Damage numbers
      heal: '#00E676',      // Heal numbers
      crit: '#FFD600',      // Critical hit
    },

    // Ranking/Rarity colors
    rarity: {
      common: '#78909C',    // Gray
      uncommon: '#00E676',  // Green
      rare: '#00E5FF',      // Cyan
      epic: '#AB47BC',      // Purple
      legendary: '#FFD600', // Gold
    },
  },

  typography: {
    fontFamily: {
      primary: '"Rajdhani", "Orbitron", "Roboto", sans-serif', // Futuristic sans-serif
      display: '"Orbitron", "Rajdhani", sans-serif',            // Display font (headings)
      mono: '"Roboto Mono", monospace',                          // Monospace for codes
    },
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.25rem',   // 20px
      xl: '1.5rem',    // 24px
      '2xl': '2rem',   // 32px
      '3xl': '3rem',   // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
      wider: '0.1em',
      widest: '0.15em',
    },
  },

  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',  // Pill shape
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 229, 255, 0.05)',
    md: '0 4px 6px -1px rgba(0, 229, 255, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 229, 255, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 229, 255, 0.3)',
    glow: '0 0 20px rgba(0, 229, 255, 0.5)',
    glowStrong: '0 0 30px rgba(0, 229, 255, 0.8)',
    redGlow: '0 0 20px rgba(255, 82, 82, 0.5)',
  },

  effects: {
    // Neon glow animation
    neonPulse: `
      @keyframes neon-pulse {
        0%, 100% { filter: drop-shadow(0 0 5px #00E5FF) drop-shadow(0 0 10px #00E5FF); }
        50% { filter: drop-shadow(0 0 10px #00E5FF) drop-shadow(0 0 20px #00E5FF); }
      }
    `,

    // Flame flicker animation
    flameFlicker: `
      @keyframes flame-flicker {
        0%, 100% { filter: drop-shadow(0 0 5px #FF5252) drop-shadow(0 0 10px #FF5252); }
        50% { filter: drop-shadow(0 0 8px #FF6E40) drop-shadow(0 0 15px #FF6E40); }
      }
    `,

    // Particle background
    particleBackground: `
      background-image:
        radial-gradient(2px 2px at 20px 30px, #00E5FF20, transparent),
        radial-gradient(2px 2px at 60px 70px, #FF525220, transparent),
        radial-gradient(1px 1px at 50px 50px, #00E5FF10, transparent);
      background-size: 100px 100px;
      background-repeat: repeat;
    `,
  },

  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },

  zIndex: {
    background: 0,
    content: 1,
    header: 10,
    overlay: 20,
    modal: 30,
    tooltip: 40,
    notification: 50,
  },
} as const;

// Export type for TypeScript autocomplete
export type ShackersTheme = typeof shackersTheme;

// Helper: Get MUI-compatible theme overrides
export const getMuiThemeOverrides = () => ({
  palette: {
    mode: 'dark' as const,
    primary: {
      main: shackersTheme.colors.primary.main,
      light: shackersTheme.colors.primary.light,
      dark: shackersTheme.colors.primary.dark,
    },
    secondary: {
      main: shackersTheme.colors.secondary.main,
      light: shackersTheme.colors.secondary.light,
      dark: shackersTheme.colors.secondary.dark,
    },
    background: {
      default: shackersTheme.colors.background.default,
      paper: shackersTheme.colors.background.paper,
    },
    text: {
      primary: shackersTheme.colors.text.primary,
      secondary: shackersTheme.colors.text.secondary,
      disabled: shackersTheme.colors.text.disabled,
    },
    success: {
      main: shackersTheme.colors.success,
    },
    error: {
      main: shackersTheme.colors.error,
    },
    warning: {
      main: shackersTheme.colors.warning,
    },
    info: {
      main: shackersTheme.colors.info,
    },
  },
  typography: {
    fontFamily: shackersTheme.typography.fontFamily.primary,
  },
  shape: {
    borderRadius: 8,
  },
});
