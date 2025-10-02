import { pad } from '@labrute/core';
import { Box, BoxProps, Link, Paper, Tooltip, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { shackersTheme } from '../theme/shackers';
import Text from './Text';

export interface HeaderProps extends BoxProps {
  url?: string;
}

const Header = ({
  url,
  ...rest
}: HeaderProps) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const theme = useTheme();
  const { modifiers } = useAuth();

  const [time, setTime] = useState(dayjs.utc());
  const [marqueePaused, setMarqueePaused] = useState(localStorage.getItem('marqueePaused') === dayjs.utc().format('YYYY-MM-DD'));

  // Randomized left art
  const leftArt = useMemo(() => Math.floor(Math.random() * (11 - 1 + 1) + 1), []);
  // Randomized right art (must be different from left art)
  const rightArt = useMemo(() => {
    let art = Math.floor(Math.random() * (11 - 1 + 1) + 1);
    while (art === leftArt) {
      art = Math.floor(Math.random() * (11 - 1 + 1) + 1);
    }
    return art;
  }, [leftArt]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(dayjs.utc());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Pause marquee
  const pauseMarquee = () => {
    setMarqueePaused((prev) => {
      if (prev) {
        localStorage.removeItem('marqueePaused');
        return false;
      }
      localStorage.setItem('marqueePaused', time.format('YYYY-MM-DD'));
      return true;
    });
  };

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 2,
        mb: 2,
      }}
      {...rest}
    >
      {/* SHACKERS BANNER */}
      <Link component={RouterLink} to={url || '/'} sx={{ display: 'block', textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'relative',
            width: 1,
            height: 200,
            background: `linear-gradient(135deg, ${shackersTheme.colors.background.default} 0%, ${shackersTheme.colors.background.paper} 100%)`,
            border: `2px solid ${shackersTheme.colors.primary.main}`,
            borderRadius: shackersTheme.borderRadius.lg,
            boxShadow: shackersTheme.shadows.glow,
            overflow: 'hidden',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: shackersTheme.shadows.glowStrong,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box
            component="img"
            src="/images/shackers-banner.jpg"
            alt="SHACKERS"
            sx={{
              width: 1,
              height: 1,
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </Box>
      </Link>
      <Tooltip title={t('serverTime')}>
        <Text center bold color="secondary">
          <Box component="img" src="/images/time.webp" sx={{ width: 11, mr: 0.5 }} />
          {time.format('HH:mm')}
        </Text>
      </Tooltip>
      {!!modifiers.length && (
        <Paper sx={{ mx: 1, p: 0, cursor: 'pointer' }} onClick={pauseMarquee}>
          <Marquee
            pauseOnHover
            play={!marqueePaused}
            style={{
              justifyContent: 'center',
            }}
          >
            <Text bold smallCaps sx={{ mr: 0.5 }}>
              {t('activeModifiers')}:
            </Text>
            {modifiers.map((modifier) => (
              <Text key={modifier} sx={{ mr: 1 }}>
                <Text component="span" bold color="secondary" smallCaps>
                  {t(`modifier.${modifier}`)}
                </Text>:{' '}
                {t(`modifier.${modifier}.desc`)}
              </Text>
            ))}
          </Marquee>
        </Paper>
      )}
    </Box>
  );
};

export default Header;
