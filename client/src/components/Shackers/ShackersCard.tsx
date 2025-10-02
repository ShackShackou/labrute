import { Paper, PaperProps, styled } from '@mui/material';
import React from 'react';
import { shackersTheme } from '../../theme/shackers';

export interface ShackersCardProps extends PaperProps {
  glow?: boolean;
  bordered?: boolean;
  gradient?: boolean;
}

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'glow' && prop !== 'bordered' && prop !== 'gradient',
})<{ glow?: boolean; bordered?: boolean; gradient?: boolean }>(({ glow, bordered, gradient }) => ({
  backgroundColor: gradient
    ? 'transparent'
    : shackersTheme.colors.background.paper,
  backgroundImage: gradient
    ? `linear-gradient(135deg, ${shackersTheme.colors.background.paper} 0%, ${shackersTheme.colors.background.paperLight} 100%)`
    : 'none',
  borderRadius: shackersTheme.borderRadius.lg,
  border: bordered
    ? `2px solid ${shackersTheme.colors.border.main}`
    : 'none',
  boxShadow: glow
    ? shackersTheme.shadows.glow
    : shackersTheme.shadows.md,
  padding: shackersTheme.spacing[4],
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  // Particle background effect (optional)
  '&::before': glow ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: shackersTheme.effects.particleBackground,
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 0,
  } : undefined,

  // Content wrapper to sit above particles
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },

  '&:hover': glow ? {
    boxShadow: shackersTheme.shadows.glowStrong,
    transform: 'translateY(-2px)',
  } : undefined,
}));

/**
 * ShackersCard - Cyberpunk-styled card/panel component
 *
 * @example
 * <ShackersCard glow bordered>
 *   <Text>Card content</Text>
 * </ShackersCard>
 */
export const ShackersCard = React.forwardRef<HTMLDivElement, ShackersCardProps>(
  ({ glow = false, bordered = true, gradient = false, children, ...props }, ref) => {
    return (
      <StyledCard
        ref={ref}
        glow={glow}
        bordered={bordered}
        gradient={gradient}
        {...props}
      >
        {children}
      </StyledCard>
    );
  }
);

ShackersCard.displayName = 'ShackersCard';

export default ShackersCard;
