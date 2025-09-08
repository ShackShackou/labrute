/* eslint-disable unicode-bom, quotes, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-len, lines-between-class-members, one-var, one-var-declaration-per-line, no-empty, comma-spacing, space-infix-ops, key-spacing, arrow-spacing, arrow-parens, object-curly-spacing, block-spacing, space-before-function-paren, default-case, no-promise-executor-return, @typescript-eslint/no-floating-promises */
import React, { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text, Assets, Sprite } from 'pixi.js';
// @ts-ignore - official Spine v8 runtime for Pixi v8
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { FightGetResponse, WeaponById, WeaponId, weapons, StepType, WeaponType, SkillId } from '@labrute/core';

type Props = {
  fight: FightGetResponse | null,
  speed?: number,
  onStep?: (index:number, step:any, elapsedMs:number)=>void,
  // Tunables
  scale?: number,
  speedBoost?: number,
  stageOffsetX?: number,
  stageOffsetY?: number,
  clampYMinRatio?: number,
  clampYMaxRatio?: number,
  leftOffsetX?: number,
  leftOffsetY?: number,
  rightOffsetX?: number,
  rightOffsetY?: number,
  approachOffset?: number,
  preferVideoBackground?: boolean,
  charPx?: number,
  drift?: number,
  contactBias?: number,
  returnFactor?: number,
};

const W = 500; const H = 300;

