import { FightGetResponse } from '@labrute/core';
import { Box, Button, Link, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import FightComponent from '../components/Arena/FightComponent';
import CompareFight from '../components/Arena/CompareFight';
import PixiFight from '../components/Arena/PixiFight';
import Page from '../components/Page';
import { ShackersCard } from '../components/Shackers';
import Text from '../components/Text';
import { useAlert } from '../hooks/useAlert';
import catchError from '../utils/catchError';
import Server from '../utils/Server';
import FightMobileView from './mobile/FightMobileView';

const FightView = () => {
  const renderParam = new URLSearchParams(window.location.search).get('renderer');
  const { t } = useTranslation();
  const { bruteName, fightId } = useParams();
  const Alert = useAlert();
  const navigate = useNavigate();
  const smallScreen = useMediaQuery('(max-width: 935px)');
  const { palette: { mode } } = useTheme();

  // Fight data
  const [fight, setFight] = useState<FightGetResponse | null>(null);

  // Fetch fight and brutes
  useEffect(() => {
    let isSubscribed = true;
    const cleanup = () => { isSubscribed = false; };

    if (!fightId) {
      navigate('/');
      return cleanup;
    }

    Server.Fight.get(fightId).then((result) => {
      if (isSubscribed) {
        setFight(result);
      }
    }).catch(catchError(Alert));

    return cleanup;
  }, [Alert, fightId, navigate]);

  // On small screens, keep mobile view only when no custom renderer is requested.
  if (smallScreen && !renderParam) {
    return (
      <FightMobileView
        pageTitle={bruteName ? `${bruteName} ${t('fight')}` : t('fight')}
        headerUrl={bruteName ? `/${bruteName}/cell` : '/'}
        fight={fight}
      />
    );
  }

  return fightId ? (
    <Page
      title={bruteName ? `${bruteName} ${t('fight')}` : t('fight')}
      headerUrl={bruteName ? `/${bruteName}/cell` : '/'}
      sx={{ maxWidth: '100vw', overflow: 'hidden' }}
    >
      <ShackersCard
        bordered
        sx={{
          width: '100%',
          minHeight: 600,
          mx: 0,
          p: 1,
        }}
      >
        <Box display="flex" justifyContent="center">
          {/* FIGHT */}
          <Box sx={{ alignSelf: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
              <Button size="small" variant={renderParam ? 'outlined' : 'contained'} onClick={() => navigate(window.location.pathname)}>Official</Button>
              <Button size="small" variant={renderParam === 'pixi' ? 'contained' : 'outlined'} onClick={() => navigate(`${window.location.pathname}?renderer=pixi`)}>Pixi</Button>
              <Button size="small" variant={renderParam === 'compare' ? 'contained' : 'outlined'} onClick={() => navigate(`${window.location.pathname}?renderer=compare`)}>Compare</Button>
            </Box>
            {renderParam === 'compare' ? (
              <CompareFight fight={fight} />
            ) : renderParam === 'pixi' ? (
              <PixiFight fight={fight} />
            ) : (
              <FightComponent fight={fight} />
            )}
          </Box>
        </Box>
      </ShackersCard>
    </Page>
  ) : null;
};

export default FightView;
