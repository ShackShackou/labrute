/* eslint-disable unicode-bom, quotes, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-len, lines-between-class-members, one-var, one-var-declaration-per-line, no-empty, comma-spacing, space-infix-ops, key-spacing, arrow-spacing, arrow-parens, object-curly-spacing, block-spacing, space-before-function-paren, default-case, no-promise-executor-return, @typescript-eslint/no-floating-promises */
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { FightGetResponse } from '@labrute/core';
// @ts-ignore
import { SpinePlugin } from '@esotericsoftware/spine-phaser';

type Props = { fight: FightGetResponse | null };

const PhaserFight: React.FC<Props> = ({ fight }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || !fight) return;

    if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 500,
      height: 300,
      backgroundColor: '#202428',
      scale: { mode: Phaser.Scale.NONE },
      plugins: { scene: [{ key: 'SpinePlugin', plugin: SpinePlugin, mapping: 'spine' }] },
      scene: [new FightScene(fight)],
    } as any;

    gameRef.current = new Phaser.Game(config);

    return () => { if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; } };
  }, [fight]);

  return <div ref={containerRef} />;
};

export default PhaserFight;

class FightScene extends Phaser.Scene {
  private fight: FightGetResponse;
  private left: any; private right: any; private ui!: Phaser.GameObjects.Text;
  constructor(fight: FightGetResponse) { super('FightScene'); this.fight = fight; }
  preload() {
    this.ui = this.add.text(250, 12, 'Phaser Renderer', { color: '#ccc', fontSize: '12px' }).setOrigin(0.5,0);
    try {
      // Background(s) from /backgrounds (synced from repo root \backgrounds)
      const base = String(((this.fight as any)?.background ?? 'background')).split('.')[0];
      this.load.image('bgPng', `/backgrounds/${base}.png`);
      this.load.image('bgJpg', `/backgrounds/${base}.jpg`);
      // Charge les assets Spine 4.2 (json 4.2 + atlas mono-page)
      // @ts-ignore
      this.load.spineJson('spineboy42-data', '/assets/spine/spineboy-pro.json');
      // @ts-ignore
      this.load.spineAtlas('spineboy42-atlas', '/assets/spine/spineboy.atlas');
    } catch {}
  }
  create() {
    const W = this.scale.width; const H = this.scale.height;
    // Place background if available
    try {
      let bgObj: Phaser.GameObjects.Image | null = null;
      if (this.textures.exists('bgPng')) { bgObj = this.add.image(0, 0, 'bgPng').setOrigin(0,0); }
      else if (this.textures.exists('bgJpg')) { bgObj = this.add.image(0, 0, 'bgJpg').setOrigin(0,0); }
      if (bgObj) { bgObj.setDisplaySize(W, H).setDepth(-10); }
    } catch {}
    const makeSpine = () => {
      try {
        // @ts-ignore
        const L = this.add.spine(W*0.25, H*0.75, 'spineboy42-data', 'spineboy42-atlas');
        // @ts-ignore
        const R = this.add.spine(W*0.75, H*0.75, 'spineboy42-data', 'spineboy42-atlas');
        const s = 0.28; L.setScale(s,s); R.setScale(-s,s);
        return { L,R };
      } catch { return null; }
    };
    const sp = makeSpine();
    if (sp) {
      this.left = { node: sp.L, baseX: sp.L.x, baseY: sp.L.y, type:'spine' };
      this.right= { node: sp.R, baseX: sp.R.x, baseY: sp.R.y, type:'spine' };
    } else {
      const L = this.add.circle(W*0.25, H*0.75, 20, 0x66ccff);
      const R = this.add.circle(W*0.75, H*0.75, 20, 0xff6688);
      this.left = { node: L, baseX: L.x, baseY: L.y, type:'circle' };
      this.right= { node: R, baseX: R.x, baseY: R.y, type:'circle' };
    }

    const parseArr = (x: any) => { try { return Array.isArray(x) ? x : JSON.parse(x); } catch { return []; } };
    const steps: any[] = parseArr(this.fight.steps);

    const mkBar = (obj:any, side:'L'|'R') => {
      const barW = 160, barH=7; const isL = side==='L';
      const bg = this.add.rectangle(obj.node.x, obj.node.y-50, barW, barH, 0x333333).setOrigin(0.5);
      const fg = this.add.rectangle(isL? obj.node.x-barW/2 : obj.node.x+barW/2, obj.node.y-50, barW, barH, 0x3ad66f).setOrigin(isL?0:1,0.5);
      return { set:(ratio:number)=>{ fg.width = barW*Math.max(0,Math.min(1,ratio)); fg.fillColor = ratio<0.3?0xd64545:0x3ad66f; }, follow:()=>{ bg.x=obj.node.x; bg.y=obj.node.y-50; fg.x=isL? obj.node.x-barW/2: obj.node.x+barW/2; fg.y=obj.node.y-50; } };
    };
    const fighters: any[] = parseArr(this.fight.fighters);
    // Build index -> fighter map (steps use fighter.index, not array position)
    const byIndex = new Map<number, any>();
    for (const f of fighters) { if (typeof f?.index === 'number') byIndex.set(f.index, f); }
    // Main brutes
    const leftMain = fighters.find((f:any) => !f?.master && f?.id === this.fight.brute1Id);
    const rightMain = fighters.find((f:any) => !f?.master && f?.id === this.fight.brute2Id);
    const leftMainIdx = leftMain?.index ?? 1;
    const rightMainIdx = rightMain?.index ?? 2;
    const maxL = leftMain?.maxHp ?? leftMain?.hp ?? 100;
    const maxR = rightMain?.maxHp ?? rightMain?.hp ?? 100;
    let hpL = maxL, hpR = maxR;
    const barL = mkBar(this.left,'L'); const barR = mkBar(this.right,'R'); barL.set(1); barR.set(1);

    const moveTo = (obj:any, x:number, y:number, d=200)=> new Promise<void>(res=>this.tweens.add({targets:obj.node,x,y,duration:d,ease:'Sine.easeInOut',onComplete:()=>res()}));
    const nudge = (obj:any, dx:number, dy:number, d=120)=> new Promise<void>((res)=>{
      const x1 = (obj.node.x as number) + dx; const y1 = (obj.node.y as number) + dy;
      this.tweens.add({ targets: obj.node, x: x1, y: y1, duration: Math.floor(d*0.6), ease:'Sine.easeOut', onComplete: () => {
        this.tweens.add({ targets: obj.node, x: obj.baseX, y: obj.baseY, duration: Math.floor(d*0.4), ease:'Sine.easeIn', onComplete: () => res() });
      }});
    });
    const floatText = (x:number, y:number, txt:string, color='#fff')=>{
      const t = this.add.text(x, y-60, txt, { color, fontSize: '12px' }).setOrigin(0.5);
      this.tweens.add({ targets: t, y: y-80, alpha: 0, duration: 650, ease:'Sine.easeOut', onComplete:()=>t.destroy() });
    };

    const next = async()=>{
      for (const s of steps){
        const a = s.a as number;
        // actor/target by fighter.index
        const actorIdx: number | null = (typeof s.f === 'number') ? s.f : (typeof s.b === 'number' ? s.b : null);
        const targetIdx: number | null = (typeof s.t === 'number') ? s.t : null;
        const actor = actorIdx !== null ? byIndex.get(actorIdx) : undefined;
        const target = targetIdx !== null ? byIndex.get(targetIdx) : undefined;
        const actorSide: 'L'|'R' = actor?.team === 'R' ? 'R' : 'L';
        const targetSide: 'L'|'R' | null = target ? (target.team === 'R' ? 'R' : 'L') : null;
        const src = actorSide === 'L' ? this.left : this.right;
        const tgt = targetSide ? (targetSide === 'L' ? this.left : this.right) : (src === this.left ? this.right : this.left);

        switch (a) {
          // Arrive
          case 2: {
            // Could add small fade-in for first arrive of mains
            break;
          }
          // Move
          case 15: {
            if (src && tgt){
              const toward = (tgt.node.x as number) + (src===this.left? +40 : -40);
              const dy = tgt.node.y as number;
              if (src.type==='spine') { try{ (src.node as any).animationState.setAnimation(0,'walk',true);}catch{} }
              await moveTo(src, toward, dy, 220);
              if (src.type==='spine') { try{ (src.node as any).animationState.setAnimation(0,'idle',true);}catch{} }
            }
            break;
          }
          // AttemptHit
          case 19: {
            if (src) { await nudge(src, src===this.left? +18 : -18, -4, 140); }
            break;
          }
          // Hit / FlashFlood / Hammer / Poison
          case 9: case 10: case 11: case 12: {
            const dmg = s.d ?? s.damage ?? 0;
            // Only reflect on main bars when main brute is targeted
            if (targetIdx === leftMainIdx) { hpL = Math.max(0, hpL - dmg); barL.set(hpL / maxL); }
            if (targetIdx === rightMainIdx){ hpR = Math.max(0, hpR - dmg); barR.set(hpR / maxR); }
            this.cameras.main.shake(60, 0.004);
            if (src) await moveTo(src, src.baseX, src.baseY, 150);
            break;
          }
          // Block / Evade (show quick indicator)
          case 20: { if (tgt) floatText(tgt.node.x, tgt.node.y, 'BLOCK', '#d6d645'); break; }
          case 21: { if (tgt) floatText(tgt.node.x, tgt.node.y, 'DODGE', '#d6d645'); break; }
          // MoveBack
          case 17: {
            if (src) { await moveTo(src, src.baseX, src.baseY, 180); }
            break;
          }
          // Death
          case 24: {
            const diedIdx = actorIdx;
            if (diedIdx === leftMainIdx) { this.left.node.alpha = 0.2; hpL = 0; barL.set(0); }
            if (diedIdx === rightMainIdx){ this.right.node.alpha = 0.2; hpR = 0; barR.set(0); }
            break;
          }
          // End
          case 26: {
            return;
          }
          default:
            break;
        }
        barL.follow(); barR.follow();
        await new Promise(res=>this.time.delayedCall(Math.max(60, Math.min(260, s.dt ?? 120)), res));
      }
    };

    next();
  }
}