const PixiFight: React.FC<Props> = ({
  fight,
  speed = 1,
  onStep,
  scale,
  speedBoost,
  stageOffsetX = 0,
  stageOffsetY = 0,
  clampYMinRatio = 175/300,
  clampYMaxRatio = 281/300,
  leftOffsetX = 0,
  leftOffsetY = 0,
  rightOffsetX = 0,
  rightOffsetY = 0,
  approachOffset = 0,
  preferVideoBackground = false,
  charPx,
  drift,
  contactBias,
  returnFactor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const spinesRef = useRef<{ L: any | null, R: any | null, scene: Container | null }>({ L: null, R: null, scene: null });
  const charPxRef = useRef<number | null>(null);
  const debugLayerRef = useRef<Container | null>(null);
  const traceOnRef = useRef<boolean>(false);
  const traceRowsRef = useRef<{ t:number, who:'L'|'R', rootX:number, rootY:number, anim:string, trackTime:number }[]>([]);
  const traceT0Ref = useRef<number | null>(null);
  const debugVectorsRef = useRef<{ g: Graphics, life: number }[]>([]);

  useEffect(() => {
    if (!containerRef.current || !fight) return undefined;

    if (appRef.current) { try { (appRef.current as any).ticker?.stop?.(); } catch {} try { appRef.current.destroy(true); } catch {} appRef.current = null; }

    const app = new Application();
    appRef.current = app;
    let disposed = false;
    const ticks = new Set<(tk:any)=>void>();
    const timeouts = new Set<number>();
    const addTick = (fn:(tk:any)=>void) => { ticks.add(fn); app.ticker.add(fn); };
    const removeAllTicks = () => { ticks.forEach((fn)=>{ try{ app.ticker.remove(fn); } catch{} }); ticks.clear(); };
    const clearAllTimeouts = () => { timeouts.forEach((id)=>{ try{ clearTimeout(id); } catch{} }); timeouts.clear(); };

    const mediaSprites: Sprite[] = [];
    const run = async () => {
      await app.init({ width: W, height: H, background: '#202428', antialias: true });
      if (disposed) return;
      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);
      // Align global timing with official renderer
      try { (app.ticker as any).speed = 0.5; } catch {}

      // Enable zIndex sorting so overlay stays on top
      // @ts-ignore
      (app.stage as any).sortableChildren = true;

      // Fixed UI overlay for non-scene elements (e.g., HP bars)
      const ui = new Container();
      // @ts-ignore
      (ui as any).zIndex = 999;
      app.stage.addChild(ui);
      // Debug layer (optional)
      const debugLayer = new Container();
      // @ts-ignore
      (debugLayer as any).zIndex = 998;
      app.stage.addChild(debugLayer);
      debugLayerRef.current = debugLayer;

      const scene = new Container();
      // Depth sort by Y
      // @ts-ignore
      (scene as any).sortableChildren = true;
      scene.position.set(stageOffsetX, stageOffsetY);
      app.stage.addChild(scene);
      spinesRef.current.scene = scene;

      // Resolve tunables and helpers
      const params = new URLSearchParams(window.location.search);
      const SCALE = Number(params.get('pixiScale') ?? (scale ?? 0.22));
      const BOOST = Number(params.get('pixiBoost') ?? (speedBoost ?? 1));
      const scaleFallback = isNaN(SCALE) ? 0.22 : SCALE;
      const boostFallback = isNaN(BOOST) ? 1 : BOOST;
      const clampMin = Number(params.get('pixiClampMin') ?? `${clampYMinRatio}`);
      const clampMax = Number(params.get('pixiClampMax') ?? `${clampYMaxRatio}`);
      const clampY = (y:number) => Math.max(H * clampMin, Math.min(H * clampMax, y));
      const preferVideo = (params.get('bgVideo') === '1' || params.get('bgVideo') === 'true') || !!preferVideoBackground;
      const debugDiag = (params.get('pixiDiag') === '1' || localStorage.getItem('compare.pixiDiag') === '1');
      const traceEnabled = (params.get('pixiTrace') === '1' || localStorage.getItem('compare.pixiTrace') === '1');
      // Calibration multipliers per side (R often needs to be slowed down)
      const mulL = (() => { const u = params.get('pixiMulL'); const ls = localStorage.getItem('compare.pixiMulL'); const n = Number(u ?? ls ?? '1'); return isNaN(n) ? 1 : n; })();
      const mulR = (() => { const u = params.get('pixiMulR'); const ls = localStorage.getItem('compare.pixiMulR'); const n = Number(u ?? ls ?? '1.66'); return isNaN(n) ? 1.66 : n; })();
      const addVector = (x1:number,y1:number,x2:number,y2:number,color=0x00ff88) => {
        if (!debugDiag) return;
        try {
          const g = new Graphics();
          g.lineStyle(2, color, 0.9).moveTo(x1,y1).lineTo(x2,y2);
          const ang = Math.atan2(y2-y1, x2-x1);
          const ah = 6;
          g.lineTo(x2 - Math.cos(ang-0.3)*ah, y2 - Math.sin(ang-0.3)*ah);
          g.moveTo(x2,y2);
          g.lineTo(x2 - Math.cos(ang+0.3)*ah, y2 - Math.sin(ang+0.3)*ah);
          debugLayerRef.current?.addChild(g);
          debugVectorsRef.current.push({ g, life: 2000 });
        } catch {}
      };

      // Tick-managed vector cleanup to avoid destroying during render build
      const vectorTick = (tk:any) => {
        if (!debugDiag) return; // no-op if disabled
        try {
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          for (let i = debugVectorsRef.current.length - 1; i >= 0; i--) {
            const v = debugVectorsRef.current[i]!;
            v.life -= dm;
            if (v.life <= 0) {
              try { v.g.renderable = false; v.g.alpha = 0; } catch {}
              try { debugLayerRef.current?.removeChild(v.g); } catch {}
              try { v.g.destroy(true); } catch {}
              debugVectorsRef.current.splice(i, 1);
            }
          }
        } catch {}
      };
      addTick(vectorTick);

      // Background from /backgrounds (synced from repo root \backgrounds)
      try {
        const loadVideoSprite = async (baseName: string): Promise<Sprite|null> => {
          const vids = ['.webm', '.mp4'];
          for (const ext of vids) {
            try {
              const video = document.createElement('video');
              video.src = `/backgrounds/${baseName}${ext}`;
              video.crossOrigin = 'anonymous';
              video.loop = true; video.muted = true; (video as any).playsInline = true; (video as any).autoplay = true;
              const ready = await new Promise<boolean>((resolve) => {
                const timer = window.setTimeout(() => resolve(false), 800);
                const onReady = () => { try { video.removeEventListener('canplay', onReady); } catch {} try { clearTimeout(timer); } catch {} resolve(true); };
                const onError = (ev: Event) => {
                  try { (ev as any).stopImmediatePropagation?.(); } catch {}
                  try { (ev as any).stopPropagation?.(); } catch {}
                  try { (ev as any).preventDefault?.(); } catch {}
                  try { video.removeEventListener('error', onError as any); } catch {}
                  try { clearTimeout(timer); } catch {}
                  resolve(false);
                };
                video.addEventListener('canplay', onReady, { once: true });
                video.addEventListener('error', onError as any, { once: true });
              });
              if (!ready) continue;
              try { await video.play().catch(() => {}); } catch {}
              const spr = Sprite.from(video as any);
              return spr;
            } catch {}
          }
          return null;
        };
        // Background override via URL: ?bg=filename (with or without extension)
        const exts = ['.png', '.jpg', '.jpeg', '.webp'];
        let loaded: any = null;
        const bgParam = params.get('bg');
        if (bgParam) {
          if (preferVideo) {
            const baseP0 = bgParam.includes('.') ? bgParam.replace(/\.[^/.]+$/, '') : bgParam;
            const spr0 = await loadVideoSprite(baseP0);
            if (spr0) { loaded = spr0; }
          }
          if (!loaded && bgParam.includes('.')) {
            try { loaded = await Assets.load(`/backgrounds/${encodeURIComponent(bgParam)}`); } catch {}
          }
          if (!loaded) {
            const baseP = bgParam.replace(/\.[^/.]+$/, '');
            for (const ext of exts) { try { loaded = await Assets.load(`/backgrounds/${encodeURIComponent(baseP)}${ext}`); break; } catch {} }
          }
          if (!loaded) {
            // Fallback to official resources folder (numbered backgrounds)
            const baseP = bgParam.replace(/\.[^/.]+$/, '');
            const candidates = [baseP, `${parseInt(baseP, 10) || ''}`, '1'];
            for (const c of candidates) {
              if (!c) continue;
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.jpg`); break; } catch {}
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.png`); break; } catch {}
            }
          }
        } else {
          const base = String((fight as any).background ?? '').replace(/\.[^/.]+$/, '');
          if (preferVideo && !loaded && base) {
            const spr1 = await loadVideoSprite(base);
            if (spr1) { loaded = spr1; }
          }
          // Avoid loading heavy animated GIF backgrounds by default for performance
          if (!loaded && base) { for (const ext of exts) { try { loaded = await Assets.load(`/backgrounds/${base}${ext}`); break; } catch {} } }
          if (!loaded) {
            const candidates = [base, `${parseInt(base, 10) || ''}`, '1'];
            for (const c of candidates) {
              if (!c) continue;
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.jpg`); break; } catch {}
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.png`); break; } catch {}
            }
          }
        }
        if (loaded) {
          if (loaded instanceof Sprite) {
            const spr = loaded as Sprite; spr.zIndex = -10; spr.width = W; spr.height = H; scene.addChildAt(spr, 0);
            try {
              const src = (spr.texture as any)?.baseTexture?.resource?.source as HTMLVideoElement | undefined;
              if (src && typeof src.pause === 'function') { mediaSprites.push(spr); }
            } catch {}
          } else {
            const bg = new Sprite(loaded as any);
            bg.zIndex = -10; bg.width = W; bg.height = H;
            scene.addChildAt(bg, 0);
          }
        }
      } catch {}

      const baseLX = (W * 0.25) + leftOffsetX; const baseLY = (H * 0.75) + leftOffsetY;
      const baseRX = (W * 0.75) + rightOffsetX; const baseRY = (H * 0.75) + rightOffsetY;
      // Placeholders (not visible) to avoid debug circles
      const leftPlaceholder = new Container(); leftPlaceholder.position.set(baseLX, baseLY); (leftPlaceholder as any).visible = false; scene.addChild(leftPlaceholder);
      const rightPlaceholder = new Container(); rightPlaceholder.position.set(baseRX, baseRY); (rightPlaceholder as any).visible = false; scene.addChild(rightPlaceholder);
      let left: any = { node: leftPlaceholder, baseX: baseLX, baseY: baseLY, type: 'placeholder' };
      let right: any = { node: rightPlaceholder, baseX: baseRX, baseY: baseRY, type: 'placeholder' };
      const addShadow = (obj:any) => {
        const sh = new Graphics();
        sh.beginFill(0x000000, 0.25).drawEllipse(0, 0, 26, 10).endFill();
        scene.addChild(sh);
        return {
          follow: () => {
            const p = 'position' in obj.node ? obj.node.position : obj.node;
            sh.position.set(p.x, p.y + 2);
            // Sort by Y (shadows below character)
            // @ts-ignore
            sh.zIndex = (p.y as number) - 1;
          },
          destroy: () => sh.destroy(),
        };
      };
      let shadowL = addShadow(left);
      let shadowR = addShadow(right);

      try {
        // Spine v8 (4.2) assets: mono-page atlas
        Assets.add({ alias: 'spineboyData', src: '/assets/spine/spineboy-pro.json' });
        Assets.add({ alias: 'spineboyAtlas', src: '/assets/spine/spineboy.atlas' });
        await Assets.load(['spineboyData', 'spineboyAtlas']);
        // Crée sans échelle, puis calibre sur une largeur cible (pour matcher l'officiel)
        const L = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 1 });
        L.x = baseLX; L.y = baseLY; scene.addChild(L);
        const R = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 1 });
        R.x = baseRX; R.y = baseRY; scene.addChild(R);
        const targetCharPxRaw = Number(params.get('charPx') ?? `${typeof charPx === 'number' ? charPx : 50}`);
        const TARGET_W = isNaN(targetCharPxRaw) ? 50 : targetCharPxRaw;
        const applyScale = (sp: any, side: 'L'|'R') => {
          try {
            const bw = Math.max(1, sp?.bounds?.width ?? 200);
            const s = (TARGET_W / bw);
            sp.scale.set(s, s);
            if (side === 'R') sp.scale.x = -Math.abs(sp.scale.x);
          } catch {
            sp.scale.set(0.18, 0.18);
            if (side === 'R') sp.scale.x = -Math.abs(sp.scale.x);
          }
        };
        applyScale(L, 'L');
        applyScale(R, 'R');
        spinesRef.current.L = L; spinesRef.current.R = R; charPxRef.current = TARGET_W;
        try { L.state.setAnimation(0, 'idle', true); } catch {}
        try { R.state.setAnimation(0, 'idle', true); } catch {}
        // Instrumentation: tracing root motion (optional)
        if (traceEnabled) {
          try { (L as any).autoUpdate = false; } catch {}
          try { (R as any).autoUpdate = false; } catch {}
          const sL = (L as any).state || (L as any).animationState; if (sL) { try { sL.timeScale = 1; } catch {} }
          const sR = (R as any).state || (R as any).animationState; if (sR) { try { sR.timeScale = 1; } catch {} }
          traceOnRef.current = false; traceT0Ref.current = null; traceRowsRef.current = [];
          // expose helpers
          // @ts-ignore
          (window as any).pixiTraceStart = () => { traceOnRef.current = true; traceT0Ref.current = performance.now() / 1000; };
          // @ts-ignore
          (window as any).pixiTraceDownload = () => {
            const header = 't,who,rootX,rootY,anim,trackTime\n';
            const body = traceRowsRef.current.map((r: any) => `${r.t.toFixed(4)},${r.who},${r.rootX.toFixed(2)},${r.rootY.toFixed(2)},${r.anim},${r.trackTime.toFixed(3)}`).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }));
            a.download = 'trace.csv'; a.click();
          };
          const tickTrace = (tk:any) => {
            try {
              const dt = (typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7) / 1000;
              sL?.update?.(dt); (L as any)?.update?.(dt);
              sR?.update?.(dt); (R as any)?.update?.(dt);
              if (!traceOnRef.current || !traceT0Ref.current) return;
              const t = performance.now() / 1000 - (traceT0Ref.current || 0);
              const curL = sL?.getCurrent?.(0); const curR = sR?.getCurrent?.(0);
              const pLx = (L as any)?.worldTransform?.tx ?? (L as any)?.x ?? 0;
              const pLy = (L as any)?.worldTransform?.ty ?? (L as any)?.y ?? 0;
              const pRx = (R as any)?.worldTransform?.tx ?? (R as any)?.x ?? 0;
              const pRy = (R as any)?.worldTransform?.ty ?? (R as any)?.y ?? 0;
              traceRowsRef.current.push({ t, who:'L', rootX: pLx, rootY: pLy, anim: curL?.animation?.name || '', trackTime: curL?.trackTime || 0 });
              traceRowsRef.current.push({ t, who:'R', rootX: pRx, rootY: pRy, anim: curR?.animation?.name || '', trackTime: curR?.trackTime || 0 });
            } catch {}
          };
          addTick(tickTrace);
        }
        const scaledWidth = (sp:any)=>{
          try { return Math.max(30, ((sp as any).bounds?.width ?? 40) * Math.max(Math.abs((sp as any).scale?.x ?? 1), 0.001)); } catch { return 40; }
        };
        left = { node: L, baseX: L.x, baseY: L.y, type: 'spine', width: scaledWidth(L) };
        right = { node: R, baseX: R.x, baseY: R.y, type: 'spine', width: scaledWidth(R) };
        shadowL?.destroy(); shadowR?.destroy();
        shadowL = addShadow(left);
        shadowR = addShadow(right);
      } catch {
        // keep circles fallback if assets/runtimes unavailable
      }

      const mkHud = (side:'L'|'R', name:string|undefined) => {
        const barW = 180, barH=10; const isL = side==='L';
        const anchorX = isL ? (W * 0.26) : (W * 0.74);
        const y0 = 10;
        // Name
        const nameText = new Text(String(name ?? ''), {
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          fontSize: 18,
        } as any);
        nameText.anchor.set(isL ? 0 : 1, 0);
        nameText.position.set(anchorX + (isL ? -barW/2 : barW/2), y0);
        // Bar
        const cont = new Container();
        const bg = new Graphics();
        const border = new Graphics();
        const fg = new Graphics();
        bg.beginFill(0x3a2a1a).drawRoundedRect(0, 0, barW, barH, 3).endFill();
        border.lineStyle(1, 0x000000, 0.9).drawRoundedRect(0, 0, barW, barH, 3);
        fg.beginFill(0xf1a81b).drawRoundedRect(0, 0, barW, barH, 3).endFill();
        cont.addChild(bg, fg, border);
        cont.position.set(anchorX - barW/2, y0 + 22);
        ui.addChild(nameText);
        ui.addChild(cont);
        const set = (ratio:number) => {
          const r = Math.max(0, Math.min(1, ratio));
          const w = Math.max(0, barW * r);
          const col = r < 0.3 ? 0xd64545 : 0xf1a81b;
          fg.clear(); fg.beginFill(col).drawRoundedRect(0, 0, w, barH, 3).endFill();
          fg.x = isL ? 0 : (barW - w);
        };
        const follow = () => {};
        return { set, follow, nameText };
      };

      const parseArr = (x: any) => { try { return Array.isArray(x) ? x : JSON.parse(x); } catch { return []; } };
      const steps: any[] = parseArr(fight.steps);
      const fighters: any[] = parseArr(fight.fighters);

      const byIndex = new Map<number, any>();
      for (const f of fighters) { if (typeof f?.index === 'number') byIndex.set(f.index, f); }
      // Track last known weapon by actor (from Hit steps)
      const lastWeaponByActor = new Map<number, string>();
      const leftMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute1Id);
      const rightMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute2Id);
      const leftMainIdx = leftMain?.index ?? 1;
      const rightMainIdx = rightMain?.index ?? 2;
      const maxL = leftMain?.maxHp ?? leftMain?.hp ?? 100;
      const maxR = rightMain?.maxHp ?? rightMain?.hp ?? 100;
      let hpL = maxL, hpR = maxR;
      const hudL = mkHud('L', leftMain?.name); const hudR = mkHud('R', rightMain?.name);
      const barL = { set: hudL.set, follow: hudL.follow }; const barR = { set: hudR.set, follow: hudR.follow };
      barL.set(1); barR.set(1);

      // Small helpers
      const playAnim = (obj:any, name:string, loop=true) => {
        if (obj?.type === 'spine') {
          // For spineboy, we only use 'idle' and 'death' for now
          const mapped = name === 'death' ? 'death' : 'idle';
          try { (obj.node as any).state.setAnimation(0, mapped, mapped === 'idle'); } catch {}
        }
      };
      // Small pooled float text to reduce allocations
      const textPool: Text[] = [];
      const getText = () => {
        const t = textPool.pop();
        if (t) return t;
        const nt = new Text('', { fill: 0xffffff as any, fontSize: 12 } as any);
        nt.anchor.set(0.5);
        return nt;
      };
      const recycleText = (t: Text) => { try { t.visible = false; t.alpha = 1; } catch {} textPool.push(t); };
      const floatText = (x:number, y:number, txt:string, color=0xffffff) => {
        const t = getText();
        t.text = txt; (t.style as any).fill = color; t.position.set(x, y - 60); t.visible = true;
        scene.addChild(t);
        let a = 0;
        const duration = 650 / Math.max(0.001, speed);
        const tick = (tk:any) => {
          if (disposed) { try { app.ticker.remove(tick); } catch {} try { scene.removeChild(t); } catch {} recycleText(t); return; }
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          a += dm; const p = Math.min(1, a / duration);
          t.alpha = Math.max(0, 1 - p);
          t.y = (y - 60) - 20 * p;
          if (p >= 1) { app.ticker.remove(tick); scene.removeChild(t); recycleText(t); }
        };
        addTick(tick);
      };
      const shake = (mag=2, dur=120) => new Promise<void>((resolve) => {
        const baseX = scene.x; const baseY = scene.y; let t=0;
        const tick = (tk:any) => {
          if (disposed) { try { app.ticker.remove(tick); } catch {} scene.x=baseX; scene.y=baseY; resolve(); return; }
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
          const p = Math.min(1, t / dur);
          scene.x = baseX + (Math.random()*2-1) * mag * (1-p);
          scene.y = baseY + (Math.random()*2-1) * mag * (1-p);
          if (p>=1){ app.ticker.remove(tick); scene.x=baseX; scene.y=baseY; resolve(); }
        };
        addTick(tick);
      });

      const getPos = (o:any) => ({ x: (o?.position?.x ?? o?.x) as number, y: clampY((o?.position?.y ?? o?.y) as number) });
      const setPos = (o:any, x:number, y:number) => { if ('position' in o) { o.position.set(x,y); } else { o.x = x; o.y = y; } };

      // Duration from distance constants close to legacy v6 renderer
      const durationMoveMs = (px:number) => Math.max(160, (px / 430) * 1000);
      const durationMoveBackMs = (px:number) => Math.max(150, (px / 480) * 1000);

      const minY = 175, maxY = 281;
      const minLX = 40, maxLX = 125, minRX = W - maxLX, maxRX = W - minLX;
      const occY: Record<'L'|'R', number[]> = { L: [], R: [] };
      const chooseLaneY = (side:'L'|'R') => {
        const comfort = 15;
        const ys = [...occY[side]].filter((y)=> y >= minY && y <= maxY).sort((a,b)=>a-b);
        const positions = [minY, ...ys, maxY];
        let largestGap = 0; let largest:{start:number,end:number}|null=null;
        const comfortable: {start:number,end:number}[] = [];
        for (let i=1;i<positions.length;i++){
          const gap = positions[i]! - positions[i-1]!;
          const segment = { start: positions[i-1]!, end: positions[i]! };
          if (gap > comfort*2) comfortable.push(segment);
          if (gap > largestGap){ largestGap = gap; largest = segment; }
        }
        let pick: {start:number,end:number};
        if (comfortable.length > 0) {
          pick = comfortable[Math.floor(Math.random()*comfortable.length)]!;
        } else if (largest) {
          pick = largest;
        } else {
          pick = { start: minY, end: maxY };
        }
        const space = pick.end - pick.start - comfort*2;
        let y: number;
        if (space <= 0) y = (pick.start + pick.end)/2; else {
          y = pick.start + comfort + space*0.15 + Math.random()*(space*0.8);
        }
        if (y <= minY + comfort && pick.start === minY) y = minY + 1;
        if (y >= maxY - comfort && pick.end === maxY) y = maxY - 1;
        return clampY(y);
      };
      const getRandomBaseForSide = (side:'L'|'R', currX?: number, actor?: any) => {
        const y = chooseLaneY(side);
        const minX = side === 'L' ? minLX : minRX;
        const maxX = side === 'L' ? maxLX : maxRX;
        // Official-like X factor with weapon/skills influence
        let factor = 0.4 + Math.random() * 0.6;
        try {
          let wname: string | undefined;
          try { if (actor && typeof actor.index === 'number') wname = lastWeaponByActor.get(actor.index); } catch {}
          const wobj = weapons.find((w) => w.name === wname);
          if (wobj) {
            if (wobj.types?.includes(WeaponType.LONG)) factor -= 0.25;
            if (wobj.types?.includes(WeaponType.THROWN)) factor -= 0.5;
            if (wobj.types?.includes(WeaponType.HEAVY) && Array.isArray(actor?.skills) && (actor.skills as number[]).includes(SkillId.bodybuilder)) factor += 0.15;
            if (wobj.types?.includes(WeaponType.SHARP) && Array.isArray(actor?.skills) && (actor.skills as number[]).includes(SkillId.weaponsMaster)) factor += 0.15;
          } else if (Array.isArray(actor?.skills) && (actor.skills as number[]).includes(SkillId.martialArts)) {
            factor += 0.25;
          }
          const mods: Partial<Record<number, number>> = {
            [SkillId.hideaway]: -0.25,
            [SkillId.monk]: -0.25,
            [SkillId.untouchable]: -0.25,
            [SkillId.sixthSense]: -0.1,
            [SkillId.balletShoes]: -0.05,
            [SkillId.shield]: 0.05,
            [SkillId.toughenedSkin]: 0.05,
            [SkillId.leadSkeleton]: 0.1,
            [SkillId.armor]: 0.1,
            [SkillId.ironHead]: 0.15,
          };
          if (Array.isArray(actor?.skills)) {
            for (const sId of actor.skills as number[]) factor += (mods[sId] ?? 0);
          }
        } catch {}
        factor = Math.max(0, Math.min(1, factor));
        let x = minX + factor * (maxX - minX);
        // Enforce diagonal shift
        const minShift = Math.max(60, (maxX - minX) * 0.6);
        let tries = 0;
        while (typeof currX === 'number' && Math.abs(x - currX) < minShift && tries < 5) {
          factor = Math.random();
          x = minX + factor * (maxX - minX);
          tries++;
        }
        if (typeof currX === 'number' && Math.abs(x - currX) < minShift) {
          x = currX < (minX + maxX) / 2 ? maxX : minX;
        }
        return { x, y };
      };

      const getHitDistance = (srcObj:any, tgtObj:any, step:any, useCounter=false) => {
        // Same space
        if (step?.s === 1) return 20;
        const srcW = (srcObj?.width ?? Math.max(40, Math.abs(srcObj?.node?.width ?? 40)));
        const tgtW = (tgtObj?.width ?? Math.max(40, Math.abs(tgtObj?.node?.width ?? 40)));
        let dist = (srcW * 0.5) + (tgtW * 0.5);
        // reach from known weapon
        let reach = 0;
        try {
          const actorIdx = (typeof step.f === 'number') ? step.f : undefined;
          const targetIdx = (typeof step.t === 'number') ? step.t : undefined;
          if (useCounter && targetIdx !== undefined) {
            const wname = lastWeaponByActor.get(targetIdx);
            reach = (weapons.find((ww)=> ww.name === wname)?.reach ?? 0);
          } else if (!useCounter && actorIdx !== undefined) {
            const wname = lastWeaponByActor.get(actorIdx);
            reach = (weapons.find((ww)=> ww.name === wname)?.reach ?? 0);
          }
        } catch {}
        dist += reach * 16;
        return dist;
      };

      const tweenTo = (obj: any, x:number, y:number, duration=200) => new Promise<void>((resolve) => {
        if (disposed) { resolve(); return; }
        const { x: startX, y: startY } = getPos(obj);
        const dx = x - startX; const dy = y - startY;
        let t = 0; const total = Math.max(1, duration / Math.max(0.001, speed));
        const tick = (tk: any) => {
          if (disposed) { app.ticker.remove(tick); resolve(); return; }
          const deltaMS = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          t += deltaMS;
          const p = Math.min(1, t / total);
          setPos(obj, startX + dx * p, startY + dy * p);
          // Depth by Y
          const pos = getPos(obj);
          // @ts-ignore
          if ('zIndex' in obj) (obj as any).zIndex = pos.y;
          barL.follow(); barR.follow();
          shadowL.follow(); shadowR.follow();
          if (p >= 1) { app.ticker.remove(tick); resolve(); }
        };
        addTick(tick);
      });

      const repositionIfNeeded = async (f: any, baseX: number, side: 'L'|'R') => {
        const cur = getPos(f.node);
        const centerMargin = 25;
        if (side === 'L' && cur.x > (W/2 - centerMargin)) {
          const dist = Math.abs((W/2 - centerMargin) - cur.x);
          const dur = Math.max(120, dist * 2);
          await tweenTo(f.node, baseX, f.baseY, dur);
        }
        if (side === 'R' && cur.x < (W/2 + centerMargin)) {
          const dist = Math.abs((W/2 + centerMargin) - cur.x);
          const dur = Math.max(120, dist * 2);
          await tweenTo(f.node, baseX, f.baseY, dur);
        }
      };

      const delay = (ms:number) => new Promise<void>((res)=>{ const id = window.setTimeout(()=>{ timeouts.delete(id); res(); }, ms); timeouts.add(id); });

      const play = async () => {
        const t0 = performance.now();
        for (const s of steps) {
          if (disposed) return;
          const a = s.a as number;
          const actorIdx: number | null = (typeof s.f === 'number') ? s.f : (typeof s.b === 'number' ? s.b : null);
          const targetIdx: number | null = (typeof s.t === 'number') ? s.t : null;
          const actor = actorIdx !== null ? byIndex.get(actorIdx) : undefined;
          const target = targetIdx !== null ? byIndex.get(targetIdx) : undefined;
          const actorSide: 'L'|'R' = actor?.team === 'R' ? 'R' : 'L';
          const targetSide: 'L'|'R' | null = target ? (target.team === 'R' ? 'R' : 'L') : null;
          const src = actorSide === 'L' ? left : right;
          const tgt = targetSide ? (targetSide === 'L' ? left : right) : (src === left ? right : left);

          // Track Equip to update known weapon (real data)
          try {
            if (typeof (StepType as any) !== 'undefined' && a === (StepType as any).Equip && actorIdx !== null && typeof (s as any).w !== 'undefined') {
              const wname = WeaponById[(s as any).w as WeaponId];
              lastWeaponByActor.set(actorIdx, wname);
            }
          } catch {}

          if (onStep) { try { onStep(steps.indexOf(s), s, performance.now() - t0); } catch {} }

          switch (a) {
          // Arrive: pick lane using largest-gap strategy (official-like)
          case 2: {
            try {
              if (actorSide === 'L') {
                const x = minLX + Math.random() * (maxLX - minLX);
                const y = chooseLaneY('L'); occY.L.push(y);
                setPos(src.node, x, y); src.baseX = x; src.baseY = y;
              } else {
                const x = minRX + Math.random() * (maxRX - minRX);
                const y = chooseLaneY('R'); occY.R.push(y);
                setPos(src.node, x, y); src.baseX = x; src.baseY = y;
              }
            } catch {}
            break; }
          // Move
          case 15: {
            // Skip "loose" moves that don't quickly lead to an AttemptHit for the same actor
            try {
              const curIdx = steps.indexOf(s);
              let willHitSoon = false;
              for (let k = curIdx + 1; k < steps.length && k <= curIdx + 5; k++) {
                const nx = steps[k];
                if (!nx) break;
                if (nx.a === 26) break; // End
                if (typeof nx.f === 'number' && nx.f === actorIdx && nx.a === 19) { willHitSoon = true; break; }
                if (typeof nx.f === 'number' && nx.f === actorIdx && (nx.a === 15 || nx.a === 17)) continue; // neutral
                // If another action by same actor that is not AttemptHit comes first, treat as not an approach for hit
                if (typeof nx.f === 'number' && nx.f === actorIdx) break;
              }
              if (!willHitSoon) { break; }
            } catch {}
            playAnim(src, 'walk', true);
            const tpos = getPos(tgt.node);
            const countered = s?.c === 1;
            const meleeDist = getHitDistance(src, tgt, s, countered);
            const targetX = (targetSide === 'R') ? (tpos.x - meleeDist) : (tpos.x + meleeDist);
            const start = getPos(src.node);
            let ty = clampY(tpos.y); // follow official by default
            // Avoid pure vertical moves: if horizontal delta is tiny, keep Y
            const minDiagX = 28;
            if (Math.abs(targetX - start.x) < minDiagX) ty = start.y;
            const dist = Math.hypot(targetX - start.x, ty - start.y);
            addVector(start.x, start.y, targetX, ty, 0x00cc66);
            const dur = (durationMoveMs(dist) * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            await tweenTo(src.node, targetX, ty, dur);
            playAnim(src, 'idle', true);
            break; }
          // AttemptHit
          case 19: {
            if (traceEnabled && !traceOnRef.current) { traceOnRef.current = true; traceT0Ref.current = performance.now()/1000; }
            try {
              const tpos = getPos(tgt.node);
              const distX = getHitDistance(src, tgt, s, false);
              const idealX = (targetSide === 'R') ? (tpos.x - distX) : (tpos.x + distX);
              const cur = getPos(src.node);
              if ((src === left && idealX > cur.x) || (src === right && idealX < cur.x)) {
                let ty = clampY(tpos.y);
                const minDiagX = 28;
                if (Math.abs(idealX - cur.x) < minDiagX) ty = cur.y;
                const d2 = Math.hypot(idealX - cur.x, ty - cur.y);
                addVector(cur.x, cur.y, idealX, ty, 0xff66cc);
                const durPre = (100 * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
                await tweenTo(src.node, idealX, ty, durPre);
              }
            } catch {}
            playAnim(src, 'shoot', false);
            const lungeDist = 18;
            const durFwd = (100 * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            const durBack = (80 * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            await tweenTo(src.node, src.baseX + (src===left? +lungeDist : -lungeDist), src.baseY - 4, durFwd);
            await tweenTo(src.node, src.baseX, src.baseY, durBack);
            playAnim(src, 'idle', true);
            break; }
          // Hit / variants
          case 9: case 10: case 11: case 12: {
            const dmg = s.d ?? s.damage ?? 0;
            if (targetIdx === leftMainIdx) { hpL = Math.max(0, hpL - dmg); barL.set(hpL / maxL); }
            if (targetIdx === rightMainIdx){ hpR = Math.max(0, hpR - dmg); barR.set(hpR / maxR); }
            // feedback
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
            await shake(2, 100);
            const backDist = 18;
            const actorSpeed2 = (actor?.speed ?? 35) as number;
            const durBack2 = 90 / Math.max(0.001, speed);
            await tweenTo(src.node, src.baseX, src.baseY, durBack2);
            playAnim(src, 'idle', true);
            // Track last weapon used if provided
            try {
              if (typeof s.w !== 'undefined' && actorIdx !== null) {
                const wname = WeaponById[s.w as WeaponId];
                lastWeaponByActor.set(actorIdx, wname);
              }
            } catch {}
            break; }
          // Block
          case 20: {
            const tpos = getPos(tgt.node); floatText(tpos.x, tpos.y, 'BLOCK', 0xd6d645);
            break; }
          // Evade/Dodge
          case 21: {
            const tpos = getPos(tgt.node); floatText(tpos.x, tpos.y, 'DODGE', 0xd6d645);
            break; }
          // MoveBack
          case 17: {
            // Reposition to a new lane like official
            const cur = getPos(src.node);
            const pos = getRandomBaseForSide(actorSide, cur.x);
            // update occupancy with new lane
            if (actorSide === 'L') occY.L.push(pos.y); else occY.R.push(pos.y);
            src.baseX = pos.x; src.baseY = pos.y;
            const start = getPos(src.node);
            const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
            addVector(start.x, start.y, pos.x, pos.y, 0x66ccff);
            const dur = (durationMoveBackMs(dist) * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            await tweenTo(src.node, pos.x, pos.y, dur);
            playAnim(src, 'idle', true);
            break; }
          // Death
          case 24: {
            const diedIdx = actorIdx;
            if (diedIdx === leftMainIdx) { left.node.alpha = 0.2; hpL = 0; barL.set(0); playAnim(left, 'death', false); }
            if (diedIdx === rightMainIdx){ right.node.alpha = 0.2; hpR = 0; barR.set(0); playAnim(right, 'death', false); }
            break; }
          // End
          case 26: {
            try {
              const qp = new URLSearchParams(window.location.search);
              const auto = (qp.get('pixiTraceAuto') === '1' || localStorage.getItem('compare.pixiTraceAuto') === '1');
              const enabled = (qp.get('pixiTrace') === '1' || localStorage.getItem('compare.pixiTrace') === '1');
              if (auto && enabled) { try { (window as any).pixiTraceDownload?.(); } catch {} }
            } catch {}
            return; }
        }
        await delay(Math.max(60, Math.min(260, s.dt ?? 120)) / Math.max(0.001, speed));
        if (disposed) return;
        }
      };

      play();
    };

    run();

    return () => {
      disposed = true;
      // Pause any background videos to avoid renderer/batcher issues during teardown
      try {
        for (const spr of mediaSprites) {
          const v = (spr.texture as any)?.baseTexture?.resource?.source as HTMLVideoElement | undefined;
          try { v?.pause?.(); } catch {}
          try { v?.removeAttribute?.('src'); v?.load?.(); } catch {}
          try { spr.parent?.removeChild?.(spr); } catch {}
          try { spr.destroy?.({ texture: true }); } catch {}
        }
      } catch {}
      try { (app as any).ticker?.stop?.(); } catch {}
      try { removeAllTicks(); } catch {}
      try { clearAllTimeouts(); } catch {}
      try { debugLayerRef.current?.removeChildren?.(); } catch {}
      try { app.stage?.removeChildren?.(); } catch {}
      try { const canvas = (app as any).canvas as HTMLCanvasElement | undefined; if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); } } catch {}
      const toDestroy = app;
      setTimeout(() => { try { toDestroy.destroy(true); } catch {} }, 0);
      if (appRef.current === toDestroy) appRef.current = null;
    };
  }, [fight, scale, speedBoost, /* stageOffsetX, stageOffsetY, */ clampYMinRatio, clampYMaxRatio, leftOffsetX, leftOffsetY, rightOffsetX, rightOffsetY, approachOffset, preferVideoBackground]);

  // Live updates without tearing down the Pixi app
  useEffect(() => {
    try { spinesRef.current.scene?.position.set(stageOffsetX, stageOffsetY); } catch {}
  }, [stageOffsetX, stageOffsetY]);

  useEffect(() => {
    const L = spinesRef.current.L; const R = spinesRef.current.R;
    const target = (typeof charPx === 'number' && !isNaN(charPx)) ? charPx : (charPxRef.current ?? 50);
    const apply = (sp: any, side: 'L'|'R') => {
      if (!sp) return;
      try {
        const bw = Math.max(1, sp?.bounds?.width ?? 200);
        const s = target / bw;
        sp.scale.set(s, s);
        if (side === 'R') sp.scale.x = -Math.abs(sp.scale.x);
      } catch {}
    };
    apply(L, 'L'); apply(R, 'R');
    // Update cached widths for distance calc
    try {
      const scaledWidth = (sp:any)=>{
        try { return Math.max(30, ((sp as any).bounds?.width ?? 40) * Math.max(Math.abs((sp as any).scale?.x ?? 1), 0.001)); } catch { return 40; }
      };
      if (spinesRef.current.L) (spinesRef.current as any).LWidth = scaledWidth(spinesRef.current.L);
      if (spinesRef.current.R) (spinesRef.current as any).RWidth = scaledWidth(spinesRef.current.R);
    } catch {}
    charPxRef.current = target;
  }, [charPx]);

  return <div ref={containerRef} />;
};

export default PixiFight;
























