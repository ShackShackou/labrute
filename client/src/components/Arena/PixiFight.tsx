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
  useCustomBg?: boolean,
  customBgIndex?: number,
  bgStretch?: number,
  bgScale?: number,
  charPx?: number,
  drift?: number,
  contactBias?: number,
  returnFactor?: number,
};

const W = 500; const H = 300;

const PixiFight: React.FC<Props> = ({
  fight,
  speed = 2,
  onStep,
  scale = 0.245,
  speedBoost = 1.6,
  stageOffsetX = 0,
  stageOffsetY = -12,
  clampYMinRatio = 0.58,
  clampYMaxRatio = 0.98,
  leftOffsetX = -11,
  leftOffsetY = 0,
  rightOffsetX = 0,
  rightOffsetY = 0,
  approachOffset = 1,
  preferVideoBackground = false,
  useCustomBg = false,
  customBgIndex = 1,
  bgStretch = 1.15,
  bgScale = 1.0,
  charPx = 50, // Changed from 52 to 50 as requested
  drift = 40,
  contactBias = 5,
  returnFactor = 2,
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

    // Silence audio errors from Pixi
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = String(args[0]);
      if (msg.includes('AudioBufferSourceNode') || msg.includes('AudioScheduledSourceNode')) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };

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
      // Multiplicateur pour ralentir/accÃ©lÃ©rer UNIQUEMENT l'approche (aller)
      const approachScale = (() => {
        const u = params.get('pixiApproachScale');
        const ls = localStorage.getItem('compare.pixiApproachScale');
        const n = Number(u ?? ls ?? '1'); // Par dÃ©faut: 1.0 (fidÃ¨le)
        return Number.isFinite(n) && n > 0 ? n : 1;
      })();
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
      const mulR = (() => { const u = params.get('pixiMulR'); const ls = localStorage.getItem('compare.pixiMulR'); const n = Number(u ?? ls ?? '1'); return isNaN(n) ? 1 : n; })();
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
          // Add to debug layer only if it exists
          if (debugLayerRef.current && !disposed) {
            debugLayerRef.current.addChild(g);
            debugVectorsRef.current.push({ g, life: 2000 });
          }
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
              // Batcher safety: juste masquer, ne pas retirer du render tree pendant le tick
              try { 
                v.g.renderable = false; 
                v.g.visible = false; 
                v.g.alpha = 0; 
              } catch {}
              // Marquer pour suppression ultÃ©rieure
              (v as any).toRemove = true;
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
        
        // Use custom backgrounds if enabled
        if (useCustomBg && !bgParam) {
          // Use the selected custom background
          const bgIdx = customBgIndex || 1;
          const customBgName = bgIdx === 7 ? 'bg7.gif' : `bg${bgIdx}.png`;
          try {
            loaded = await Assets.load(`/backgrounds/${customBgName}`);
          } catch {}
        } else if (bgParam) {
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
            const spr = loaded as Sprite; spr.zIndex = -10; spr.width = W; spr.height = H; 
            spr.y = -12; // Lower by 4px more (was -16, now -12)
            scene.addChildAt(spr, 0);
            try {
              const src = (spr.texture as any)?.baseTexture?.resource?.source as HTMLVideoElement | undefined;
              if (src && typeof src.pause === 'function') { mediaSprites.push(spr); }
            } catch {}
          } else {
            const bg = new Sprite(loaded as any);
            // Only apply stretch and scale to custom backgrounds
            if (useCustomBg) {
              const stretch = bgStretch || 1.15;
              const scaleVal = bgScale || 1.0;
              bg.width = W * scaleVal; 
              bg.height = H * stretch * scaleVal;
              bg.x = (W - bg.width) / 2; // Center horizontally if scaled
            } else {
              // Official backgrounds keep original dimensions
              bg.width = W;
              bg.height = H;
            }
            bg.zIndex = -10;
            bg.y = -12; // Lower by 4px more (was -16, now -12)
            scene.addChildAt(bg, 0);
          }
        }
      } catch {}

      // Positions corrigÃ©es d'aprÃ¨s l'analyse CSV du 10 septembre
      const baseLX = 43 + leftOffsetX; const baseLY = 223 + leftOffsetY;
      const baseRX = 520 + rightOffsetX; const baseRY = 223 + rightOffsetY;
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
          destroy: () => { try { sh.destroy(); } catch {} },
        };
      };
      let shadowL = addShadow(left);
      let shadowR = addShadow(right);

      try {
        // Spine v8 (4.2) assets: mono-page atlas
        Assets.add({ alias: 'spineboyData', src: '/assets/spine/spineboy-pro.json' });
        Assets.add({ alias: 'spineboyAtlas', src: '/assets/spine/spineboy.atlas' });
        await Assets.load(['spineboyData', 'spineboyAtlas']);
        // CrÃ©e sans Ã©chelle, puis calibre sur une largeur cible (pour matcher l'officiel)
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

      const mkHud = (side:'L'|'R', name:string|undefined, fighter: any) => {
        const isL = side === 'L';
        
        // EXACT SIZES FROM ORIGINAL LABRUTE
        const portraitSize = 36;  // Match original size
        const barHeight = 14;     // Thinner bar
        const barWidth = 230;     // Slightly shorter to create gap in middle
        
        // Portrait EXACTLY like original - simple brown square
        const portraitBg = new Graphics();
        portraitBg.lineStyle(1.5, 0xB8860B, 1);  // Same light brown border as HP bar
        portraitBg.beginFill(0x3A2317);  // Darker brown border
        portraitBg.drawRect(0, 0, portraitSize, portraitSize);
        portraitBg.endFill();
        
        // Portrait inner area
        const portrait = new Graphics();
        portrait.beginFill(0x8B6534);  // Lighter brown inner
        portrait.drawRect(2, 2, portraitSize - 4, portraitSize - 4);
        portrait.endFill();
        
        const portraitContainer = new Container();
        portraitContainer.addChild(portraitBg, portrait);
        
        // Try to add actual Spineboy portrait
        try {
          // Create a mini Spineboy for the portrait
          const miniSpine = new Spine(Assets.cache.get('spineboy-data'));
          miniSpine.scale.set(0.08 * (isL ? 1 : -1), 0.08);  // Very small scale
          miniSpine.position.set(portraitSize/2, portraitSize - 5);
          
          // Set idle animation
          if (miniSpine.state) {
            miniSpine.state.setAnimation(0, 'idle', true);
          }
          
          // Add mask to keep within portrait bounds
          const mask = new Graphics();
          mask.beginFill(0xFFFFFF);
          mask.drawRect(2, 2, portraitSize - 4, portraitSize - 4);
          mask.endFill();
          miniSpine.mask = mask;
          portraitContainer.addChild(mask);
          
          portraitContainer.addChild(miniSpine);
        } catch {
          // Fallback to initial if Spine fails
          const initialText = String(name ?? '?')[0];
          const initial = new Text(initialText ? initialText.toUpperCase() : '?', {
            fontSize: 18,
            fill: 0xFFDDCC,
            fontWeight: 'bold',
            stroke: 0x2A1810,
            strokeThickness: 2
          } as any);
          initial.anchor.set(0.5);
          initial.position.set(portraitSize/2, portraitSize/2);
          portraitContainer.addChild(initial);
        }
        
        // Name text - bigger, whiter and bolder
        const nameText = new Text(String(name ?? '').toUpperCase(), {
          fill: '#FFFFFF',  // Pure white
          stroke: '#000000', 
          strokeThickness: 2,  // Reduced from 4 to 2 for cleaner look
          fontSize: 16,  // Just a tiny bit smaller
          fontWeight: '900',  // Maximum bold
          fontFamily: 'Arial Black, Arial'  // Use bolder font variant
        } as any);
        
        // HP Bar container
        const barContainer = new Container();
        const barW = barWidth;
        const barH = barHeight;
        
        // Bar background - black with light brown border
        const barBg = new Graphics();
        barBg.lineStyle(1.5, 0xB8860B, 1);  // Light brown border (goldenrod)
        barBg.beginFill(0x000000);
        barBg.drawRoundedRect(0, 0, barW, barH, 4);
        barBg.endFill();
        
        // Inner background area with rounded corners
        const barInner = new Graphics();
        barInner.beginFill(0x1A0F08);  // Very dark brown
        barInner.drawRoundedRect(1, 1, barW - 2, barH - 2, 3);
        barInner.endFill();
        
        // HP fill container
        const hpFill = new Container();
        
        // HP bar gradient-like effect
        const hpBar = new Graphics();
        hpBar.beginFill(0xFFD700);  // Gold/yellow - like official LaBrute
        hpBar.drawRect(1, 1, barW - 2, barH - 2);
        hpBar.endFill();
        
        // Top highlight for 3D effect
        const hpHighlight = new Graphics();
        hpHighlight.beginFill(0xFFD060, 0.5);
        hpHighlight.drawRect(1, 1, barW - 2, 2);
        hpHighlight.endFill();
        
        // Bottom shadow for depth
        const hpShadow = new Graphics();
        hpShadow.beginFill(0xCC8020, 0.7);
        hpShadow.drawRect(1, barH - 3, barW - 2, 2);
        hpShadow.endFill();
        
        hpFill.addChild(hpBar, hpShadow, hpHighlight);
        
        // Damage bar (shows lost HP in red)
        const dmgBar = new Graphics();
        
        barContainer.addChild(barBg, barInner, hpFill, dmgBar);
        
        // Weapon icon (small, next to portrait)
        const weaponContainer = new Container();
        
        // Add red X for left player (like original)
        let redX: Graphics | null = null;
        if (isL) {
          redX = new Graphics();
          redX.lineStyle(4, 0xFF0000);
          redX.moveTo(5, 5);
          redX.lineTo(portraitSize - 5, portraitSize - 5);
          redX.moveTo(portraitSize - 5, 5);
          redX.lineTo(5, portraitSize - 5);
          redX.visible = false; // Hidden initially
        }
        
        // Create the full HUD layout
        const fullBar = new Container();
        
        if (isL) {
          // LEFT SIDE - ORDER: Name at top, bar below, portrait below bar
          nameText.anchor.set(0, 0);
          nameText.position.set(0, 0);
          
          barContainer.position.set(0, 18);
          
          // Portrait just below bar (collÃ© verticalement)
          portraitContainer.position.set(0, 32);  // Reduced from 36 to be closer
          if (redX) portraitContainer.addChild(redX);
          
          // Weapon icon next to portrait (same position as right side)
          weaponContainer.position.set(portraitSize + 4, 34);
          
          fullBar.addChild(nameText, barContainer, portraitContainer, weaponContainer);
          fullBar.position.set(5, 2);  // Back to edge, gap is in the middle now
        } else {
          // RIGHT SIDE - ORDER: Name at top, bar below, portrait below bar
          nameText.anchor.set(1, 0);
          nameText.position.set(barW, 0);
          
          barContainer.position.set(0, 18);
          
          // Portrait just below bar (collÃ© verticalement)
          portraitContainer.position.set(barW - portraitSize, 32);  // Reduced from 36 to be closer
          
          // Weapon icons aligned left of portrait for right fighter, growing leftward
          weaponContainer.position.set(barW - portraitSize - 130, 34);  // Space for weapons to grow left
          
          fullBar.addChild(nameText, barContainer, portraitContainer, weaponContainer);
          fullBar.position.set(W - 5 - barW, 2);  // Back to edge, gap is in the middle now
        }
        
        ui.addChild(fullBar);
        
        // HP management
        let currentHp = 1;
        let displayHp = 1;
        
        const set = (ratio: number) => {
          currentHp = Math.max(0, Math.min(1, ratio));
          
          // Animate HP bar
          // Ensure minimum visible width - at least 10% of bar width for visibility
          const minVisibleWidth = currentHp > 0 ? Math.max(35, barW * 0.1) : 0;
          const targetWidth = currentHp > 0 ? Math.max(minVisibleWidth, barW * currentHp) : 0;
          
          // Update HP bar graphics safely
          if (hpBar && !hpBar.destroyed && typeof hpBar.clear === 'function') {
            try {
              hpBar.clear();
            } catch {
              return; // Skip if graphics is in invalid state
            }
            
            // Only draw if there's health
            if (currentHp > 0) {
              // Don't subtract anything from targetWidth - use it directly
              const drawWidth = targetWidth;
              
              // Always yellow HP bar - like official LaBrute
              hpBar.beginFill(0xFFD700); // Gold/yellow
              
              if (isL) {
                // Left bar fills from left to right with rounded corners
                hpBar.drawRoundedRect(1, 1, drawWidth - 2, barH - 2, 3);
              } else {
                // Right bar fills from right to left with rounded corners
                const startX = barW - drawWidth + 1;
                hpBar.drawRoundedRect(startX, 1, drawWidth - 2, barH - 2, 3);
              }
              hpBar.endFill();
            }
          }
          
          // Update highlight and shadow to match current HP
          if (hpHighlight && !hpHighlight.destroyed && typeof hpHighlight.clear === 'function') {
            try {
              hpHighlight.clear();
              // Only show highlight if HP is above 10% to avoid artifacts
              if (currentHp > 0.1) {
                const drawWidth = Math.max(0, targetWidth - 2);
                if (drawWidth > 0) {
                  hpHighlight.beginFill(0xFFD060, 0.5);
                  if (isL) {
                    hpHighlight.drawRect(1, 1, drawWidth, 2);
                  } else {
                    const startX = barW - drawWidth - 1;
                    hpHighlight.drawRect(startX, 1, drawWidth, 2);
                  }
                  hpHighlight.endFill();
                }
              }
            } catch {
              return;
            }
          }
          
          if (hpShadow && !hpShadow.destroyed && typeof hpShadow.clear === 'function') {
            try {
              hpShadow.clear();
              // Only show shadow if HP is above 10% to avoid artifacts
              if (currentHp > 0.1) {
                const drawWidth = Math.max(0, targetWidth - 2);
                if (drawWidth > 0) {
                  hpShadow.beginFill(0xCC8020, 0.7);
                  if (isL) {
                    hpShadow.drawRect(1, barH - 3, drawWidth, 2);
                  } else {
                    const startX = barW - drawWidth - 1;
                    hpShadow.drawRect(startX, barH - 3, drawWidth, 2);
                  }
                  hpShadow.endFill();
                }
              }
            } catch {
              return;
            }
          }
          
          // Show RED TRAILING EFFECT for lost HP - like official LaBrute
          if (dmgBar && !dmgBar.destroyed && typeof dmgBar.clear === 'function' && currentHp < displayHp) {
            try {
              dmgBar.clear();
            } catch {
              return;
            }
            
            // Draw red trailing bar that slowly catches up
            const trailWidth = barW * (displayHp - currentHp);
            
            if (isL) {
              // Left bar - red trail on the right side of green bar
              const trailStart = barW * currentHp;
              dmgBar.beginFill(0xFF0000, 0.9);  // Bright red
              dmgBar.drawRect(trailStart, 1, trailWidth, barH - 2);
              dmgBar.endFill();
            } else {
              // Right bar - red trail on the left side of green bar  
              const trailEnd = barW * (1 - currentHp);
              const trailStart = barW * (1 - displayHp);
              dmgBar.beginFill(0xFF0000, 0.9);  // Bright red
              dmgBar.drawRect(trailStart, 1, trailEnd - trailStart, barH - 2);
              dmgBar.endFill();
            }
            
            // Slowly animate the red trail to catch up with green bar
            const animateTrail = () => {
              if (dmgBar && !dmgBar.destroyed && displayHp > currentHp) {
                // Gradually reduce the gap
                displayHp -= (displayHp - currentHp) * 0.08;  // Slower catch-up
                
                if (displayHp - currentHp < 0.005) {
                  displayHp = currentHp;
                  try {
                    if (typeof dmgBar.clear === 'function') dmgBar.clear();
                  } catch {}
                } else {
                  // Redraw the trail
                  set(currentHp);  // This will trigger a redraw
                  setTimeout(animateTrail, 30);  // Continue animation
                }
              }
            };
            
            setTimeout(animateTrail, 30);
          }
        };
        
        // Track all equipped weapons for this fighter
        const weaponsList: string[] = [];
        
        const updateWeapon = (weaponName: string) => {
          // Add weapon to list if not empty
          if (weaponName && weaponName !== 'none' && weaponName !== '') {
            if (!weaponsList.includes(weaponName)) {
              weaponsList.push(weaponName);
            }
          }
          refreshWeaponDisplay();
        };
        
        const removeWeapon = (weaponName: string) => {
          const index = weaponsList.indexOf(weaponName);
          if (index > -1) {
            weaponsList.splice(index, 1);
          }
          refreshWeaponDisplay();
        };
        
        const clearWeapons = () => {
          weaponsList.length = 0;
          refreshWeaponDisplay();
        };
        
        const refreshWeaponDisplay = () => {
          // Clear previous weapon icons
          weaponContainer.removeChildren();
          
          if (weaponsList.length === 0) {
            return;
          }
          
          // Display each weapon icon
          weaponsList.forEach((weaponName, index) => {
            const weaponItemContainer = new Container();
            // For right fighter, align icons from right (closest to portrait)
            if (!isL) {
              // Icons align right-to-left, rightmost weapon closest to portrait
              const rightmostX = 100; // Start position for rightmost weapon
              weaponItemContainer.position.set(rightmostX - index * 30, 0);
            } else {
              // For left fighter, keep normal left-to-right alignment
              weaponItemContainer.position.set(index * 30, 0);
            }
            
            // Weapon icon box (28x28) - transparent background with subtle border
            const weaponBg = new Graphics();
            weaponBg.beginFill(0x1A0F08, 0.3);  // Semi-transparent background
            weaponBg.drawRoundedRect(0, 0, 28, 28, 2);
            weaponBg.endFill();
            
            // Inner border - more visible
            const weaponBorder = new Graphics();
            weaponBorder.lineStyle(1.5, 0x8B6534, 0.8);
            weaponBorder.drawRoundedRect(1, 1, 26, 26, 2);
            
            // Weapon icon - better shapes
            const weaponIcon = new Graphics();
            
            // Determine weapon type and draw appropriate icon
            const lowerName = weaponName.toLowerCase();
          
          if (lowerName.includes('sword') || lowerName.includes('scimitar')) {
            // Sword - vertical blade with guard
            weaponIcon.beginFill(0xE0E0E0);
            weaponIcon.drawRect(13, 5, 2, 14);  // Blade
            weaponIcon.endFill();
            weaponIcon.beginFill(0xB8860B);
            weaponIcon.drawRect(10, 17, 8, 2);  // Guard
            weaponIcon.drawRect(13, 19, 2, 4);  // Handle
            weaponIcon.endFill();
          } else if (lowerName.includes('axe') || lowerName.includes('hatchet')) {
            // Axe - handle with axe head
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 8, 2, 12);  // Handle
            weaponIcon.endFill();
            weaponIcon.beginFill(0x808080);
            weaponIcon.moveTo(11, 8);
            weaponIcon.lineTo(17, 8);
            weaponIcon.lineTo(19, 5);
            weaponIcon.lineTo(19, 11);
            weaponIcon.lineTo(17, 11);
            weaponIcon.lineTo(11, 11);
            weaponIcon.closePath();
            weaponIcon.endFill();
          } else if (lowerName.includes('hammer') || lowerName.includes('mace')) {
            // Hammer - T shape
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 10, 2, 10);  // Handle
            weaponIcon.endFill();
            weaponIcon.beginFill(0x696969);
            weaponIcon.drawRect(9, 6, 10, 5);   // Head
            weaponIcon.endFill();
          } else if (lowerName.includes('lance') || lowerName.includes('trident')) {
            // Lance/Trident - long with point
            weaponIcon.beginFill(0x4682B4);
            weaponIcon.drawRect(13, 8, 2, 12);  // Shaft
            weaponIcon.moveTo(14, 8);
            weaponIcon.lineTo(17, 5);
            weaponIcon.lineTo(14, 5);
            weaponIcon.lineTo(11, 5);
            weaponIcon.lineTo(14, 8);
            weaponIcon.endFill();
          } else if (lowerName.includes('whip') || lowerName.includes('flail')) {
            // Whip - curved line
            weaponIcon.lineStyle(2, 0x8B4513);
            weaponIcon.moveTo(10, 20);
            weaponIcon.bezierCurveTo(14, 18, 16, 12, 18, 8);
          } else if (lowerName.includes('knife') || lowerName.includes('dagger')) {
            // Knife - small blade
            weaponIcon.beginFill(0xC0C0C0);
            weaponIcon.moveTo(14, 8);
            weaponIcon.lineTo(16, 12);
            weaponIcon.lineTo(14, 16);
            weaponIcon.lineTo(12, 12);
            weaponIcon.closePath();
            weaponIcon.endFill();
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 16, 2, 4);  // Handle
            weaponIcon.endFill();
          } else if (lowerName.includes('club') || lowerName.includes('baton')) {
            // Club - thick at top
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 12, 2, 8);  // Handle
            weaponIcon.drawEllipse(11, 6, 6, 8);  // Head
            weaponIcon.endFill();
          } else if (lowerName.includes('fan') || lowerName.includes('shuriken')) {
            // Fan/Shuriken - star shape
            weaponIcon.beginFill(0x800080);
            // Draw star manually
            const points = [];
            const outerRadius = 8;
            const innerRadius = 4;
            for (let i = 0; i < 10; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
              points.push(14 + Math.cos(angle) * radius, 14 + Math.sin(angle) * radius);
            }
            weaponIcon.drawPolygon(points);
            weaponIcon.endFill();
          } else {
            // Default weapon - simple sword silhouette
            weaponIcon.beginFill(0x888888);
            weaponIcon.drawRect(13, 6, 2, 16);
            weaponIcon.drawRect(11, 18, 6, 2);
            weaponIcon.endFill();
          }
          
            // Add all parts to this weapon's container
            weaponItemContainer.addChild(weaponBg, weaponBorder, weaponIcon);
            weaponContainer.addChild(weaponItemContainer);
          });
        };
        
        const follow = () => {};
        
        const showDeathX = () => {
          if (redX) redX.visible = true;
        };
        
        return { set, follow, nameText, updateWeapon, removeWeapon, clearWeapons, showDeathX, fullBar };
      };

      const parseArr = (x: any) => { try { return Array.isArray(x) ? x : JSON.parse(x); } catch { return []; } };
      const steps: any[] = parseArr(fight.steps);
      const fighters: any[] = parseArr(fight.fighters);

      const byIndex = new Map<number, any>();
      for (const f of fighters) { if (typeof f?.index === 'number') byIndex.set(f.index, f); }
      // Track last known weapon by actor (from Hit steps)
      const lastWeaponByActor = new Map<number, string>();
      // Track which weapons are currently drawn (in hand) vs sheathed
      const drawnWeapons = new Set<string>(); // format: "actorIdx:weaponName"
      const leftMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute1Id);
      const rightMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute2Id);
      const leftMainIdx = leftMain?.index ?? 1;
      const rightMainIdx = rightMain?.index ?? 2;
      const maxL = leftMain?.maxHp ?? leftMain?.hp ?? 100;
      const maxR = rightMain?.maxHp ?? rightMain?.hp ?? 100;
      let hpL = maxL, hpR = maxR;
      const hudL = mkHud('L', leftMain?.name, leftMain); 
      const hudR = mkHud('R', rightMain?.name, rightMain);
      const barL = { set: hudL.set, follow: hudL.follow, updateWeapon: hudL.updateWeapon, removeWeapon: hudL.removeWeapon, clearWeapons: hudL.clearWeapons }; 
      const barR = { set: hudR.set, follow: hudR.follow, updateWeapon: hudR.updateWeapon, removeWeapon: hudR.removeWeapon, clearWeapons: hudR.clearWeapons };
      barL.set(1); barR.set(1);
      
      // Show ALL weapons at start (they're sheathed) - LIKE OFFICIAL
      // Initialize ALL weapons for each fighter
      console.log('DEBUG: LeftMain weapons array:', leftMain?.weapons);
      if (leftMain?.weapons && Array.isArray(leftMain.weapons)) {
        leftMain.weapons.forEach((weapon: any) => {
          // Weapons are stored as number IDs, convert to names using WeaponById
          const weaponId = typeof weapon === 'number' ? weapon : (weapon?.id ?? weapon);
          const weaponName = WeaponById[weaponId as keyof typeof WeaponById];
          console.log('DEBUG: Left weapon ID:', weaponId, 'Name:', weaponName);
          if (weaponName) {
            barL.updateWeapon(weaponName);
          }
        });
      }
      console.log('DEBUG: RightMain weapons array:', rightMain?.weapons);
      if (rightMain?.weapons && Array.isArray(rightMain.weapons)) {
        rightMain.weapons.forEach((weapon: any) => {
          // Weapons are stored as number IDs, convert to names using WeaponById
          const weaponId = typeof weapon === 'number' ? weapon : (weapon?.id ?? weapon);
          const weaponName = WeaponById[weaponId as keyof typeof WeaponById];
          console.log('DEBUG: Right weapon ID:', weaponId, 'Name:', weaponName);
          if (weaponName) {
            barR.updateWeapon(weaponName);
          }
        });
      }

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
      const allTexts: Text[] = []; // Garder une rÃ©fÃ©rence Ã  tous les textes crÃ©Ã©s
      
      // PrÃ©-crÃ©er un pool de textes
      for (let i = 0; i < 10; i++) {
        const preText = new Text('', { fill: 0xffffff as any, fontSize: 12 } as any);
        preText.anchor.set(0.5);
        preText.visible = false;
        preText.renderable = false;
        scene.addChild(preText); // Ajouter Ã  la scÃ¨ne une fois pour toutes
        textPool.push(preText);
        allTexts.push(preText);
      }
      
      const getText = () => {
        let t = textPool.pop();
        if (!t) {
          // CrÃ©er un nouveau texte si le pool est vide
          t = new Text('', { fill: 0xffffff as any, fontSize: 12 } as any);
          t.anchor.set(0.5);
          scene.addChild(t); // Ajouter directement Ã  la scÃ¨ne
          allTexts.push(t);
        }
        // RÃ©initialiser l'Ã©tat du texte
        t.visible = true;
        t.renderable = true;
        t.alpha = 1;
        return t;
      };
      const recycleText = (t: Text) => { 
        try { 
          t.visible = false; 
          t.renderable = false;
          t.alpha = 1; 
        } catch {} 
        textPool.push(t); 
      };
      const floatText = (x:number, y:number, txt:string, color=0xffffff) => {
        const t = getText();
        t.text = txt; 
        (t.style as any).fill = color; 
        t.position.set(x, y - 60); 
        t.visible = true;
        t.renderable = true;
        // Le texte est dÃ©jÃ  dans la scÃ¨ne grÃ¢ce au pool prÃ©-crÃ©Ã©
        let a = 0;
        const duration = 650 / Math.max(0.001, speed);
        const tick = (tk:any) => {
          if (disposed) { 
            try { app.ticker.remove(tick); } catch {} 
            // Ne pas retirer pendant le disposed, juste masquer
            try { t.visible = false; t.renderable = false; } catch {}
            recycleText(t); 
            return; 
          }
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          a += dm; const p = Math.min(1, a / duration);
          t.alpha = Math.max(0, 1 - p);
          t.y = (y - 60) - 20 * p;
          if (p >= 1) { 
            app.ticker.remove(tick); 
            // Batcher safety: NE PAS retirer de la scÃ¨ne pendant le tick
            // Juste masquer et marquer pour recyclage
            t.visible = false; 
            t.renderable = false;
            // Recycler sans retirer de la scÃ¨ne
            recycleText(t); 
          }
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

      // Weapon and Pet Spine Animated Placeholders
      const weaponSpines = new Map<any, any>();
      const petSpines = new Map<number, any>();
      
      // Create animated weapon using Spine runtime
      const createWeaponSpine = (weaponName: string) => {
        // Create a container with animated parts
        const container = new Container();
        
        // Create base weapon mesh using Graphics (will animate it)
        const weaponGraphics = new Graphics();
        
        // Color by weapon type
        let color = 0x666666;
        if (weaponName.includes('sword') || weaponName.includes('scimitar')) color = 0xC0C0C0;
        else if (weaponName.includes('axe') || weaponName.includes('hatchet')) color = 0x8B4513;
        else if (weaponName.includes('hammer') || weaponName.includes('mace')) color = 0x696969;
        else if (weaponName.includes('lance') || weaponName.includes('trident')) color = 0x4682B4;
        else if (weaponName.includes('whip') || weaponName.includes('baton')) color = 0x654321;
        else if (weaponName.includes('shuriken') || weaponName.includes('fan')) color = 0x800080;
        else if (weaponName.includes('keyboard') || weaponName.includes('book')) color = 0x228B22;
        
        weaponGraphics.beginFill(color);
        if (weaponName.includes('hammer') || weaponName.includes('mace')) {
          weaponGraphics.drawRect(-4, -25, 8, 20);  // Thicker: 6 -> 8
          weaponGraphics.drawRect(-8, -30, 16, 10); // Thicker: 12 -> 16, 8 -> 10
        } else if (weaponName.includes('axe')) {
          weaponGraphics.drawRect(-3, -25, 6, 20);  // Thicker: 4 -> 6
          weaponGraphics.moveTo(-10, -25);  // Wider: -8 -> -10
          weaponGraphics.lineTo(10, -25);   // Wider: 8 -> 10
          weaponGraphics.lineTo(8, -30);
          weaponGraphics.lineTo(-8, -30);
          weaponGraphics.closePath();
        } else {
          weaponGraphics.drawRect(-3, -30, 6, 30);  // Thicker: 4 -> 6
          if (weaponName.includes('sword')) {
            weaponGraphics.drawRect(-8, -30, 16, 4);  // Thicker: 12 -> 16, 3 -> 4
          }
        }
        weaponGraphics.endFill();
        
        // Add glow effect
        const glow = new Graphics();
        glow.beginFill(color, 0.3);
        glow.drawCircle(0, -15, 20);
        glow.endFill();
        
        container.addChild(glow, weaponGraphics);
        
        // Animate the weapon with swinging motion
        let swingTime = 0;
        const weaponTick = (tk: any) => {
          const dt = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          swingTime += dt * 0.003;
          
          // Swing animation
          weaponGraphics.rotation = Math.sin(swingTime) * 0.2;
          weaponGraphics.scale.set(1 + Math.sin(swingTime * 2) * 0.05);
          
          // Glow pulse
          glow.alpha = 0.3 + Math.sin(swingTime * 3) * 0.2;
          glow.scale.set(1 + Math.sin(swingTime * 2) * 0.1);
        };
        
        // Store tick function for cleanup
        (container as any).weaponTick = weaponTick;
        
        return container;
      };
      
      const createPetSpine = (petType: string, side: 'L'|'R') => {
        const container = new Container();
        
        // Color and size by pet type
        let color = 0x8B4513;
        let size = 12;
        if (petType === 'dog1') { color = 0x8B4513; size = 10; }
        else if (petType === 'dog2') { color = 0xA0522D; size = 12; }
        else if (petType === 'dog3') { color = 0xD2691E; size = 14; }
        else if (petType === 'panther') { color = 0x1C1C1C; size = 15; }
        else if (petType === 'bear') { color = 0x654321; size = 18; }
        
        // Body parts for animation
        const body = new Graphics();
        body.beginFill(color);
        body.drawCircle(0, 0, size);
        body.endFill();
        
        // Head
        const head = new Graphics();
        head.beginFill(color);
        head.drawCircle(0, -size * 0.7, size * 0.8);
        head.endFill();
        
        // Eyes that blink
        const eyes = new Graphics();
        eyes.beginFill(0xFFFFFF);
        eyes.drawCircle(-size/3, -size/3, 2);
        eyes.drawCircle(size/3, -size/3, 2);
        eyes.endFill();
        eyes.beginFill(0x000000);
        eyes.drawCircle(-size/3, -size/3, 1);
        eyes.drawCircle(size/3, -size/3, 1);
        eyes.endFill();
        head.addChild(eyes);
        
        // Legs for walking animation
        const legFL = new Graphics(); // Front Left
        const legFR = new Graphics(); // Front Right
        const legBL = new Graphics(); // Back Left
        const legBR = new Graphics(); // Back Right
        
        [legFL, legFR, legBL, legBR].forEach(leg => {
          leg.beginFill(color);
          leg.drawRect(-2, 0, 4, size * 0.8);
          leg.endFill();
        });
        
        legFL.position.set(-size * 0.5, size * 0.7);
        legFR.position.set(size * 0.5, size * 0.7);
        legBL.position.set(-size * 0.5, size * 0.7);
        legBR.position.set(size * 0.5, size * 0.7);
        
        // Tail
        const tail = new Graphics();
        tail.beginFill(color);
        tail.drawRect(0, -2, size * 0.8, 4);
        tail.endFill();
        tail.position.set(size * 0.8, 0);
        tail.pivot.set(0, 2);
        
        // Shadow
        const shadow = new Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawEllipse(0, size + 2, size * 1.5, size * 0.5);
        shadow.endFill();
        
        // Assemble pet
        container.addChild(shadow, legBL, legBR, body, legFL, legFR, head, tail);
        
        // Animation variables
        let animTime = 0;
        let blinkTimer = 0;
        let isMoving = false;
        
        // Animation tick
        const petTick = (tk: any) => {
          const dt = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          animTime += dt * 0.005;
          blinkTimer += dt;
          
          // Idle breathing animation
          body.scale.set(1 + Math.sin(animTime) * 0.05, 1 + Math.cos(animTime) * 0.05);
          head.y = -size * 0.7 + Math.sin(animTime * 1.5) * 2;
          
          // Tail wag
          tail.rotation = Math.sin(animTime * 3) * 0.3;
          
          // Walking animation
          if (isMoving) {
            const walkCycle = animTime * 3;
            legFL.rotation = Math.sin(walkCycle) * 0.3;
            legFR.rotation = -Math.sin(walkCycle) * 0.3;
            legBL.rotation = -Math.sin(walkCycle + Math.PI) * 0.3;
            legBR.rotation = Math.sin(walkCycle + Math.PI) * 0.3;
          } else {
            // Reset legs when idle
            legFL.rotation *= 0.9;
            legFR.rotation *= 0.9;
            legBL.rotation *= 0.9;
            legBR.rotation *= 0.9;
          }
          
          // Blink animation
          if (blinkTimer > 3000 + Math.random() * 2000) {
            eyes.scale.y = 0.1;
            setTimeout(() => { eyes.scale.y = 1; }, 100);
            blinkTimer = 0;
          }
        };
        
        // Store animation state
        (container as any).petTick = petTick;
        (container as any).setMoving = (moving: boolean) => { isMoving = moving; };
        
        // Flip based on side
        if (side === 'R') {
          container.scale.x = -1;
        }
        
        return container;
      };
      
      const attachWeaponToFighter = (fighter: any, weaponName: string) => {
        // Remove old weapon if exists
        const oldWeapon = weaponSpines.get(fighter);
        if (oldWeapon) {
          if ((oldWeapon as any).weaponTick) {
            app.ticker.remove((oldWeapon as any).weaponTick);
          }
          scene.removeChild(oldWeapon);
          weaponSpines.delete(fighter);
        }
        
        // Create and attach new animated weapon
        if (weaponName && weaponName !== 'none') {
          const weapon = createWeaponSpine(weaponName);
          weaponSpines.set(fighter, weapon);
          scene.addChild(weapon);
          
          // Start weapon animation
          if ((weapon as any).weaponTick) {
            addTick((weapon as any).weaponTick);
          }
          
          // Position update tick
          const updateWeaponPosition = () => {
            const pos = getPos(fighter.node);
            const side = fighter === left ? 'L' : 'R';
            weapon.position.set(
              pos.x + (side === 'L' ? 15 : -15), 
              pos.y - 25  // Raised from -10 to -25 for higher position
            );
            // @ts-ignore
            weapon.zIndex = pos.y + 0.1;
          };
          
          updateWeaponPosition();
          
          const positionTick = (tk: any) => {
            if (disposed || !weaponSpines.has(fighter)) {
              app.ticker.remove(positionTick);
              return;
            }
            updateWeaponPosition();
          };
          addTick(positionTick);
        }
      };

      const getPos = (o:any) => ({ x: (o?.position?.x ?? o?.x) as number, y: clampY((o?.position?.y ?? o?.y) as number) });
      const setPos = (o:any, x:number, y:number) => { if ('position' in o) { o.position.set(x,y); } else { o.x = x; o.y = y; } };

      // Duration from distance constants close to legacy v6 renderer
      // Ralenti les dÃ©placements d'attaque (aller) pour plus de lisibilitÃ©
      // Vitesse paramétrable via URL/localStorage
      const approachPps = (() => { const u=params.get('pixiApproachPps'); const ls=localStorage.getItem('compare.pixiApproachPps'); const n=Number(u ?? ls ?? '320'); return Number.isFinite(n)&&n>0?n:320; })();
      const returnPps   = (() => { const u=params.get('pixiReturnPps');   const ls=localStorage.getItem('compare.pixiReturnPps');   const n=Number(u ?? ls ?? '520'); return Number.isFinite(n)&&n>0?n:520; })();
      const durationMoveMs = (px:number) => Math.max(90, (px / approachPps) * 1000) * approachScale;
      const durationMoveBackMs = (px:number) => Math.max(60, (px / returnPps) * 1000);

      // Limites Y corrigÃ©es d'aprÃ¨s l'analyse CSV
      const minY = 153, maxY = 259;
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

      const tweenTo = (obj: any, x:number, y:number, duration?: number, extraProps?: any) => new Promise<void>((resolve) => {
        const actualDuration = duration ?? 200;
        if (disposed) { resolve(); return; }
        const { x: startX, y: startY } = getPos(obj);
        const dx = x - startX; const dy = y - startY;
        
        // Track starting values for extra properties
        const startProps: any = {};
        const deltaProps: any = {};
        if (extraProps) {
          for (const key in extraProps) {
            startProps[key] = obj[key] ?? 0;
            deltaProps[key] = extraProps[key] - startProps[key];
          }
        }
        
        let t = 0; const total = Math.max(1, actualDuration / Math.max(0.001, speed));
        const tick = (tk: any) => {
          if (disposed) { app.ticker.remove(tick); resolve(); return; }
          const deltaMS = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          t += deltaMS;
          const p = Math.min(1, t / total);
          setPos(obj, startX + dx * p, startY + dy * p);
          
          // Apply extra property animations
          if (extraProps) {
            for (const key in extraProps) {
              obj[key] = startProps[key] + deltaProps[key] * p;
            }
          }
          
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
              const newWeaponName = WeaponById[(s as any).w as WeaponId];
              const oldWeaponName = lastWeaponByActor.get(actorIdx);
              
              // If switching weapons, animate dropping the old one
              if (oldWeaponName && oldWeaponName !== newWeaponName) {
                const pos = getPos(src.node);
                const dropWeapon = new Graphics();
                dropWeapon.lineStyle(1, 0x666666);
                dropWeapon.beginFill(0x888888);
                dropWeapon.drawRect(-4, -8, 8, 16);
                dropWeapon.endFill();
                dropWeapon.position.set(pos.x, pos.y - 30);
                scene.addChild(dropWeapon);
                
                // Animate old weapon being tossed aside
                const dropDir = Math.random() > 0.5 ? 1 : -1;
                let dropTime = 0;
                const dropTick = (delta: any) => {
                  dropTime += delta.deltaMS ?? 16.7;
                  const progress = Math.min(dropTime / 400, 1);
                  dropWeapon.x = pos.x + dropDir * progress * 40;
                  dropWeapon.y = pos.y - 30 + progress * 60 - Math.sin(progress * Math.PI) * 20;
                  dropWeapon.rotation = progress * Math.PI * 3;
                  dropWeapon.alpha = 1 - progress * 0.3;
                  
                  if (progress >= 1) {
                    app.ticker.remove(dropTick);
                    scene.removeChild(dropWeapon);
                    dropWeapon.destroy();
                  }
                };
                app.ticker.add(dropTick);
              }
              
              lastWeaponByActor.set(actorIdx, newWeaponName);
              // Attach weapon placeholder to fighter
              attachWeaponToFighter(src, newWeaponName);
              
              // HIDE weapon icon when weapon is drawn - LIKE OFFICIAL
              const weaponKey = `${actorIdx}:${newWeaponName}`;
              drawnWeapons.add(weaponKey);
              
              if (actor === leftMain) {
                barL.removeWeapon(newWeaponName); // Remove this specific weapon icon when drawn
              } else if (actor === rightMain) {
                barR.removeWeapon(newWeaponName); // Remove this specific weapon icon when drawn
              }
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
              
              // Check if this is a pet arrival
              if (actor?.type === 'pet' && actor?.master && actorIdx !== null) {
                const petType = actor.name || 'dog1';
                const pet = createPetSpine(petType, actorSide);
                petSpines.set(actorIdx, pet);
                scene.addChild(pet);
                
                // Start pet animation
                if ((pet as any).petTick) {
                  addTick((pet as any).petTick);
                }
                
                // Position near master
                const masterIdx = actor.master;
                const masterSide = masterIdx === leftMainIdx ? 'L' : 'R';
                const masterObj = masterSide === 'L' ? left : right;
                const masterPos = getPos(masterObj.node);
                
                pet.position.set(
                  masterPos.x + (actorSide === 'L' ? -30 : 30),
                  masterPos.y + 10
                );
                
                // Update src to use pet container
                if (actorSide === 'L') {
                  left = { node: pet, baseX: pet.x, baseY: pet.y, type: 'pet', width: 30 };
                } else {
                  right = { node: pet, baseX: pet.x, baseY: pet.y, type: 'pet', width: 30 };
                }
              }
            } catch {}
            break; }
          // Move
          case 15: {
            // Set pet moving state if it's a pet
            const petSpine = petSpines.get(actorIdx ?? -1);
            if (petSpine && (petSpine as any).setMoving) {
              (petSpine as any).setMoving(true);
            }
            
            // Autoriser uniquement les dÃ©placements de mÃªlÃ©e explicites (r=1)
            // (r filter disabled to allow all Move steps)
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
            const minDiagX = (Number(new URLSearchParams(window.location.search).get('pixiMinDiagX')) || Number(localStorage.getItem('compare.pixiMinDiagX')) || 60);
            if (Math.abs(targetX - start.x) < minDiagX) { break; }
            const dist = Math.hypot(targetX - start.x, ty - start.y);
            addVector(start.x, start.y, targetX, ty, 0x00cc66);
            const dur = (durationMoveMs(dist) * approachScale * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            
            // JUST MOVE - no weapon animation here
            await tweenTo(src.node, targetX, ty, dur);
            
            // Stop pet movement
            if (petSpine && (petSpine as any).setMoving) {
              (petSpine as any).setMoving(false);
            }
            
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
                const minDiag = (Number(new URLSearchParams(window.location.search).get('pixiMinDiagX'))
                  || Number(localStorage.getItem('compare.pixiMinDiagX')) || 60);
                if (Math.abs(idealX - cur.x) >= minDiag) {
                  // PrÃ©-move diagonal (X et Y ensemble)
                  const ty2 = cur.y;
                  addVector(cur.x, cur.y, idealX, ty2, 0xff66cc);
                  const dx = Math.abs(idealX - cur.x);
                  const durPre = Math.max(90, (dx / approachPps) * 1000) * approachScale / Math.max(0.001, speed);
                  await tweenTo(src.node, idealX, ty2, durPre);
                }
                // Fallback: réaligner en Y si pas de Move juste avant et gros écart Y
                const curIdx = steps.indexOf(s);
                const prev = steps[curIdx - 1];
                const prevIsMoveSameActor = prev && typeof prev.f === 'number' && prev.f === actorIdx && prev.a === StepType.Move;
                const tyTarget = getPos(tgt.node).y;
                if (!prevIsMoveSameActor && Math.abs(tyTarget - cur.y) > 6) {
                  const dist2 = Math.abs(tyTarget - cur.y);
                  const durPre2 = Math.max(60, (dist2 / approachPps) * 1000) * approachScale / Math.max(0.001, speed);
                  await tweenTo(src.node, idealX, tyTarget, durPre2);
                }
              }
            } catch {}
            playAnim(src, 'shoot', false);
            const lungeDist = 18;
            const durFwd = Math.max(80, (lungeDist / approachPps) * 1000) * approachScale / Math.max(0.001, speed);
            const durBack = Math.max(70, (lungeDist / returnPps) * 1000) / Math.max(0.001, speed);
            // Lunge horizontal depuis position actuelle (garde le Y actuel)
            const curPos = getPos(src.node);
            await tweenTo(src.node, curPos.x + (src===left? +lungeDist : -lungeDist), curPos.y, durFwd);
            await tweenTo(src.node, curPos.x, curPos.y, durBack);
            playAnim(src, 'idle', true);
            break; }
          // Hit / variants - EXACT LIKE OFFICIAL LABRUTE
          case 9: case 10: case 11: case 12: {
            const dmg = s.d ?? s.damage ?? 0;
            const isCritical = a === 10; // HitCritical
            const isFlash = a === 11; // HitFlash  
            const isVersatile = a === 12; // HitVersatile
            
            // WEAPON ANIMATION AND DAMAGE IN PARALLEL
            // Start animation immediately and apply damage at the right moment
            
            // Start weapon animation if weapon equipped
            let weaponAnimPromise: Promise<void> | null = null;
            if (typeof s.w !== 'undefined') {
              const weapon = weaponSpines.get(src);
              if (weapon) {
                const originalRotation = weapon.rotation;
                const originalY = weapon.y;
                const swingDirection = (src === left ? 1 : -1);
                
                weaponAnimPromise = (async () => {
                  // ULTRA quick raise - 20ms
                  await tweenTo(weapon, weapon.x, originalY - 40, 20, {
                    rotation: originalRotation - swingDirection * Math.PI / 4
                  });
                  
                  // Lightning fast swing - 30ms
                  await tweenTo(weapon, weapon.x, originalY + 20, 30, {
                    rotation: originalRotation + swingDirection * Math.PI / 3
                  });
                  
                  // Quick return - 50ms
                  await tweenTo(weapon, weapon.x, originalY, 50, {
                    rotation: originalRotation
                  });
                })();
              }
            }
            
            // Apply damage IMMEDIATELY (animation happens in parallel)
            // If there's damage, someone's HP must decrease
            if (dmg > 0) {
              // Check if target is main fighter by ID
              if (target?.id === fight.brute1Id) {
                hpL = Math.max(0, hpL - dmg);
                // Immediate update
                barL.set(hpL / maxL);
                // Also schedule update after a small delay to ensure it sticks
                setTimeout(() => barL.set(hpL / maxL), 50);
              } else if (target?.id === fight.brute2Id) {
                hpR = Math.max(0, hpR - dmg);
                // Immediate update
                barR.set(hpR / maxR);
                // Also schedule update after a small delay to ensure it sticks
                setTimeout(() => barR.set(hpR / maxR), 50);
              }
              // Fallback: check by index
              else if (targetIdx === leftMainIdx) {
                hpL = Math.max(0, hpL - dmg);
                barL.set(hpL / maxL);
                setTimeout(() => barL.set(hpL / maxL), 50);
              } else if (targetIdx === rightMainIdx) {
                hpR = Math.max(0, hpR - dmg);
                barR.set(hpR / maxR);
                setTimeout(() => barR.set(hpR / maxR), 50);
              }
              // Last resort: use visual position
              else if (tgt === left) {
                hpL = Math.max(0, hpL - dmg);
                barL.set(hpL / maxL);
                setTimeout(() => barL.set(hpL / maxL), 50);
              } else if (tgt === right) {
                hpR = Math.max(0, hpR - dmg);
                barR.set(hpR / maxR);
                setTimeout(() => barR.set(hpR / maxR), 50);
              }
            }
            
            // Update pet HP if target is pet
            const petSpine = petSpines.get(targetIdx ?? -1);
            if (petSpine && target) {
              const petHpRatio = Math.max(0, (target.hp - dmg) / (target.maxHp || 100));
              if (petHpRatio <= 0) {
                // Pet death animation - stop animation and fade
                petSpine.alpha = 0.3;
                if ((petSpine as any).petTick) {
                  app.ticker.remove((petSpine as any).petTick);
                }
                // Death pose - lay down
                petSpine.rotation = Math.PI / 2;
                petSpine.y += 10;
              }
            }
            
            // feedback with special effects
            const tpos = getPos(tgt.node);
            if (isCritical) {
              floatText(tpos.x, tpos.y - 20, 'CRITICAL!', 0xFFD700);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xFF0000);
              await shake(4, 150);
            } else if (isFlash) {
              floatText(tpos.x, tpos.y - 20, 'FLASH!', 0x00FFFF);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
              await shake(3, 120);
            } else if (isVersatile) {
              floatText(tpos.x, tpos.y - 20, 'VERSATILE!', 0xFF69B4);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
              await shake(2, 100);
            } else {
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
              await shake(2, 100);
            }
            
            // Knockback effect on target
            if (dmg > 10) {
              const cur = getPos(tgt.node);
              const knockX = tgt === left ? cur.x - 8 : cur.x + 8;
              await tweenTo(tgt.node, knockX, cur.y, 60);
              await tweenTo(tgt.node, cur.x, cur.y, 60);
            }
            
            // Wait for weapon animation to complete
            if (weaponAnimPromise) {
              await weaponAnimPromise;
            }
            
            // Pas de retour base ici (Ã©vite micro-dÃ©placements). Le retour se fait au Step MoveBack.
            playAnim(src, 'idle', true);
            // Track last weapon used if provided
            try {
              if (typeof s.w !== 'undefined' && actorIdx !== null) {
                const wname = WeaponById[s.w as WeaponId];
                lastWeaponByActor.set(actorIdx, wname);
                // Update weapon visual
                attachWeaponToFighter(src, wname);
                
                // NO ANIMATION HERE - already done in Move phase with proper timing
                
                // DO NOT show weapon icon - weapon stays drawn after attack - LIKE OFFICIAL
                // The weapon remains in hand, so icon stays hidden
              }
            } catch {}
            break; }
          // Block
          case 20: {
            const tpos = getPos(tgt.node); 
            floatText(tpos.x, tpos.y, 'BLOCK', 0x4169E1);
            // Small knockback effect
            const cur = getPos(tgt.node);
            const knockX = tgt === left ? cur.x - 5 : cur.x + 5;
            await tweenTo(tgt.node, knockX, cur.y, 50);
            await tweenTo(tgt.node, cur.x, cur.y, 50);
            break; }
          // Evade/Dodge
          case 21: {
            const tpos = getPos(tgt.node); 
            floatText(tpos.x, tpos.y, 'MISS', 0xFFD700);
            
            // Attacker swings and misses
            const attackerPos = getPos(src.node);
            const attackerForward = (actorSide === 'L') ? 30 : -30;
            
            // Jump dodge animation - like official LaBrute
            const cur = getPos(tgt.node);
            const dodgeBack = (targetSide === 'L') ? -25 : 25;
            const jumpHeight = 0; // pas de saut vertical hors aller/retour
            
            // Both animations happen simultaneously
            const [dodgePromise, attackPromise] = [
              // Target jumps back to dodge
              (async () => {
                await tweenTo(tgt.node, cur.x + dodgeBack/2, cur.y + jumpHeight, 100);
                await tweenTo(tgt.node, cur.x + dodgeBack, cur.y, 100);
                await tweenTo(tgt.node, cur.x, cur.y, 150);
              })(),
              // Attacker swings forward (missing)
              (async () => {
                playAnim(src, 'walk', true);
                await tweenTo(src.node, attackerPos.x + attackerForward, attackerPos.y, 150);
                playAnim(src, 'idle', true);
                await tweenTo(src.node, attackerPos.x, attackerPos.y, 100);
              })()
            ];
            
            await Promise.all([dodgePromise, attackPromise]);
            break; }
          // MoveBack
          case 17: {
            // Check if this is after a disarm (previous step was disarm)
            const prevStep = steps[steps.indexOf(s) - 1];
            const isAfterDisarm = prevStep && prevStep.a === 23;
            
            const cur = getPos(src.node);
            let pos;
            
            if (isAfterDisarm) {
              // After disarm, keep same Y position
              pos = { x: src.baseX || cur.x, y: cur.y };
            } else {
              // Normal repositioning to a new lane
              pos = getRandomBaseForSide(actorSide, cur.x);
              // update occupancy with new lane
              if (actorSide === 'L') occY.L.push(pos.y); else occY.R.push(pos.y);
              src.baseY = pos.y;
            }
            
            src.baseX = pos.x;
            const start = getPos(src.node);
            const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
            addVector(start.x, start.y, pos.x, pos.y, 0x66ccff);
            const dur = (durationMoveBackMs(dist) * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            await tweenTo(src.node, pos.x, pos.y, dur);
            playAnim(src, 'idle', true);
            break; }
          // Death
          case 24: {
            // Use the same logic as Hit to identify who died
            const diedIdx = actorIdx; // Fix: Define diedIdx like in official LaBrute
            const diedFighter = actor;
            
            // Check if it's one of the main fighters
            if (diedFighter?.id === fight.brute1Id || actorIdx === leftMainIdx) { 
              left.node.alpha = 0.2; 
              hpL = 0; 
              barL.set(0); 
              if (hudL.showDeathX) hudL.showDeathX();
              playAnim(left, 'death', false);
              floatText(left.node.x, left.node.y, 'DEAD', 0x8B0000);
            } else if (diedFighter?.id === fight.brute2Id || actorIdx === rightMainIdx) { 
              right.node.alpha = 0.2; 
              hpR = 0; 
              barR.set(0); 
              playAnim(right, 'death', false);
              floatText(right.node.x, right.node.y, 'DEAD', 0x8B0000);
            }
            // Handle pet death
            const petSpine = petSpines.get(diedIdx ?? -1);
            if (petSpine) {
              petSpine.alpha = 0.2;
              if ((petSpine as any).petTick) {
                app.ticker.remove((petSpine as any).petTick);
              }
              // Death animation - fall over
              petSpine.rotation = Math.PI / 2;
              petSpine.y += 10;
              floatText(petSpine.x, petSpine.y, 'PET DEAD', 0x8B0000);
            }
            break; }
          // Throw (projectile weapon)
          case 22: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            
            // Create animated projectile
            const projectileContainer = new Container();
            
            // Determine projectile type from weapon
            const weaponName = lastWeaponByActor.get(actorIdx ?? -1) || 'knife';
            
            // Remove weapon icon when thrown - LIKE OFFICIAL
            const thrownWeapon = weaponName;
            if (actor === leftMain) {
              barL.removeWeapon(thrownWeapon); // Remove thrown weapon icon
              lastWeaponByActor.delete(actorIdx ?? -1);
            } else if (actor === rightMain) {
              barR.removeWeapon(thrownWeapon); // Remove thrown weapon icon
              lastWeaponByActor.delete(actorIdx ?? -1);
            }
            
            // Create weapon sprite for throw animation
            const weaponSprite = new Graphics();
            weaponSprite.lineStyle(2, 0x666666);
            weaponSprite.beginFill(0x888888);
            
            // Draw weapon shape based on type
            if (weaponName.includes('knife') || weaponName.includes('dagger')) {
              weaponSprite.drawRect(-3, -15, 6, 30);
            } else if (weaponName.includes('axe') || weaponName.includes('hatchet')) {
              weaponSprite.moveTo(-10, -10);
              weaponSprite.lineTo(10, -10);
              weaponSprite.lineTo(5, 0);
              weaponSprite.lineTo(0, 15);
              weaponSprite.lineTo(-5, 0);
              weaponSprite.closePath();
            } else {
              weaponSprite.drawRect(-5, -10, 10, 20);
            }
            weaponSprite.endFill();
            
            const projectile = weaponSprite;
            
            if (weaponName.includes('shuriken')) {
              // Spinning shuriken
              projectile.lineStyle(2, 0x800080);
              for (let i = 0; i < 4; i++) {
                const angle = (i * 90) * Math.PI / 180;
                projectile.moveTo(0, 0);
                projectile.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
              }
            } else if (weaponName.includes('knife')) {
              // Knife shape
              projectile.beginFill(0xC0C0C0);
              projectile.drawRect(-1, -6, 2, 12);
              projectile.endFill();
            } else {
              // Generic projectile
              projectile.beginFill(0x808080);
              projectile.drawCircle(0, 0, 4);
              projectile.endFill();
            }
            
            // Trail effect
            const trail = new Graphics();
            trail.lineStyle(2, 0xFFFFFF, 0.3);
            
            projectileContainer.addChild(trail, projectile);
            projectileContainer.position.set(spos.x, spos.y - 20);
            scene.addChild(projectileContainer);
            
            // Animate with rotation and trail
            let throwTime = 0;
            const throwDuration = 300 / speed;
            const startX = spos.x;
            const startY = spos.y - 20;
            const endX = tpos.x;
            const endY = tpos.y - 20;
            const trailPoints: {x: number, y: number}[] = [];
            
            const throwTick = (tk: any) => {
              throwTime += tk.deltaMS || 16.7;
              const progress = Math.min(1, throwTime / throwDuration);
              
              // Parabolic arc
              const x = startX + (endX - startX) * progress;
              const baseY = startY + (endY - startY) * progress;
              const arcHeight = Math.sin(progress * Math.PI) * 30;
              const y = baseY - arcHeight;
              
              projectileContainer.position.set(x, y);
              projectile.rotation += 0.3;
              
              // Update trail
              trailPoints.push({x, y});
              if (trailPoints.length > 10) trailPoints.shift();
              
              if (trail && !trail.destroyed && typeof trail.clear === 'function') {
                try { trail.clear(); } catch {}
              }
              trail.lineStyle(2, 0xFFFFFF, 0.3);
              if (trailPoints.length > 1) {
                const firstPoint = trailPoints[0];
                if (firstPoint) {
                  trail.moveTo(firstPoint.x - x, firstPoint.y - y);
                  for (let i = 1; i < trailPoints.length; i++) {
                    const point = trailPoints[i];
                    if (point) {
                      trail.lineTo(point.x - x, point.y - y);
                    }
                  }
                }
              }
              
              if (progress >= 1) {
                app.ticker.remove(throwTick);
                scene.removeChild(projectileContainer);
                // Destroy all children properly
                try {
                  projectile.destroy();
                  trail.destroy();
                  projectileContainer.destroy();
                } catch {}
              }
            };
            addTick(throwTick);
            await delay(throwDuration);
            break; }
          
          // Disarm
          case 23: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'DISARMED!', 0xFF6347);
            
            // Animate weapon flying away
            const disarmedWeapon = lastWeaponByActor.get(targetIdx ?? -1) || 'knife';
            const weaponFly = new Graphics();
            weaponFly.lineStyle(2, 0x666666);
            weaponFly.beginFill(0x888888);
            weaponFly.drawRect(-5, -10, 10, 20);
            weaponFly.endFill();
            weaponFly.position.set(tpos.x, tpos.y - 30);
            scene.addChild(weaponFly);
            
            // Animate weapon flying and spinning away
            const flyDir = Math.random() > 0.5 ? 1 : -1;
            let flyTime = 0;
            const flyTick = (delta: any) => {
              flyTime += delta.deltaMS ?? 16.7;
              const progress = Math.min(flyTime / 500, 1);
              weaponFly.x = tpos.x + flyDir * progress * 60;
              weaponFly.y = tpos.y - 30 - Math.sin(progress * Math.PI) * 40 + progress * 50;
              weaponFly.rotation = progress * Math.PI * 4;
              weaponFly.alpha = 1 - progress * 0.5;
              
              if (progress >= 1) {
                app.ticker.remove(flyTick);
                scene.removeChild(weaponFly);
                weaponFly.destroy();
              }
            };
            app.ticker.add(flyTick);
            
            // Remove weapon visual from target
            const targetWeapon = weaponSpines.get(tgt);
            if (targetWeapon) {
              if ((targetWeapon as any).weaponTick) {
                app.ticker.remove((targetWeapon as any).weaponTick);
              }
              scene.removeChild(targetWeapon);
              weaponSpines.delete(tgt);
            }
            // Remove weapon icon from HUD - LIKE OFFICIAL
            if (target === leftMain && disarmedWeapon) {
              barL.removeWeapon(disarmedWeapon); // Remove disarmed weapon icon
              lastWeaponByActor.delete(targetIdx ?? -1);
            } else if (target === rightMain && disarmedWeapon) {
              barR.removeWeapon(disarmedWeapon); // Remove disarmed weapon icon
              lastWeaponByActor.delete(targetIdx ?? -1);
            }
            break; }
          
          // Steal (weapon steal)
          case 25: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'STOLEN!', 0x9370DB);
            // Transfer weapon visual
            const targetWeapon = weaponSpines.get(tgt);
            if (targetWeapon) {
              weaponSpines.delete(tgt);
              weaponSpines.set(src, targetWeapon);
            }
            // Get the stolen weapon name from target
            const stolenWeapon = lastWeaponByActor.get(targetIdx ?? -1) || '';
            // Remove weapon icon from victim - LIKE OFFICIAL
            if (target === leftMain && stolenWeapon) {
              barL.removeWeapon(stolenWeapon); // Remove stolen weapon from victim
            } else if (target === rightMain && stolenWeapon) {
              barR.removeWeapon(stolenWeapon); // Remove stolen weapon from victim
            }
            // Add weapon icon to thief - LIKE OFFICIAL
            if (actor === leftMain && stolenWeapon) {
              barL.updateWeapon(stolenWeapon); // Add stolen weapon to thief
              lastWeaponByActor.set(actorIdx ?? -1, stolenWeapon);
            } else if (actor === rightMain && stolenWeapon) {
              barR.updateWeapon(stolenWeapon); // Add stolen weapon to thief
              lastWeaponByActor.set(actorIdx ?? -1, stolenWeapon);
            }
            // Remove from victim's tracking
            lastWeaponByActor.delete(targetIdx ?? -1);
            break; }
          
          // Sabotage
          case 27: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'SABOTAGED!', 0xFFA500);
            break; }
          
          // Net (trap)
          case 28: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'TRAPPED!', 0x8B4513);
            
            // Create animated net with physics simulation
            const netContainer = new Container();
            const netNodes: {x: number, y: number, vx: number, vy: number}[] = [];
            
            // Create net grid nodes
            const gridSize = 6;
            const spacing = 8;
            for (let i = 0; i < gridSize; i++) {
              for (let j = 0; j < gridSize; j++) {
                netNodes.push({
                  x: (i - gridSize/2) * spacing,
                  y: (j - gridSize/2) * spacing - 30,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -5 - Math.random() * 3
                });
              }
            }
            
            netContainer.position.set(tpos.x, tpos.y);
            scene.addChild(netContainer);
            
            // Animate net falling and settling
            let netTime = 0;
            const netTick = (tk: any) => {
              netTime += tk.deltaMS || 16.7;
              
              // Clear and redraw net - SAFE CLEAR
              try {
                netContainer.removeChildren();
              } catch {}
              const netGraphics = new Graphics();
              netGraphics.lineStyle(2, 0x8B4513, 0.7);
              
              // Update physics
              netNodes.forEach(node => {
                // Gravity
                node.vy += 0.5;
                // Air resistance
                node.vx *= 0.98;
                node.vy *= 0.98;
                // Update position
                node.x += node.vx * 0.5;
                node.y += node.vy * 0.5;
                
                // Constrain to target area
                if (node.y > 10) {
                  node.y = 10;
                  node.vy *= -0.3;
                }
              });
              
              // Draw net lines
              for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                  const idx = i * gridSize + j;
                  const node = netNodes[idx];
                  if (!node) continue;
                  
                  // Draw horizontal lines
                  if (j < gridSize - 1) {
                    const next = netNodes[idx + 1];
                    if (next) {
                      netGraphics.moveTo(node.x, node.y);
                      netGraphics.lineTo(next.x, next.y);
                    }
                  }
                  
                  // Draw vertical lines
                  if (i < gridSize - 1) {
                    const next = netNodes[idx + gridSize];
                    if (next) {
                      netGraphics.moveTo(node.x, node.y);
                      netGraphics.lineTo(next.x, next.y);
                    }
                  }
                }
              }
              
              netContainer.addChild(netGraphics);
              
              // Remove after settling
              if (netTime > 2500) {
                app.ticker.remove(netTick);
                scene.removeChild(netContainer);
                setTimeout(() => { try { netContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(netTick);
            break; }
          
          // Bomb
          case 29: {
            const tpos = getPos(tgt.node);
            
            // Create animated bomb with Spine-like parts
            const bombContainer = new Container();
            
            // Bomb body
            const bomb = new Graphics();
            bomb.beginFill(0x1C1C1C);
            bomb.drawCircle(0, 0, 8);
            bomb.endFill();
            
            // Fuse
            const fuse = new Graphics();
            fuse.lineStyle(2, 0x8B4513);
            fuse.moveTo(0, -8);
            fuse.lineTo(0, -15);
            
            // Spark
            const spark = new Graphics();
            spark.beginFill(0xFFFF00);
            spark.drawStar(0, -15, 5, 4, 2);
            spark.endFill();
            
            bombContainer.addChild(bomb, fuse, spark);
            bombContainer.position.set(tpos.x, tpos.y - 30);
            scene.addChild(bombContainer);
            
            // Animate fuse burning
            let fuseTime = 0;
            const fuseTick = (tk: any) => {
              fuseTime += tk.deltaMS || 16.7;
              spark.y = -15 + (fuseTime / 500) * 7;
              spark.scale.set(1 + Math.random() * 0.3);
              spark.rotation += 0.2;
              
              if (fuseTime > 500) {
                app.ticker.remove(fuseTick);
                // Defer destruction to avoid batcher error
                setTimeout(() => {
                  if (scene && bombContainer && bombContainer.parent) {
                    scene.removeChild(bombContainer);
                    bombContainer.destroy(true);
                  }
                }, 0);
                
                // Create explosion with multiple layers
                const explosion = new Container();
                
                // Inner core
                const core = new Graphics();
                core.beginFill(0xFFFFFF, 1);
                core.drawCircle(0, 0, 10);
                core.endFill();
                
                // Middle layer
                const middle = new Graphics();
                middle.beginFill(0xFFA500, 0.8);
                middle.drawCircle(0, 0, 20);
                middle.endFill();
                
                // Outer layer
                const outer = new Graphics();
                outer.beginFill(0xFF4500, 0.6);
                outer.drawCircle(0, 0, 30);
                outer.endFill();
                
                // Shockwave ring
                const ring = new Graphics();
                ring.lineStyle(3, 0xFFFF00, 0.8);
                ring.drawCircle(0, 0, 5);
                
                explosion.addChild(outer, middle, core, ring);
                explosion.position.set(tpos.x, tpos.y);
                scene.addChild(explosion);
                
                // Animate explosion
                let expTime = 0;
                const expTick = (tk: any) => {
                  expTime += tk.deltaMS || 16.7;
                  const progress = expTime / 300;
                  
                  core.scale.set(1 + progress * 2);
                  core.alpha = Math.max(0, 1 - progress);
                  
                  middle.scale.set(1 + progress * 1.5);
                  middle.alpha = Math.max(0, 0.8 - progress);
                  
                  outer.scale.set(1 + progress);
                  outer.alpha = Math.max(0, 0.6 - progress);
                  
                  ring.scale.set(1 + progress * 4);
                  ring.alpha = Math.max(0, 0.8 - progress * 2);
                  
                  if (progress >= 1) {
                    app.ticker.remove(expTick);
                    scene.removeChild(explosion);
                    setTimeout(() => { try { explosion.destroy(); } catch {} }, 0);
                  }
                };
                addTick(expTick);
              }
            };
            addTick(fuseTick);
            
            floatText(tpos.x, tpos.y, 'BOMB!', 0xFF4500);
            await delay(600);
            await shake(6, 250);
            break; }
          
          // Hammer (stun)
          case 30: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'STUNNED!', 0x4B0082);
            
            // Create animated stars circling around head
            const starsContainer = new Container();
            const starSprites: Graphics[] = [];
            
            for (let i = 0; i < 5; i++) {
              const star = new Graphics();
              star.beginFill(0xFFFF00, 0.9);
              star.drawStar(0, 0, 6, 5, 2);
              star.endFill();
              starSprites.push(star);
              starsContainer.addChild(star);
            }
            
            starsContainer.position.set(tpos.x, tpos.y - 30);
            scene.addChild(starsContainer);
            
            // Animate stars in spiral pattern
            let animTime = 0;
            const starTick = (tk: any) => {
              animTime += (tk.deltaMS || 16.7) * 0.003;
              
              starSprites.forEach((star, i) => {
                const angle = animTime * 2 + (i * Math.PI * 2 / 5);
                const radius = 20 + Math.sin(animTime * 3) * 5;
                star.x = Math.cos(angle) * radius;
                star.y = Math.sin(angle) * radius * 0.5; // Elliptical orbit
                star.rotation = animTime * 3;
                star.scale.set(0.8 + Math.sin(animTime * 4 + i) * 0.2);
                star.alpha = 0.6 + Math.sin(animTime * 5 + i) * 0.4;
              });
              
              if (animTime > Math.PI * 3) {
                app.ticker.remove(starTick);
                scene.removeChild(starsContainer);
                setTimeout(() => { try { starsContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(starTick);
            break; }
          
          // Hypnosis
          case 31: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'HYPNOTIZED!', 0x9932CC);
            
            // Create hypnotic spiral effect
            const spiralContainer = new Container();
            const spirals: Graphics[] = [];
            
            for (let i = 0; i < 3; i++) {
              const spiral = new Graphics();
              spiral.lineStyle(3, i % 2 === 0 ? 0x9932CC : 0xFFFFFF, 0.6);
              
              // Draw spiral
              let prevX = 0, prevY = 0;
              for (let j = 0; j < 50; j++) {
                const angle = j * 0.3;
                const radius = j * 0.8;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (j === 0) {
                  spiral.moveTo(x, y);
                } else {
                  spiral.lineTo(x, y);
                }
                prevX = x;
                prevY = y;
              }
              
              spirals.push(spiral);
              spiralContainer.addChild(spiral);
            }
            
            spiralContainer.position.set(tpos.x, tpos.y - 30);
            scene.addChild(spiralContainer);
            
            // Animate spirals
            let spiralTime = 0;
            const spiralTick = (tk: any) => {
              spiralTime += (tk.deltaMS || 16.7) * 0.002;
              
              spirals.forEach((spiral, i) => {
                spiral.rotation = spiralTime * (i % 2 === 0 ? 1 : -1);
                spiral.scale.set(0.5 + Math.sin(spiralTime * 2) * 0.2);
                spiral.alpha = 0.3 + Math.sin(spiralTime * 3 + i) * 0.3;
              });
              
              spiralContainer.scale.set(1 + Math.sin(spiralTime * 2) * 0.1);
              
              if (spiralTime > Math.PI * 2) {
                app.ticker.remove(spiralTick);
                scene.removeChild(spiralContainer);
                setTimeout(() => { try { spiralContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(spiralTick);
            break; }
          
          // Flashbang
          case 32: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'BLINDED!', 0xFFFFFF);
            
            // Create flash effect
            const flash = new Graphics();
            flash.beginFill(0xFFFFFF, 1);
            flash.drawRect(0, 0, W, H);
            flash.endFill();
            ui.addChild(flash);
            
            // Fade out flash
            let flashTime = 0;
            const flashTick = (tk: any) => {
              flashTime += tk.deltaMS || 16.7;
              flash.alpha = Math.max(0, 1 - flashTime / 200);
              
              if (flashTime > 200) {
                app.ticker.remove(flashTick);
                ui.removeChild(flash);
                setTimeout(() => { try { flash.destroy(); } catch {} }, 0);
              }
            };
            addTick(flashTick);
            break; }
          
          // Poison / Treat (healing)
          case 33: case 34: {
            const isPoison = a === 33;
            const targetPos = getPos(tgt.node);
            
            // Create particle effect
            const particlesContainer = new Container();
            const particles: {g: Graphics, vx: number, vy: number, life: number}[] = [];
            
            // Create particles
            for (let i = 0; i < 20; i++) {
              const particle = new Graphics();
              particle.beginFill(isPoison ? 0x00FF00 : 0xFF69B4, 0.8);
              particle.drawCircle(0, 0, 2 + Math.random() * 2);
              particle.endFill();
              
              particles.push({
                g: particle,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                life: 1
              });
              
              particlesContainer.addChild(particle);
            }
            
            particlesContainer.position.set(targetPos.x, targetPos.y);
            scene.addChild(particlesContainer);
            
            floatText(targetPos.x, targetPos.y, isPoison ? 'POISONED!' : 'HEALED!', isPoison ? 0x00FF00 : 0xFF69B4);
            
            // Animate particles
            const particleTick = (tk: any) => {
              const dt = (tk.deltaMS || 16.7) * 0.001;
              
              let allDead = true;
              particles.forEach(p => {
                if (p.life > 0) {
                  allDead = false;
                  p.vy += 9.8 * dt; // gravity
                  p.g.x += p.vx;
                  p.g.y += p.vy;
                  p.life -= dt;
                  p.g.alpha = Math.max(0, p.life);
                  p.g.scale.set(p.life);
                }
              });
              
              if (allDead) {
                app.ticker.remove(particleTick);
                scene.removeChild(particlesContainer);
                setTimeout(() => { try { particlesContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(particleTick);
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

      // Start play after a small delay to ensure everything is initialized
      setTimeout(() => {
        if (!disposed) {
          play();
        }
      }, 100);
    };

    run();

    return () => {
      disposed = true;
      
      // Restore original console.error
      console.error = originalError;
      
      // Stop ticker first to prevent any new renders
      try { 
        if (app && app.ticker) {
          app.ticker.stop();
          removeAllTicks();
        }
      } catch {}
      
      // Clear timeouts
      try { clearAllTimeouts(); } catch {}
      
      // Defer all cleanup to next frame to avoid batcher errors
      setTimeout(() => {
        // Pause any background videos
        try {
          for (const spr of mediaSprites) {
            const v = (spr.texture as any)?.baseTexture?.resource?.source as HTMLVideoElement | undefined;
            try { v?.pause?.(); } catch {}
            try { v?.removeAttribute?.('src'); v?.load?.(); } catch {}
          }
        } catch {}
        // Clean up debug vectors
        try {
          debugVectorsRef.current.length = 0;
        } catch {}
        
        // Clean up app and canvas
        try {
          if (app) {
            const canvas = app.canvas as HTMLCanvasElement | undefined;
            if (canvas && canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
            app.destroy(true);
          }
        } catch {}
        
        if (appRef.current === app) appRef.current = null;
      }, 100); // Longer delay to ensure render is complete
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























