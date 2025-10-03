/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, no-empty, max-len, react/jsx-no-useless-fragment, react/jsx-indent */
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Slider, Switch } from '@mui/material';
import { Link } from 'react-router-dom';
import Text from '../Text';
import FightComponent from './FightComponent';
import PixiFight from './PixiFight';
import { FightGetResponse } from '@labrute/core';

type Props = { fight: FightGetResponse | null };

const readNum = (k: string, def: number) => {
  const v = Number(localStorage.getItem(k));
  return Number.isFinite(v) ? v : def;
};
const writeNum = (k: string, v: number) => { try { localStorage.setItem(k, String(v)); } catch {} };

const clampDt = (s: any) => Math.max(60, Math.min(260, s?.dt ?? 120));

const CompareFight: React.FC<Props> = ({ fight }) => {
  const fighters = useMemo(() => (fight
    ? JSON.parse(fight.fighters) as any[]
    : undefined), [fight]);

  const brute1 = useMemo(() => fight && fighters && fighters
    .find((fighter) => !fighter.master
      && fighter.id === fight.brute1Id), [fight, fighters]);
  const brute2 = useMemo(() => fight && fighters && fighters
    .find((fighter) => !fighter.master
      && fighter.id === fight.brute2Id), [fight, fighters]);

  const [speed, setSpeed] = useState(() => {
    const s = Number(localStorage.getItem('fightSpeed'));
    if (s === 1 || s === 2) return s;
    return 2; // l'officiel démarre souvent en x2
  });
  // Pixi tunables for quick matching
  const [pixiScale, setPixiScale] = useState(readNum('compare.pixiScale', 0.245));
  const [pixiBoost, setPixiBoost] = useState(readNum('compare.pixiBoost', 1.6));
  const [charPx, setCharPx] = useState(readNum('compare.charPx', 50)); // Changed default from 52 to 50
  // Mode outils avancés (cache/affiche les sliders supplémentaires)
  const [advanced, setAdvanced] = useState(localStorage.getItem('compare.advanced') === '1');
  // Movement tuning
  const [drift, setDrift] = useState(readNum('compare.drift', 40)); // diagonal drift when ΔY small
  const [contactBias, setContactBias] = useState(readNum('compare.contactBias', 5)); // reduce melee distance to allow closer contact
  const [returnFactor, setReturnFactor] = useState(readNum('compare.returnFactor', 2)); // slow down MoveBack
  const [stageX, setStageX] = useState(readNum('compare.stageX', 0));
  const [stageY, setStageY] = useState(readNum('compare.stageY', 0));
  const [leftX, setLeftX] = useState(readNum('compare.leftX', -11));
  const [leftY, setLeftY] = useState(readNum('compare.leftY', 0));
  const [rightX, setRightX] = useState(readNum('compare.rightX', 0));
  const [rightY, setRightY] = useState(readNum('compare.rightY', 0));
  const [clampMin, setClampMin] = useState(readNum('compare.clampMin', 0.58));
  const [clampMax, setClampMax] = useState(readNum('compare.clampMax', 0.98));
  const [approachOffset, setApproachOffset] = useState(readNum('compare.approachOffset', 1));
  const [preferVideo, setPreferVideo] = useState(localStorage.getItem('compare.preferVideo') === '1');
  const [useCustomBg, setUseCustomBg] = useState(localStorage.getItem('compare.useCustomBg') === '1');
  const [customBgIndex, setCustomBgIndex] = useState(readNum('compare.customBgIndex', 1));
  const [bgStretch, setBgStretch] = useState(readNum('compare.bgStretch', 1.15));
  const [bgScale, setBgScale] = useState(readNum('compare.bgScale', 1.0));
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
  const [pixiElapsedByStep, setPixiElapsedByStep] = useState<number[]>([]);

  // Official trace export helpers
  useEffect(() => {
    // Build a CSV from current fight steps using reference dt values
    const buildOfficialCsv = () => {
      const header = 'idx,action,fighter,target,dt,cumulative';
      let sum = 0;
      const rows = steps.map((s: any, i: number) => {
        const a = typeof s?.a === 'number' ? s.a : '';
        const f = typeof s?.f === 'number' ? s.f : '';
        const t = typeof s?.t === 'number' ? s.t : '';
        const dt = clampDt(s);
        sum += dt;
        return `${i+1},${a},${f},${t},${dt},${sum}`;
      });
      return [header, ...rows].join('\n');
    };

    // Expose helpers on window for the toolbar buttons
    try {
      (window as any).offTraceStart = () => {
        try { localStorage.setItem('compare.offTrace', '1'); } catch {}
        try { localStorage.setItem('compare.offTraceAuto', '1'); } catch {}
      };
    } catch {}
    try {
      (window as any).offTraceDownload = () => {
        const csv = buildOfficialCsv();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'official_trace.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    } catch {}
  }, [steps]);

  // Persist sliders
  useEffect(() => { writeNum('compare.pixiScale', pixiScale); }, [pixiScale]);
  useEffect(() => { writeNum('compare.pixiBoost', pixiBoost); }, [pixiBoost]);
  useEffect(() => { writeNum('compare.charPx', charPx); }, [charPx]);
  useEffect(() => { try { localStorage.setItem('compare.advanced', advanced ? '1' : '0'); } catch {} }, [advanced]);
  useEffect(() => { writeNum('compare.drift', drift); }, [drift]);
  useEffect(() => { writeNum('compare.contactBias', contactBias); }, [contactBias]);
  useEffect(() => { writeNum('compare.returnFactor', returnFactor); }, [returnFactor]);
  useEffect(() => { writeNum('compare.stageX', stageX); }, [stageX]);
  useEffect(() => { writeNum('compare.stageY', stageY); }, [stageY]);
  useEffect(() => { writeNum('compare.leftX', leftX); }, [leftX]);
  useEffect(() => { writeNum('compare.leftY', leftY); }, [leftY]);
  useEffect(() => { writeNum('compare.rightX', rightX); }, [rightX]);
  useEffect(() => { writeNum('compare.rightY', rightY); }, [rightY]);
  useEffect(() => { writeNum('compare.clampMin', clampMin); }, [clampMin]);
  useEffect(() => { writeNum('compare.clampMax', clampMax); }, [clampMax]);
  useEffect(() => { writeNum('compare.approachOffset', approachOffset); }, [approachOffset]);
  useEffect(() => { try { localStorage.setItem('compare.preferVideo', preferVideo ? '1' : '0'); } catch {} }, [preferVideo]);
  useEffect(() => { try { localStorage.setItem('compare.useCustomBg', useCustomBg ? '1' : '0'); } catch {} }, [useCustomBg]);
  useEffect(() => { writeNum('compare.customBgIndex', customBgIndex); }, [customBgIndex]);

  // Follow official x1/x2
  useEffect(() => {
    const sync = () => {
      const s = Number(localStorage.getItem('fightSpeed'));
      if (s === 1 || s === 2) setSpeed(s);
    };
    const onStorage = (e: StorageEvent) => { if (e.key === 'fightSpeed') sync(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    sync();
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', sync); };
  }, []);

  const resetAll = () => {
    setPixiScale(0.245); setPixiBoost(1.6); setCharPx(50); // Changed from 52 to 50
    setAdvanced(false);
    setDrift(40); setContactBias(5); setReturnFactor(2);
    setStageX(0); setStageY(0);
    setLeftX(-11); setLeftY(0); setRightX(0); setRightY(0);
    setClampMin(0.58); setClampMax(0.98);
    setApproachOffset(1); setPreferVideo(false); setUseCustomBg(false);
  };

  // Trace/Diag toggles stored in localStorage, consumed by PixiFight
  const [traceOn, setTraceOn] = useState(localStorage.getItem('compare.pixiTrace') === '1');
  const [autoTrace, setAutoTrace] = useState(localStorage.getItem('compare.pixiTraceAuto') === '1');
  const [diagOn, setDiagOn] = useState(localStorage.getItem('compare.pixiDiag') === '1');
  useEffect(() => { try { localStorage.setItem('compare.pixiTrace', traceOn ? '1' : '0'); } catch {} }, [traceOn]);
  useEffect(() => { try { localStorage.setItem('compare.pixiTraceAuto', autoTrace ? '1' : '0'); } catch {} }, [autoTrace]);
  useEffect(() => { try { localStorage.setItem('compare.pixiDiag', diagOn ? '1' : '0'); } catch {} }, [diagOn]);

  const onPixiStep = (index: number, _step: any, elapsedMs: number) => {
    setCurrent({ index, elapsed: elapsedMs });
    setPixiElapsedByStep((prev) => {
      const next = prev.length === steps.length ? [...prev] : Array.from({ length: steps.length }, (_, i) => prev[i] ?? 0);
      next[index] = elapsedMs;
      return next;
    });
  };

  const target = dtCumulative[current.index] ?? 0;
  const delta = Math.round(current.elapsed - target);

  // Metrics: compute RMSE and p95 of absolute deltas (using current pixiElapsedByStep)
  const metrics = useMemo(() => {
    if (!steps.length || pixiElapsedByStep.length !== steps.length) return null as null | { rmse: number, p95: number, mean: number };
    const official = dtCumulative;
    const deltas = pixiElapsedByStep.map((v, i) => (v || 0) - (official[i] || 0));
    const abs = deltas.map((d) => Math.abs(d));
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const rmse = Math.sqrt(deltas.reduce((a, b) => a + b * b, 0) / deltas.length);
    const sortedAbs = [...abs].sort((a, b) => a - b);
    const p95 = sortedAbs[Math.min(sortedAbs.length - 1, Math.floor(sortedAbs.length * 0.95))] || 0;
    return { rmse, p95, mean };
  }, [steps.length, pixiElapsedByStep, dtCumulative]);

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
        <Button size="small" variant="outlined" onClick={resetAll} sx={{ ml: 2 }}>Reset</Button>
        {/* Trace controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Trace</Text>
          <Switch size="small" checked={traceOn} onChange={(_, v) => setTraceOn(v)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Auto</Text>
          <Switch size="small" checked={autoTrace} onChange={(_, v) => setAutoTrace(v)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Diag</Text>
          <Switch size="small" checked={diagOn} onChange={(_, v) => setDiagOn(v)} />
        </Box>
        <Button size="small" variant="outlined" onClick={() => { try { (window as any).pixiTraceStart?.(); } catch {} }} sx={{ ml: 1 }}>Start Trace</Button>
        <Button size="small" variant="outlined" onClick={() => { try { (window as any).pixiTraceDownload?.(); } catch {} }}>Download CSV</Button>
        {/* Official trace */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Official Trace</Text>
          <Switch size="small" checked={localStorage.getItem('compare.offTrace') === '1'} onChange={(_, v) => { try { localStorage.setItem('compare.offTrace', v ? '1' : '0'); } catch {} }} />
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10, ml: 1 }}>Auto</Text>
          <Switch size="small" checked={localStorage.getItem('compare.offTraceAuto') === '1'} onChange={(_, v) => { try { localStorage.setItem('compare.offTraceAuto', v ? '1' : '0'); } catch {} }} />
          <Button size="small" variant="outlined" onClick={() => { try { (window as any).offTraceStart?.(); } catch {} }} sx={{ ml: 1 }}>Start Official Trace</Button>
          <Button size="small" variant="outlined" onClick={() => { try { (window as any).offTraceDownload?.(); } catch {} }}>Download Official CSV</Button>
        </Box>
        {/* Diff export */}
        <Button
          size="small"
          variant="contained"
          color="info"
          onClick={() => {
            try {
              const header = 'idx,official_ms,pixi_ms,delta_ms';
              const rows: string[] = [];
              const len = steps.length;
              for (let i = 0; i < len; i++) {
                const off = dtCumulative[i] || 0;
                const px = pixiElapsedByStep[i] || 0;
                const d = px - off;
                rows.push(`${i+1},${Math.round(off)},${Math.round(px)},${Math.round(d)}`);
              }
              const csv = [header, ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'diff_trace.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch {}
          }}
        >
          Download Diff CSV
        </Button>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>Custom BG</Text>
          <Switch size="small" checked={useCustomBg} onChange={(_, v) => setUseCustomBg(v)} />
          {useCustomBg && (
            <>
              <Button size="small" variant="outlined" onClick={() => setCustomBgIndex(customBgIndex > 1 ? customBgIndex - 1 : 7)} sx={{ minWidth: 30, px: 0.5 }}>←</Button>
              <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>BG{customBgIndex}</Text>
              <Button size="small" variant="outlined" onClick={() => setCustomBgIndex(customBgIndex < 7 ? customBgIndex + 1 : 1)} sx={{ minWidth: 30, px: 0.5 }}>→</Button>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>BG Stretch</Text>
          <Slider size="small" min={1.0} max={1.5} step={0.01} value={bgStretch} onChange={(_, v) => { setBgStretch(v as number); localStorage.setItem('compare.bgStretch', String(v)); }} sx={{ width: 100 }} />
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{bgStretch.toFixed(2)}x</Text>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>BG Scale</Text>
          <Slider size="small" min={0.8} max={1.3} step={0.01} value={bgScale} onChange={(_, v) => { setBgScale(v as number); localStorage.setItem('compare.bgScale', String(v)); }} sx={{ width: 100 }} />
          <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>{bgScale.toFixed(2)}x</Text>
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
          {metrics && (
            <Text color="text.primary" typo="GameFont" upperCase sx={{ fontSize: 10 }}>
              Mean {metrics.mean.toFixed(1)} ms • RMSE {metrics.rmse.toFixed(1)} ms • p95 {metrics.p95.toFixed(0)} ms
            </Text>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', width: '100%' }}>
        <Box sx={{ position: 'relative', flexShrink: 0, width: 400, height: 280, overflow: 'hidden' }}>
          <Text color="text.primary" center typo="GameFont" upperCase sx={{ fontSize: 10, mb: 0.5 }}>Official</Text>
          <FightComponent fight={fight} />
        </Box>
        <Box sx={{ position: 'relative', flexShrink: 0, width: 400 }}>
          <Text color="text.primary" center typo="GameFont" upperCase sx={{ fontSize: 10, mb: 0.5 }}>Pixi</Text>
          <Box sx={{ position: 'relative', width: 400, height: 280, overflow: 'hidden' }}>
            <Box sx={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: 500, height: 350 }}>
              <PixiFight
              fight={fight}
              speed={speed}
              onStep={onPixiStep}
              scale={0.03}
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
              useCustomBg={useCustomBg}
              customBgIndex={customBgIndex}
              bgStretch={bgStretch}
              bgScale={bgScale}
              charPx={49}
              drift={drift}
              contactBias={contactBias}
              returnFactor={returnFactor}
            />
            </Box>
            {brute1 && brute2 && (
              <Box sx={{
                position: 'absolute',
                bottom: 35,
                left: 0,
                right: 0,
                height: 22,
                backgroundColor: '#EDD8A3',
                border: '2px solid #8B4513',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 1,
                boxSizing: 'border-box',
                zIndex: 10
              }}>
                <Link to={`/${brute1.name}/cell`} style={{ textDecoration: 'none' }}>
                  <Text component="span" bold color="secondary" sx={{ fontSize: 13, textShadow: '0 0 1px rgba(0,0,0,0.3)', WebkitFontSmoothing: 'antialiased' }}>{brute1.name}'s cell</Text>
                </Link>
                <Link to={`/${brute2.name}/cell`} style={{ textDecoration: 'none' }}>
                  <Text component="span" bold color="secondary" sx={{ fontSize: 13, textShadow: '0 0 1px rgba(0,0,0,0.3)', WebkitFontSmoothing: 'antialiased' }}>{brute2.name}'s cell</Text>
                </Link>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CompareFight;
