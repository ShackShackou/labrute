import { getRandomBody, getRandomColors, isNameValid, TOKEN_COOKIE, USER_COOKIE, UserWithBrutesBodyColor } from '@labrute/core';
import { Gender } from '@labrute/prisma';
import { Lock, LockOpen } from '@mui/icons-material';
import { Box, IconButton, Link, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import BoxBg from '../components/BoxBg';
import BruteRender from '../components/Brute/Body/BruteRender';
import EmptyBrute from '../components/Brute/Body/EmptyBrute';
import FantasyButton from '../components/FantasyButton';
import Page from '../components/Page';
import { ShackersButton, ShackersCard } from '../components/Shackers';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import Text from '../components/Text';
import { useAlert } from '../hooks/useAlert';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { shackersTheme } from '../theme/shackers';
import { getRandomAd } from '../utils/ads';
import catchError from '../utils/catchError';
import { setCookie } from '../utils/cookies';
import Fetch from '../utils/Fetch';
import Server from '../utils/Server';
import HomeMobileView from './mobile/HomeMobileView';

/**
 * HomeView component
 */
const HomeView = () => {
  const { t } = useTranslation();
  const smallScreen = useMediaQuery('(max-width: 935px)');
  const Alert = useAlert();
  const { authing, setAuthing, updateData, user } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { palette: { mode } } = useTheme();

  // On login error
  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    if (error) {
      Alert.open('error', t('loginError'));
    }
  }, [Alert, t]);

  // On login success
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // Default URL to website root, clear all OAuth search params.
    if (url.pathname === '/oauth/callback') {
      url.pathname = '/';
      url.searchParams.delete('code');
      url.searchParams.delete('state');
    }

    if (code && !authing && !user) {
      setAuthing(true);
      Fetch<UserWithBrutesBodyColor>('/api/oauth/token', { code }).then((response) => {
        // Update language
        setLanguage(response.lang);

        updateData(response);

        // Save user data in cookies
        setCookie(USER_COOKIE, response.id, 7);
        setCookie(TOKEN_COOKIE, response.connexionToken, 7);
        Alert.open('success', t('loginSuccess'));

        // Redirect to first brute if exists
        if (response.brutes.length) {
          url.pathname = `/${response.brutes[0]?.name}/cell`;
          // force refresh
          window.location.href = url.toString();
        }
        window.history.replaceState({}, '', url.toString());
      }).catch(catchError(Alert)).finally(() => {
        window.history.replaceState({}, '', url.toString());
        setAuthing(false);
      });
    }
  }, [Alert, authing, setAuthing, setLanguage, t, updateData, user]);

  // Randomized left ad
  const leftAd = useMemo(() => getRandomAd(language), [language]);
  // Randomized right ad (must be different from left ad)
  const rightAd = useMemo(() => getRandomAd(language, leftAd.name), [language, leftAd.name]);

  const [name, setName] = useState('');

  /* CHARACTER CREATOR */
  const [creationStarted, setCreationStarted] = useState(false);
  const [fixBruteAppearance, setFixBruteAppearance] = useState(false);
  const [gender, setGender] = useState<Gender>(Gender.female);
  const [body, setBody] = useState(getRandomBody(gender));
  const [colors, setColors] = useState(getRandomColors(gender));

  // Colors randomizer
  const randomizeColors = useCallback((currentGender: Gender) => {
    setColors(getRandomColors(currentGender));
  }, []);

  // Body parts randomizer
  const randomizeAppearance = useCallback(() => {
    const newGender = gender === 'male' ? 'female' : 'male';
    setGender(newGender);

    setBody(getRandomBody(newGender));

    randomizeColors(newGender);
  }, [gender, randomizeColors]);

  // Name change handler
  const changeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);

    // Change character
    if (!creationStarted) setCreationStarted(true);
    if (!fixBruteAppearance) {
      randomizeAppearance();
    }
  }, [creationStarted, fixBruteAppearance, randomizeAppearance]);

  // Change appearance
  const changeAppearance = useCallback(() => {
    if (creationStarted) {
      randomizeAppearance();
    }
  }, [creationStarted, randomizeAppearance]);

  // Change colors
  const changeColors = useCallback(() => {
    if (creationStarted) {
      randomizeColors(gender);
    }
  }, [creationStarted, gender, randomizeColors]);

  const createBrute = useCallback(async () => {
    // Check if logged in
    if (!user) {
      Alert.open('error', t('pleaseLogin'));
      return;
    }

    // Check name validity
    if (!isNameValid(name)) {
      Alert.open('error', t('invalidName'));
      return;
    }

    // Check if the name is available
    const isNameAvailable = await Server.Brute.isNameAvailable(name)
      .catch(catchError(Alert));

    if (typeof isNameAvailable !== 'boolean') {
      Alert.open('error', 'wut?');
      return;
    }

    if (!isNameAvailable) {
      Alert.open('error', t('nameUnavailable'));
      return;
    }

    // Create brute

    // Get referer
    const url = new URL(window.location.href);
    const referer = url.searchParams.get('ref');
    const eventId = url.searchParams.get('event');

    const response = await Server.Brute.create(
      name,
      user.id,
      gender,
      body,
      colors,
      referer,
      eventId
    ).catch(catchError(Alert));

    if (response?.brute) {
      updateData({
        ...user,
        // Add brute to user brutes
        brutes: user.brutes ? [...user.brutes, response.brute] : [response.brute],
        // Update gold
        gold: user.gold - response.goldLost,
        // Update brute limit
        bruteLimit: response.newLimit,
      });
      // Redirect to brute page
      navigate(`/${name}/cell`);
    }
  }, [Alert, colors, body, gender, name, navigate, t, updateData, user]);

  // Login
  const login = useCallback(() => {
    Fetch<{ url: string }>('/api/oauth/redirect').then(({ url }) => {
      window.location.href = url;
    }).catch(catchError(Alert));
  }, [Alert]);

  const character = (
    <Box sx={{
      mx: 'auto',
      width: 70,
      height: 210,
    }}
    >
      {creationStarted ? (
        <BruteRender
          brute={{
            id: '',
            name: '',
            body,
            colors,
            gender,
          }}
        />
      ) : <EmptyBrute style={{ marginTop: '16px' }} />}
    </Box>
  );

  return smallScreen
    ? (
      <HomeMobileView
        changeName={changeName}
        name={name}
        changeAppearance={changeAppearance}
        changeColors={changeColors}
        leftAd={leftAd}
        rightAd={rightAd}
        createBrute={createBrute}
        character={character}
        fixBruteAppearance={fixBruteAppearance}
        setFixBruteAppearance={setFixBruteAppearance}
      />
    )
    : (
      <Page
        title={t('MyBrute')}
        description={t('home.desc')}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
          gap: 2,
        }}>
          {/* CHARACTER CREATION - SHACKERS STYLE */}
          <ShackersCard
            glow
            bordered
            sx={{
              width: 340,
              minHeight: 500,
              background: `linear-gradient(135deg, ${shackersTheme.colors.background.paper} 0%, ${shackersTheme.colors.background.paperLight} 100%)`,
              position: 'relative',
            }}
          >
            {/* SHACKERS LOGO/HEADER */}
            <Box sx={{
              textAlign: 'center',
              mb: 3,
            }}>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.display,
                  fontSize: shackersTheme.typography.fontSize['2xl'],
                  fontWeight: shackersTheme.typography.fontWeight.black,
                  letterSpacing: shackersTheme.typography.letterSpacing.widest,
                  textTransform: 'uppercase',
                  color: shackersTheme.colors.primary.main,
                  textShadow: `0 0 10px ${shackersTheme.colors.primary.main}, 0 0 20px ${shackersTheme.colors.primary.main}`,
                }}
              >
                SHACKERS
              </Text>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.primary,
                  fontSize: shackersTheme.typography.fontSize.sm,
                  color: shackersTheme.colors.text.secondary,
                  letterSpacing: shackersTheme.typography.letterSpacing.wider,
                  textTransform: 'uppercase',
                  mt: 0.5,
                }}
              >
                {t('chooseName')}
              </Text>
            </Box>

            {/* NAME INPUT */}
            <Box sx={{ px: 2, mb: 2 }}>
              <StyledInput
                onChange={changeName}
                value={name}
                sx={{
                  '& input': {
                    fontFamily: shackersTheme.typography.fontFamily.primary,
                    color: shackersTheme.colors.primary.main,
                    textAlign: 'center',
                    fontSize: shackersTheme.typography.fontSize.lg,
                    fontWeight: shackersTheme.typography.fontWeight.bold,
                    letterSpacing: shackersTheme.typography.letterSpacing.wide,
                  }
                }}
              />
              <Tooltip title={fixBruteAppearance ? t('unlockBruteAppearance') : t('lockBruteAppearance')}>
                <IconButton
                  onClick={() => setFixBruteAppearance((prev) => !prev)}
                  size="small"
                  sx={{
                    float: 'right',
                    mt: 1,
                    color: shackersTheme.colors.primary.main,
                    '&:hover': {
                      color: shackersTheme.colors.primary.light,
                      filter: `drop-shadow(0 0 8px ${shackersTheme.colors.primary.main})`,
                    }
                  }}
                >
                  {fixBruteAppearance ? <Lock /> : <LockOpen />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* CHARACTER PREVIEW WITH GLOW */}
            <Box sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              filter: creationStarted
                ? `drop-shadow(0 0 20px ${shackersTheme.colors.primary.main})`
                : 'none',
            }}>
              {character}
            </Box>

            {/* CUSTOMIZATION BUTTONS - SHACKERS STYLE */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mb: 3,
            }}>
              <Tooltip title={t('changeAppearance')}>
                <ShackersButton
                  variant="ghost"
                  onClick={changeAppearance}
                  sx={{ minWidth: 120 }}
                >
                  BODY
                </ShackersButton>
              </Tooltip>
              <Tooltip title={t('changeColors')}>
                <ShackersButton
                  variant="ghost"
                  onClick={changeColors}
                  sx={{ minWidth: 120 }}
                >
                  COLOR
                </ShackersButton>
              </Tooltip>
            </Box>

            {/* VALIDATION BUTTON */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <ShackersButton
                variant="primary"
                glow
                onClick={createBrute}
                fullWidth
                sx={{ maxWidth: 280 }}
              >
                {t('validate')}
              </ShackersButton>
            </Box>

            {/* LOGIN BUTTON */}
            {!(user || authing) && (
              <Box sx={{ textAlign: 'center' }}>
                <ShackersButton
                  variant="secondary"
                  onClick={login}
                  fullWidth
                  sx={{ maxWidth: 280 }}
                >
                  {t('connect')}
                </ShackersButton>
              </Box>
            )}
          </ShackersCard>
          {/* RIGHT SIDE - SHACKERS INFO PANEL */}
          <ShackersCard
            glow
            bordered
            gradient
            sx={{
              flex: 1,
              minHeight: 500,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* WELCOME MESSAGE */}
            <Box>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.display,
                  fontSize: shackersTheme.typography.fontSize.xl,
                  fontWeight: shackersTheme.typography.fontWeight.bold,
                  letterSpacing: shackersTheme.typography.letterSpacing.wide,
                  textTransform: 'uppercase',
                  color: shackersTheme.colors.secondary.main,
                  mb: 2,
                  textShadow: `0 0 10px ${shackersTheme.colors.secondary.main}`,
                }}
              >
                {t('toBeABrute')}
              </Text>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.primary,
                  fontSize: shackersTheme.typography.fontSize.md,
                  color: shackersTheme.colors.text.primary,
                  lineHeight: 1.6,
                }}
              >
                {t('createBrute')}
              </Text>
            </Box>

            {/* FEATURES SECTION */}
            <Box sx={{ my: 3 }}>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.display,
                  fontSize: shackersTheme.typography.fontSize.lg,
                  fontWeight: shackersTheme.typography.fontWeight.bold,
                  letterSpacing: shackersTheme.typography.letterSpacing.wide,
                  textTransform: 'uppercase',
                  color: shackersTheme.colors.primary.main,
                  mb: 2,
                }}
              >
                FEATURES
              </Text>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  '⚔️ Combat System - Pixi v8 + Spine 2D',
                  '🏆 Daily Tournaments',
                  '🎯 Skill Trees & Destinies',
                  '👥 Clans & Clan Wars',
                  '📊 Global Rankings',
                  '🎖️ Achievements System',
                ].map((feature, idx) => (
                  <Text
                    key={idx}
                    sx={{
                      fontFamily: shackersTheme.typography.fontFamily.primary,
                      fontSize: shackersTheme.typography.fontSize.sm,
                      color: shackersTheme.colors.text.secondary,
                      '&:hover': {
                        color: shackersTheme.colors.primary.main,
                        transform: 'translateX(4px)',
                        transition: 'all 0.2s',
                      },
                    }}
                  >
                    {feature}
                  </Text>
                ))}
              </Box>
            </Box>

            {/* OTHER GAMES SECTION */}
            <Box>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.display,
                  fontSize: shackersTheme.typography.fontSize.lg,
                  fontWeight: shackersTheme.typography.fontWeight.bold,
                  letterSpacing: shackersTheme.typography.letterSpacing.wide,
                  textTransform: 'uppercase',
                  color: shackersTheme.colors.secondary.main,
                  mb: 2,
                }}
              >
                {t('orNotToBe')}
              </Text>
              <Text
                sx={{
                  fontFamily: shackersTheme.typography.fontFamily.primary,
                  fontSize: shackersTheme.typography.fontSize.sm,
                  color: shackersTheme.colors.text.secondary,
                  mb: 2,
                }}
              >
                {t('otherGames')}
              </Text>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {[leftAd, rightAd].map((ad) => (
                  <Tooltip title={t(`${ad.name}.desc`)} key={ad.name}>
                    <Link
                      href={ad.url}
                      target="_blank"
                      sx={{
                        display: 'block',
                        border: `2px solid ${shackersTheme.colors.primary.dark}`,
                        borderRadius: shackersTheme.borderRadius.md,
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: shackersTheme.colors.primary.main,
                          boxShadow: shackersTheme.shadows.glow,
                          transform: 'translateY(-4px)',
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={`/images/redirects/${ad.illustration}`}
                        sx={{
                          width: 220,
                          height: 'auto',
                          display: 'block',
                        }}
                      />
                    </Link>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </ShackersCard>
        </Box>
      </Page>
    );
};

export default HomeView;
