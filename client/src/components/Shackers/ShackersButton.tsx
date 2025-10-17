import { Button, ButtonProps, styled } from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { shackersTheme } from '../../theme/shackers';

export type ShackersButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ShackersButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: ShackersButtonVariant;
  glow?: boolean;
  fullWidth?: boolean;
  to?: string;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'glow',
})<{ variant?: ShackersButtonVariant; glow?: boolean }>(({ variant = 'primary', glow }) => {
  const baseStyles = {
    fontFamily: shackersTheme.typography.fontFamily.display,
    fontWeight: shackersTheme.typography.fontWeight.bold,
    letterSpacing: shackersTheme.typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
    borderRadius: shackersTheme.borderRadius.md,
    padding: `${shackersTheme.spacing[3]} ${shackersTheme.spacing[6]}`,
    fontSize: shackersTheme.typography.fontSize.sm,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

    // Hover effect overlay
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s',
    },

    '&:hover::before': {
      left: '100%',
    },

    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };

  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${shackersTheme.colors.primary.main} 0%, ${shackersTheme.colors.primary.dark} 100%)`,
      color: shackersTheme.colors.background.default,
      border: `2px solid ${shackersTheme.colors.primary.main}`,
      boxShadow: glow ? shackersTheme.shadows.glow : shackersTheme.shadows.md,

      '&:hover': {
        background: `linear-gradient(135deg, ${shackersTheme.colors.primary.light} 0%, ${shackersTheme.colors.primary.main} 100%)`,
        boxShadow: shackersTheme.shadows.glowStrong,
        transform: 'translateY(-2px)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    },

    secondary: {
      background: `linear-gradient(135deg, ${shackersTheme.colors.secondary.main} 0%, ${shackersTheme.colors.secondary.dark} 100%)`,
      color: shackersTheme.colors.text.primary,
      border: `2px solid ${shackersTheme.colors.secondary.main}`,
      boxShadow: glow ? shackersTheme.shadows.redGlow : shackersTheme.shadows.md,

      '&:hover': {
        background: `linear-gradient(135deg, ${shackersTheme.colors.secondary.light} 0%, ${shackersTheme.colors.secondary.main} 100%)`,
        boxShadow: `0 0 20px ${shackersTheme.colors.secondary.main}80`,
        transform: 'translateY(-2px)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    },

    ghost: {
      background: 'transparent',
      color: shackersTheme.colors.primary.main,
      border: `2px solid ${shackersTheme.colors.primary.main}`,
      boxShadow: 'none',

      '&:hover': {
        background: shackersTheme.colors.primary.glow,
        boxShadow: glow ? shackersTheme.shadows.glow : 'none',
        transform: 'translateY(-2px)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    },

    danger: {
      background: `linear-gradient(135deg, ${shackersTheme.colors.error} 0%, #C62828 100%)`,
      color: shackersTheme.colors.text.primary,
      border: `2px solid ${shackersTheme.colors.error}`,
      boxShadow: glow ? shackersTheme.shadows.redGlow : shackersTheme.shadows.md,

      '&:hover': {
        background: `linear-gradient(135deg, #FF6E40 0%, ${shackersTheme.colors.error} 100%)`,
        boxShadow: `0 0 20px ${shackersTheme.colors.error}80`,
        transform: 'translateY(-2px)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
});

/**
 * ShackersButton - Cyberpunk-styled button component
 *
 * @example
 * <ShackersButton variant="primary" glow>
 *   Create Brute
 * </ShackersButton>
 */
export const ShackersButton = React.forwardRef<HTMLButtonElement, ShackersButtonProps>(
  ({ variant = 'primary', glow = false, fullWidth, to, children, ...props }, ref) => {
    return (
      <StyledButton
        ref={ref}
        variant={variant}
        glow={glow}
        fullWidth={fullWidth}
        component={to ? RouterLink : undefined}
        to={to}
        {...props}
      >
        {children}
      </StyledButton>
    );
  }
);

ShackersButton.displayName = 'ShackersButton';

export default ShackersButton;
