import React, { useMemo, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { DEFAULT_RENDERER_CONFIG, getRendererConfig, setRendererConfig } from '../config/renderer';

const numberField = (label: string, value: number, set: (n: number)=>void, step=1) => (
  <TextField
    label={label}
    type="number"
    size="small"
    inputProps={{ step }}
    value={Number.isFinite(value) ? value : ''}
    onChange={(e) => set(Number(e.target.value))}
  />
);

const RendererConfigView: React.FC = () => {
  const initial = useMemo(() => getRendererConfig(), []);
  const [charPx, setCharPx] = useState<number>(initial.charPx);
  const [drift, setDrift] = useState<number>(initial.drift);
  const [contactBias, setContactBias] = useState<number>(initial.contactBias);
  const [returnFactor, setReturnFactor] = useState<number>(initial.returnFactor);

  const save = () => {
    setRendererConfig({ charPx, drift, contactBias, returnFactor });
  };

  const reset = () => {
    const next = setRendererConfig(DEFAULT_RENDERER_CONFIG);
    setCharPx(next.charPx);
    setDrift(next.drift);
    setContactBias(next.contactBias);
    setReturnFactor(next.returnFactor);
  };

  return (
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 2, maxWidth: 560, width: '100%' }}>
        <Typography variant="h6" gutterBottom>Renderer config (local)</Typography>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            {numberField('charPx', charPx, setCharPx)}
            {numberField('drift', drift, setDrift)}
          </Stack>
          <Stack direction="row" spacing={2}>
            {numberField('contactBias', contactBias, setContactBias, 0.1)}
            {numberField('returnFactor', returnFactor, setReturnFactor, 0.1)}
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="primary" onClick={save}>Enregistrer</Button>
            <Button variant="outlined" color="secondary" onClick={reset}>Réinitialiser</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Astuce: ces réglages se stockent dans localStorage et s’appliquent au viewer de combat (Pixi v8).
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RendererConfigView;

