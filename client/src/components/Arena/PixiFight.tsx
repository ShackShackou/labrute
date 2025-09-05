/* eslint-disable unicode-bom, quotes, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-len, lines-between-class-members, one-var, one-var-declaration-per-line, no-empty, comma-spacing, space-infix-ops, key-spacing, arrow-spacing, arrow-parens, object-curly-spacing, block-spacing, space-before-function-paren, default-case, no-promise-executor-return, @typescript-eslint/no-floating-promises */
import React, { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text, Assets } from 'pixi.js';
// @ts-ignore - official Spine v8 runtime for Pixi v8
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { FightGetResponse } from '@labrute/core';

type Props = { fight: FightGetResponse | null };

const W = 500; const H = 300;

const PixiFight: React.FC<Props> = ({ fight }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!containerRef.current || !fight) return undefined;

    if (appRef.current) { appRef.current.destroy(true); appRef.current = null; }

    const app = new Application();
    appRef.current = app;

    const run = async () => {
      await app.init({ width: W, height: H, background: '#202428', antialias: true });
      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);

      const label = new Text('Pixi Renderer (v8 + Spine)', { fill: '#ccc', fontSize: 12 } as any);
      label.position.set(W / 2, 10);
      label.anchor.set(0.5, 0);
      app.stage.addChild(label);

      const scene = new Container();
      app.stage.addChild(scene);

      const makeCircle = (x:number, y:number, color:number) => {
        const g = new Graphics();
        g.beginFill(color).drawCircle(0, 0, 20).endFill();
        g.position.set(x, y);
        scene.addChild(g);
        return g;
      };

      let left: any = { node: makeCircle(W * 0.25, H * 0.75, 0x66ccff), baseX: W * 0.25, baseY: H * 0.75, type: 'circle' };
      let right: any = { node: makeCircle(W * 0.75, H * 0.75, 0xff6688), baseX: W * 0.75, baseY: H * 0.75, type: 'circle' };

      try {
        Assets.add({ alias: 'spineboyData', src: '/assets/spine/spineboy-pro.json' });
        Assets.add({ alias: 'spineboyAtlas', src: '/assets/spine/spineboy-pro.atlas' });
        await Assets.load(['spineboyData', 'spineboyAtlas']);
        const L = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 0.28 });
        L.x = W * 0.25; L.y = H * 0.75; scene.addChild(L);
        const R = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 0.28 });
        R.x = W * 0.75; R.y = H * 0.75; (R.scale as any).x = -0.28; scene.addChild(R);
        try { L.state.setAnimation(0, 'idle', true); } catch {}
        try { R.state.setAnimation(0, 'idle', true); } catch {}
        left = { node: L, baseX: L.x, baseY: L.y, type: 'spine' };
        right = { node: R, baseX: R.x, baseY: R.y, type: 'spine' };
      } catch {
        // keep circles fallback if assets/runtimes unavailable
      }

      const mkBar = (obj:any, side:'L'|'R') => {
        const barW = 160, barH=7; const isL = side==='L';
        const bg = new Graphics(); bg.beginFill(0x333333).drawRect(0, 0, barW, barH).endFill();
        const fg = new Graphics(); fg.beginFill(0x3ad66f).drawRect(0, 0, barW, barH).endFill();
        const cont = new Container();
        cont.addChild(bg, fg);
        const pos = 'position' in obj.node ? obj.node.position : obj.node;
        cont.position.set(pos.x - (isL ? barW/2 : -barW/2), pos.y - 50);
        scene.addChild(cont);
        const set = (ratio:number) => {
          const r = Math.max(0, Math.min(1, ratio));
          fg.clear();
          fg.beginFill(r < 0.3 ? 0xd64545 : 0x3ad66f).drawRect(0, 0, barW * r, barH).endFill();
          fg.position.set(0,0);
        };
        const follow = () => {
          const p = 'position' in obj.node ? obj.node.position : obj.node;
          cont.position.set(p.x - (isL ? barW/2 : -barW/2), p.y - 50);
        };
        return { set, follow };
      };

      const parseArr = (x: any) => { try { return Array.isArray(x) ? x : JSON.parse(x); } catch { return []; } };
      const steps: any[] = parseArr(fight.steps);
      const fighters: any[] = parseArr(fight.fighters);

      const byIndex = new Map<number, any>();
      for (const f of fighters) { if (typeof f?.index === 'number') byIndex.set(f.index, f); }
      const leftMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute1Id);
      const rightMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute2Id);
      const leftMainIdx = leftMain?.index ?? 1;
      const rightMainIdx = rightMain?.index ?? 2;
      const maxL = leftMain?.maxHp ?? leftMain?.hp ?? 100;
      const maxR = rightMain?.maxHp ?? rightMain?.hp ?? 100;
      let hpL = maxL, hpR = maxR;
      const barL = mkBar(left,'L'); const barR = mkBar(right,'R'); barL.set(1); barR.set(1);

      // Small helpers
      const playAnim = (obj:any, name:string, loop=true) => {
        if (obj?.type === 'spine') {
          try { (obj.node as any).state.setAnimation(0, name, loop); } catch {}
        }
      };
      const floatText = (x:number, y:number, txt:string, color=0xffffff) => {
        const t = new Text(txt, { fill: color as any, fontSize: 12 } as any);
        t.anchor.set(0.5);
        t.position.set(x, y - 60);
        scene.addChild(t);
        let a = 0;
        const tick = (tk:any) => {
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          a += dm; t.alpha = Math.max(0, 1 - a / 650);
          t.y = (y - 60) - (a / 32);
          if (a >= 650) { app.ticker.remove(tick); t.destroy(); }
        };
        app.ticker.add(tick);
      };
      const shake = (mag=2, dur=120) => new Promise<void>((resolve) => {
        const baseX = scene.x; const baseY = scene.y; let t=0;
        const tick = (tk:any) => {
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
          const p = Math.min(1, t / dur);
          scene.x = baseX + (Math.random()*2-1) * mag * (1-p);
          scene.y = baseY + (Math.random()*2-1) * mag * (1-p);
          if (p>=1){ app.ticker.remove(tick); scene.x=baseX; scene.y=baseY; resolve(); }
        };
        app.ticker.add(tick);
      });

      const getPos = (o:any) => ({ x: (o?.position?.x ?? o?.x) as number, y: (o?.position?.y ?? o?.y) as number });
      const setPos = (o:any, x:number, y:number) => { if ('position' in o) { o.position.set(x,y); } else { o.x = x; o.y = y; } };

      const tweenTo = (obj: any, x:number, y:number, duration=200) => new Promise<void>((resolve) => {
        const { x: startX, y: startY } = getPos(obj);
        const dx = x - startX; const dy = y - startY;
        let t = 0; const total = Math.max(1, duration);
        const tick = (tk: any) => {
          const deltaMS = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          t += deltaMS;
          const p = Math.min(1, t / total);
          setPos(obj, startX + dx * p, startY + dy * p);
          barL.follow(); barR.follow();
          if (p >= 1) { app.ticker.remove(tick); resolve(); }
        };
        app.ticker.add(tick);
      });

      const delay = (ms:number) => new Promise<void>((res)=>{ setTimeout(()=>res(), ms); });

      const play = async () => {
        for (const s of steps) {
          const a = s.a as number;
          const actorIdx: number | null = (typeof s.f === 'number') ? s.f : (typeof s.b === 'number' ? s.b : null);
          const targetIdx: number | null = (typeof s.t === 'number') ? s.t : null;
          const actor = actorIdx !== null ? byIndex.get(actorIdx) : undefined;
          const target = targetIdx !== null ? byIndex.get(targetIdx) : undefined;
          const actorSide: 'L'|'R' = actor?.team === 'R' ? 'R' : 'L';
          const targetSide: 'L'|'R' | null = target ? (target.team === 'R' ? 'R' : 'L') : null;
          const src = actorSide === 'L' ? left : right;
          const tgt = targetSide ? (targetSide === 'L' ? left : right) : (src === left ? right : left);

        switch (a) {
          // Arrive
          case 2: { break; }
          // Move
          case 15: {
            playAnim(src, 'walk', true);
            const tpos = getPos(tgt.node);
            await tweenTo(src.node, tpos.x + (src===left? +40 : -40), tpos.y, 220);
            playAnim(src, 'idle', true);
            break; }
          // AttemptHit
          case 19: {
            playAnim(src, 'shoot', false);
            await tweenTo(src.node, src.baseX + (src===left? +18 : -18), src.baseY - 4, 120);
            await tweenTo(src.node, src.baseX, src.baseY, 80);
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
            await tweenTo(src.node, src.baseX, src.baseY, 120);
            playAnim(src, 'idle', true);
            break; }
          // MoveBack
          case 17: { await tweenTo(src.node, src.baseX, src.baseY, 180); playAnim(src, 'idle', true); break; }
          // Death
          case 24: {
            const diedIdx = actorIdx;
            if (diedIdx === leftMainIdx) { left.node.alpha = 0.2; hpL = 0; barL.set(0); playAnim(left, 'death', false); }
            if (diedIdx === rightMainIdx){ right.node.alpha = 0.2; hpR = 0; barR.set(0); playAnim(right, 'death', false); }
            break; }
          // End
          case 26: { return; }
        }
        await delay(Math.max(60, Math.min(260, s.dt ?? 120)));
        }
      };

      play();
    };

    run();

    return () => {
      if (appRef.current) { appRef.current.destroy(true); appRef.current = null; }
    };
  }, [fight]);

  return <div ref={containerRef} />;
};

export default PixiFight;
