import { Box, Button, Grid, Paper } from '@mui/material';
import { Stage, Sprite } from '@pixi/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Page from '../components/Page';
import Text from '../components/Text';
import { Part, useCharacter } from '../hooks/useCharacter';

const CreatorView = () => {
  const { t } = useTranslation();
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    fetch('/api/parts').then((r) => r.json()).then(setParts).catch(() => {});
  }, []);

  const { parts: grouped, selection, setSelection, randomize, getSeed } = useCharacter(parts);

  return (
    <Page title={t('creator')}>
      <Paper sx={{ p: 1, mb: 1 }}>
        <Text h3 bold upperCase typo="handwritten">{t('characterCreator')}</Text>
      </Paper>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {Object.entries(grouped).map(([type, list]) => (
          <Grid item xs={12} md={4} key={type}>
            <select
              value={selection[type] || ''}
              onChange={(e) => setSelection((s) => ({ ...s, [type]: e.target.value }))}
            >
              {list.map((p) => (
                <option key={p.id} value={p.id}>{`${type} ${p.id}`}</option>
              ))}
            </select>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Button onClick={randomize}>{t('random')}</Button>
        <Button onClick={() => navigator.clipboard.writeText(getSeed())}>{t('copySeed')}</Button>
      </Box>
      <Stage width={200} height={220} options={{ backgroundAlpha: 0 }}>
        {Object.entries(selection).map(([type, id]) => {
          const part = grouped[type]?.find((p) => p.id === id);
          if (!part) return null;
          const frame = require(`../../../../sheets/${type}.json`).frames[`${part.symbol}.png`];
          return (
            <Sprite
              key={type}
              image={`/sheets/${type}.png`}
              sourceRect={frame}
              anchor={[part.pivotX / frame.width, part.pivotY / frame.height]}
            />
          );
        })}
      </Stage>
    </Page>
  );
};

export default CreatorView;
