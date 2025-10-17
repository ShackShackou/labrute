import { Box, BoxProps, useTheme } from '@mui/material';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';

export interface StyledButtonProps extends Omit<BoxProps, 'translate' | 'onClick'> {
  image?: string;
  imageHover?: string;
  swapImage?: boolean;
  shadow?: boolean;
  contrast?: boolean;
  shift?: string;
  shiftMargin?: boolean;
  shadowColor?: string;
  to?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const StyledButtonWidth = 207;
export const StyledButtonHeight = 58;

/**
 * StyledButton component
 */
const StyledButton = React.forwardRef<HTMLDivElement, StyledButtonProps>(({
  children,
  image = '/images/button.svg',
  imageHover = '/images/button-hover.svg',
  swapImage = true,
  shadow = true,
  contrast = true,
  shift = '4px',
  shiftMargin = false,
  shadowColor = 'rgba(0, 0, 0, 0.2)',
  to,
  onClick,
  sx,
  ...rest
}: StyledButtonProps, ref) => {
  const { palette: { mode } } = useTheme();
  const navigate = useNavigate();

  const themedImage = mode === 'dark' ? image.replace('/images/', '/images/dark/') : image;
  const themedImageHover = mode === 'dark' ? imageHover.replace('/images/', '/images/dark/') : imageHover;

  // Controlled hover state
  const [hover, setHover] = React.useState(false);

  const handleMouseEnter = useCallback(() => {
    setHover(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    console.log('🖱️ StyledButton clicked!', 'has onClick:', !!onClick, 'has to:', !!to);
    // Call the original onClick handler if it exists
    if (onClick) {
      console.log('✅ Calling onClick handler');
      onClick(event);
    }
    // Then handle navigation if 'to' is provided
    if (to) {
      console.log('🧭 Navigating to:', to);
      navigate(to);
    }
  }, [onClick, to, navigate]);

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        console.log('📍 Box onClick fired!');
        handleClick(e);
      }}
      ref={ref}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        width: StyledButtonWidth,
        height: StyledButtonHeight,
        pt: hover ? 0 : shift,
        pb: shift,
        cursor: 'pointer',
        backgroundImage: `url('${swapImage ? hover ? themedImageHover : themedImage : themedImage}')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100%',
        filter: `${shadow ? `drop-shadow(4px 4px 0px ${shadowColor})` : ''} ${contrast && hover ? 'contrast(90%)' : ''}`,
        fontVariant: 'small-caps',
        fontWeight: 'bold',
        color: 'secondary.main',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        ...sx,
        mb: (hover && shiftMargin) ? 1 : undefined,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

StyledButton.displayName = 'StyledButton';

export default StyledButton;
