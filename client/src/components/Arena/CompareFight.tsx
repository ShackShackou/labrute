/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { Box, Slider, Switch } from '@mui/material';
import Text from '../Text';
import FightComponent from './FightComponent';
import PixiFight from './PixiFight';
import { FightGetResponse } from '@labrute/core';

type Props = { fight: FightGetResponse | null };

const clampDt = (s: any) => Math.max(60, Math.min(260, s?.dt ?? 120));

const CompareFight: React.FC<Props> = ({ fight }) => {
  const [speed, setSpeed] = useState(1);
  // Pixi tunables for quick matching
  const [pixiScale, setPixiScale] = useState(0.22);
  const [pixiBoost, setPixiBoost] = useState(1.6);
  const [charPx, setCharPx] = useState(50);
  // Mode outils avancés (cache/affiche les sliders supplémentaires)
  const [advanced, setAdvanced] = useState(false);
  // Movement tuning
  const [drift, setDrift] = useState(20); // diagonal drift when ΔY small
  const [contactBias, setContactBias] = useState(8); // reduce melee distance to allow closer contact
  const [returnFactor, setReturnFactor] = useState(1.25); // slow down MoveBack
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [leftX, setLeftX] = useState(0);
  const [leftY, setLeftY] = useState(0);
  const [rightX, setRightX] = useState(0);
  const [rightY, setRightY] = useState(0);
  const [clampMin, setClampMin] = useState(0.62);
  const [clampMax, setClampMax] = useState(0.88);
  const [approachOffset, setApproachOffset] = useState(0);
  const [preferVideo, setPreferVideo] = useState(false);
  const steps = useMemo(() => {
    if (!fight) return [] as any[];
    try { return Array.isArray(fight.steps) ? (fight.steps as any[]) : JSON.parse(String(fight.steps)); } catch { return []; }
  }, [fight]);
  const dtCumulative = useMemo(() => {
    const acc: number[] = [];
    let sum = 0;
    for (let i = 0; i < steps.length; i++) { sum += clampDt(steps[i]); acc.push(sum); }
    return acc; // ms
  }, [steps]);

  const [current, setCurrent] = useState({ index: 0, elapsed: 0 });

  const onPixiStep = (index: number, _step: any, elapsedMs: number) => {
    setCurrent({ index, elapsed: elapsedMs });
  };

  const target = dtCumulative[current.index] ?? 0;
  const delta = Math.round(current.elapsed - target);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Speed</Text>
        <Slider size="small" min={0.25} max={2} step={0.05} value={speed} onChangeCommitted={(_, v) => setSpeed(v as number)} sx={{ width: 200 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{speed.toFixed(2)}x</Text>
        {/* Pixi tuning */}
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Pixi Scale</Text>
        <Slider size="small" min={0.15} max={0.35} step={0.005} value={pixiScale} onChangeCommitted={(_, v) => setPixiScale(v as number)} sx={{ width: 140 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{pixiScale.toFixed(3)}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Pixi Boost</Text>
        <Slider size="small" min={1.0} max={3.0} step={0.05} value={pixiBoost} onChangeCommitted={(_, v) => setPixiBoost(v as number)} sx={{ width: 140 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{pixiBoost.toFixed(2)}x</Text>
        {/* Basique: identique à l'ancienne version */}
        {!advanced && (
          <>
            {/* rien de plus, on garde seulement Speed / PixiScale / PixiBoost */}
          </>
        )}
        {/* Outils avancés */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Tools</Text>
          <Switch size="small" checked={advanced} onChange={(_, v) => setAdvanced(v)} />
        </Box>
        {advanced && (
        <>
        {/* Layout sliders */}
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Stage X</Text>
        <Slider size="small" min={-80} max={80} step={1} value={stageX} onChange={(_, v) => setStageX(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{stageX}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Stage Y</Text>
        <Slider size="small" min={-80} max={80} step={1} value={stageY} onChange={(_, v) => setStageY(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{stageY}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Left X</Text>
        <Slider size="small" min={-60} max={60} step={1} value={leftX} onChangeCommitted={(_, v) => setLeftX(v as number)} sx={{ width: 110 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{leftX}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Left Y</Text>
        <Slider size="small" min={-60} max={60} step={1} value={leftY} onChangeCommitted={(_, v) => setLeftY(v as number)} sx={{ width: 110 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{leftY}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Right X</Text>
        <Slider size="small" min={-60} max={60} step={1} value={rightX} onChangeCommitted={(_, v) => setRightX(v as number)} sx={{ width: 110 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{rightX}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Right Y</Text>
        <Slider size="small" min={-60} max={60} step={1} value={rightY} onChangeCommitted={(_, v) => setRightY(v as number)} sx={{ width: 110 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{rightY}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Clamp Min</Text>
        <Slider size="small" min={0.50} max={0.95} step={0.01} value={clampMin} onChangeCommitted={(_, v) => setClampMin(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{clampMin.toFixed(2)}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Clamp Max</Text>
        <Slider size="small" min={0.55} max={0.98} step={0.01} value={clampMax} onChangeCommitted={(_, v) => setClampMax(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{clampMax.toFixed(2)}</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Approach Offset</Text>
        <Slider size="small" min={0} max={60} step={1} value={approachOffset} onChangeCommitted={(_, v) => setApproachOffset(v as number)} sx={{ width: 140 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{approachOffset}</Text>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Prefer Video BG</Text>
          <Switch size="small" checked={preferVideo} onChange={(_, v) => setPreferVideo(v)} />
        </Box>
        {/* Movement tuning */}
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Diag Drift</Text>
        <Slider size="small" min={0} max={40} step={1} value={drift} onChange={(_, v) => setDrift(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{drift}px</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Contact Bias</Text>
        <Slider size="small" min={0} max={20} step={1} value={contactBias} onChange={(_, v) => setContactBias(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{contactBias}px</Text>
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 2 }}>Return Factor</Text>
        <Slider size="small" min={0.8} max={2.0} step={0.05} value={returnFactor} onChange={(_, v) => setReturnFactor(v as number)} sx={{ width: 120 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{returnFactor.toFixed(2)}x</Text>
        {/* Character size (match Official) */}
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 3 }}>Char Size</Text>
        <Slider size="small" min={40} max={160} step={1} value={charPx} onChange={(_, v) => setCharPx(v as number)} sx={{ width: 160 }} />
        <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{charPx}px</Text>
        </>
        )}
        <Box sx={{ ml: 4 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Step {current.index + 1}/{steps.length}</Text>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Pixi {Math.round(current.elapsed)} ms • Ref(dt) {Math.round(target)} ms • Δ {delta} ms</Text>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
        <Box sx={{ width: 500, height: 300, position: 'relative', flexShrink: 0 }}>
          <Text color="text.primary" center typo="GameFont" upperCase sx={{ fontSize: 10, mb: 0.5 }}>Official</Text>
          <FightComponent fight={fight} />
        </Box>
        <Box sx={{ width: 500, height: 300, position: 'relative', flexShrink: 0 }}>
          <Text color="text.primary" center typo="GameFont" upperCase sx={{ fontSize: 10, mb: 0.5 }}>Pixi</Text>
          <PixiFight
            fight={fight}
            speed={speed}
            onStep={onPixiStep}
            scale={pixiScale}
            speedBoost={pixiBoost}
            stageOffsetX={stageX}
            stageOffsetY={stageY}
            clampYMinRatio={clampMin}
            clampYMaxRatio={clampMax}
            leftOffsetX={leftX}
            leftOffsetY={leftY}
            rightOffsetX={rightX}
            rightOffsetY={rightY}
            approachOffset={approachOffset}
            preferVideoBackground={preferVideo}
            charPx={charPx}
            drift={drift}
            contactBias={contactBias}
            returnFactor={returnFactor}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CompareFight;



