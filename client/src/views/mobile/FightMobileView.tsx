import { Fighter, FightGetResponse } from '@labrute/core';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import FightComponent from '../../components/Arena/FightComponent';
import Page from '../../components/Page';
import Text from '../../components/Text';
import BruteTooltip from '../../components/Brute/BruteTooltip';

export interface FightMobileViewProps {
  pageTitle?: string;
  headerUrl?: string;
  fight: FightGetResponse | null;
  attackers?: Fighter[];
  defenders?: Fighter[];
}

const FightMobileView = ({
  pageTitle,
  headerUrl,
  fight,
  attackers = [],
  defenders = [],
}: FightMobileViewProps) => {
  const { t } = useTranslation();

  return (
    <Page
      title={`${pageTitle ?? ''} ${t('MyBrute')}`}
      headerUrl={headerUrl}
    >
      <Paper sx={{ textAlign: 'center' }}>
        {/* FIGHT */}
        <FightComponent fight={fight} />

        {/* FIGHTERS */}
        {fight?.clanWarId && (
          <Box sx={{
            maxWidth: 500,
            mt: 2,
          }}
          >
            <Table sx={{
              maxWidth: 500,
              '& th': {
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                py: 0.5,
                px: 1,
                fontWeight: 'bold',
                border: '1px solid',
                borderColor: 'background.default',
              },
              '& td': {
                py: 0.5,
                px: 1,
                border: '1px solid',
                borderColor: 'background.default',
              },
            }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>{t('attackers')}</TableCell>
                  <TableCell align="right">{t('defenders')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({
                  length: Math.max(attackers.length, defenders.length)
                }).map((_, i) => (
                  <TableRow key={attackers[i]?.name || defenders[i]?.name}>
                    <TableCell>
                      {attackers[i] && (
                        <BruteTooltip fighter={attackers[i]}>
                          <Text bold color="secondary">{attackers[i]?.name}</Text>
                        </BruteTooltip>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {defenders[i] && (
                        <BruteTooltip fighter={defenders[i]}>
                          <Text bold color="secondary">{defenders[i]?.name}</Text>
                        </BruteTooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Page>
  );
};

export default FightMobileView;
