import Phaser from 'phaser';
import { CombatEngine } from '../engine/CombatEngine.js';

// Combat scene powered by CombatEngine, rendering fighters with Spine
export class FightSceneSpine extends Phaser.Scene {
  constructor() { super({ key: 'FightSpine' }); }

  preload() {
    this.load.spineJson('spineboy-data', 'assets/spine/spineboy-pro.json');
    this.load.spineAtlas('spineboy-atlas', 'assets/spine/spineboy.atlas');
  }

  create() {
    // Camera baseline
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0, 0, 1024, 768);

    // Background
    const bg = this.add.image(512, 384, 'background');
    bg.setScale(2.2).setDepth(-10);

    // Combat zone like original
    this.setupCombatZone();

    const baseScale = 0.30; // slightly smaller again

    // Initial free positions
    const leftBaseX = Phaser.Math.Between(this.combatZone.leftMinX, this.combatZone.leftMaxX);
    const leftBaseY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
    const rightBaseX = Phaser.Math.Between(this.combatZone.rightMinX, this.combatZone.rightMaxX);
    const rightBaseY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);

    // Create fighters
    const left = this.add.spine(leftBaseX, leftBaseY, 'spineboy-data', 'spineboy-atlas');
    const sL = baseScale * this.getFighterScale(leftBaseY);
    const right = this.add.spine(rightBaseX, rightBaseY, 'spineboy-data', 'spineboy-atlas');
    const sR = baseScale * this.getFighterScale(rightBaseY);

    // Harmonize sizes using smallest
    const ref = Math.min(Math.abs(sL), Math.abs(sR));
    left.setScale(ref, ref);
    right.setScale(-ref, ref);

    // Shadows
    const shadowL = this.add.ellipse(leftBaseX, leftBaseY + this.getShadowOffset(leftBaseY), 100 * this.getShadowScale(leftBaseY), 25 * this.getShadowScale(leftBaseY), 0x000000, 0.35);
    const shadowR = this.add.ellipse(rightBaseX, rightBaseY + this.getShadowOffset(rightBaseY), 100 * this.getShadowScale(rightBaseY), 25 * this.getShadowScale(rightBaseY), 0x000000, 0.35);

    // Idle anims
    this.setSpineAnim(left, 'idle', true);
    this.setSpineAnim(right, 'idle', true);

    // Fighters for engine
    this.fighter1 = { sprite: left, shadow: shadowL, side: 'left', scene: this, baseX: leftBaseX, baseY: leftBaseY, baseScale };
    this.fighter2 = { sprite: right, shadow: shadowR, side: 'right', scene: this, baseX: rightBaseX, baseY: rightBaseY, baseScale };

    // Stats (quick defaults)
    this.fighter1.stats = { name: 'Brute Alpha', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, strength: 20, defense: 10, agility: 15, speed: 12, initiative: 0, baseInitiative: 1, counter: 0, combo: 0 };
    this.fighter2.stats = { name: 'Brute Beta',  health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, strength: 20, defense: 10, agility: 15, speed: 12, initiative: 0, baseInitiative: 1, counter: 0, combo: 0 };

    // Depths
    this.updateDepthOrdering();

    // UI
    this.ui = this.createSimpleUI();
    this.appendLog('Combat prêt.');

    // Engine
    this.engine = new CombatEngine(this.fighter1, this.fighter2);

    // Start loop
    this.time.delayedCall(200, () => this.executeTurn());
  }

  setSpineAnim(spineObj, name, loop=false) {
    try { spineObj.animationState.setAnimation(0, name, loop); } catch(e) {}
  }

  // Anim helpers
  playIdle(f) { this.setSpineAnim(f.sprite, 'idle', true); }
  playRun(f) { this.setSpineAnim(f.sprite, 'walk', true); }
  playAttack(f) { this.setSpineAnim(f.sprite, 'walk', false); this.time.delayedCall(180, () => this.playIdle(f)); }
  playDodge(f) {
    const dir = f.side === 'left' ? -140 : 140;
    this.playRun(f);
    this.tweens.add({ targets: f.sprite, x: f.sprite.x + dir, yoyo: true, duration: 150, ease: 'Power2', onComplete:()=>this.playIdle(f)});
    this.tweens.add({ targets: f.shadow, x: f.shadow.x + dir, yoyo: true, duration: 150, ease: 'Power2' });
  }
  playBlock(f) { this.tweens.add({ targets: f.sprite, scaleY: Math.abs(f.sprite.scaleY)*0.9, duration: 80, yoyo: true, ease: 'Sine.easeInOut' }); }
  playEvadeTick(f) {
    // quick side hop to signal miss reaction
    const dir = f.side === 'left' ? -16 : 16;
    this.tweens.add({ targets: f.sprite, x: f.sprite.x + dir, duration: 70, yoyo: true, ease: 'Power2' });
    if (f.shadow) this.tweens.add({ targets: f.shadow, x: f.shadow.x + dir, duration: 70, yoyo: true, ease: 'Power2' });
  }

  // FX helpers
  shakeLight() { this.cameras.main.shake(70, 0.0035); }
  shakeMedium() { this.cameras.main.shake(110, 0.007); }
  shakeTarget(target) { this.tweens.add({ targets: target.sprite, x: target.sprite.x + (target.side==='left'? -10:10), duration: 34, yoyo: true, repeat: 1 }); }
  flashSpine(spineObj, color={r:1,g:0.6,b:0.6,a:1}, duration=100) {
    try { const o = { ...spineObj.skeleton.color }; spineObj.skeleton.color.set(color.r,color.g,color.b,color.a); this.time.delayedCall(duration,()=>spineObj.skeleton.color.set(o.r,o.g,o.b,o.a)); }
    catch(_) { const g=this.add.graphics(); g.fillStyle(0xffffff,0.25); g.fillRect(spineObj.x-60, spineObj.y-140, 120, 160); this.tweens.add({ targets:g, alpha:0, duration, onComplete:()=>g.destroy() }); }
  }
  // Hit-stop for extra punch
  async hitStop(slow=0.35, ms=80) {
    const prevTime = this.time.timeScale; const prevTween = this.tweens.timeScale;
    this.time.timeScale = slow; this.tweens.timeScale = slow;
    // Slow Spine anims too
    const fighters = [this.fighter1, this.fighter2].filter(Boolean);
    const prevAnim = fighters.map(f => f.sprite?.animationState?.timeScale ?? 1);
    fighters.forEach(f => { if (f.sprite?.animationState) f.sprite.animationState.timeScale = slow; });
    await new Promise(res => this.time.delayedCall(ms, res));
    this.time.timeScale = prevTime; this.tweens.timeScale = prevTween;
    fighters.forEach((f,i) => { if (f.sprite?.animationState) f.sprite.animationState.timeScale = prevAnim[i] ?? 1; });
  }
  showTextIndicator(target, text, color='#ffffff') {
    const t = this.add.text(target.sprite.x, target.sprite.y - 128, text, { fontSize: '36px', color, stroke:'#000', strokeThickness:7 }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({ targets: t, y: t.y - 48, alpha: 0, duration: 620, ease: 'Power2', onComplete:()=>t.destroy() });
  }
  showMissEffect(target) { this.showTextIndicator(target, 'MISS', '#cfcfcf'); }
  createDodgeIndicator(target) { this.showTextIndicator(target, 'DODGE', '#4ec3ff'); }
  showBlockIndicator(target) { this.showTextIndicator(target, 'BLOCK', '#ffd54a'); this.shakeLight(); }

  // Small helpers to sequence tweens and avoid overlaps
  sleep(ms) { return new Promise(res => this.time.delayedCall(ms, res)); }
  killFighterTweens(f) { this.tweens.killTweensOf(f.sprite); if (f.shadow) this.tweens.killTweensOf(f.shadow); }
  moveFighterTo(f, x, y, duration, ease='Linear') {
    this.killFighterTweens(f);
    const p1 = new Promise(res => this.tweens.add({ targets: f.sprite, x, y, duration, ease, onComplete: res }));
    const sScale = this.getShadowScale(y);
    const p2 = f.shadow ? new Promise(res => this.tweens.add({ targets: f.shadow, x, y: y + this.getShadowOffset(y), scaleX: sScale, scaleY: sScale, duration, ease, onComplete: res })) : Promise.resolve();
    return Promise.all([p1, p2]);
  }
  // Estimate half width in pixels for spacing (fallback constant scaled by sprite scale)
  estimateHalfWidth(f) {
    const sx = Math.abs(f.sprite.scaleX || 1);
    return Math.max(24, 100 * sx); // ~200px base width -> half 100
  }
  getContactGap(attacker, target, margin=12) {
    const halfA = this.estimateHalfWidth(attacker);
    const halfT = this.estimateHalfWidth(target);
    return halfA + halfT + margin;
  }

  async executeTurn() {
    if (this.combatOver) return;
    if (this.turnInProgress) return;
    this.turnInProgress = true;

    let result;
    try {
      result = this.engine.executeTurn();
    } catch (e) {
      console.error('Combat error:', e);
      this.turnInProgress = false;
      await this.sleep(120);
      return this.executeTurn();
    }

    if (!result) { this.turnInProgress = false; await this.sleep(140); return this.executeTurn(); }

    const attacker = result.attacker; const target = result.target;

    if (result.type === 'attack' || result.type === 'multi_attack' || result.type === 'counter') {
      this.appendLog(`${attacker.stats.name} attaque ${target.stats.name}${result.type==='multi_attack'?' (combo)':''}${result.critical?' [CRIT]':''}${result.hit?` et inflige ${result.damage}`:" mais rate"}`);

      // Compute explicit, non-overlapping contact using estimated widths
      const contactGap = this.getContactGap(attacker, target, 14);
      const contactYOffset = attacker.side === 'left' ? 8 : -8; // slight Y stagger to avoid vertical stack
      const contactY = Phaser.Math.Clamp(target.sprite.y + contactYOffset, this.combatZone.minY, this.combatZone.maxY);
      const attackX = target.sprite.x + (attacker.side === 'left' ? -contactGap : contactGap);
      const distance = Math.abs(attackX - attacker.sprite.x);
      const runDuration = Phaser.Math.Clamp(distance * 0.52, 75, 230);

      this.playRun(attacker);
      await this.moveFighterTo(attacker, attackX, contactY, runDuration, 'Linear');

      if (result.hit && result.damage > 0) {
        await this.hitStop(0.3, 70);
        this.flashSpine(target.sprite);
        // Apply immediate HP change and UI sync before FX so bar matches hit
        this.updateUI();
        // Red tint on hit
        try {
          const old = { ...target.sprite.skeleton.color };
          target.sprite.skeleton.color.set(1,0.4,0.4,1);
          this.time.delayedCall(120,()=> target.sprite.skeleton.color.set(old.r,old.g,old.b,old.a));
        } catch(_) {}

        this.shakeTarget(target);
        this.shakeMedium();
        // Extra small radial blood splash
        const g2 = this.add.graphics();
        g2.fillStyle(0xff2a2a, 0.45);
        g2.fillCircle(target.sprite.x + (target.side==='left'?-5:5), target.sprite.y - 46, 6);
        this.tweens.add({targets:g2, alpha:0, scale:2.2, duration:320, onComplete:()=>g2.destroy()});

        this.showDamageNumber(target, result.damage, !!result.critical);
      } else if (result.type !== 'dodge') {
        // Early MISS indicator + tiny reaction hop to avoid delay feeling
        this.showMissEffect(target);
        this.playEvadeTick(target);
      }

      this.playAttack(attacker);
      // even shorter stick time at contact
      await this.sleep(60);
      await this.returnToPosition(attacker);

    } else if (result.type === 'block') {
      this.appendLog(`${target.stats.name} bloque l'attaque de ${attacker.stats.name}`);
      this.playBlock(target);
      this.showBlockIndicator(target);
      await this.sleep(120);
    } else if (result.type === 'dodge') {
      this.appendLog(`${target.stats.name} esquive l'attaque de ${attacker.stats.name}`);
      this.playDodge(target);
      this.createDodgeIndicator(target);
      await this.sleep(150);
    } else if (result.type === 'throw') {
      this.appendLog(`${attacker.stats.name} lance une arme sur ${target.stats.name}${result.hit?` et inflige ${result.damage}`:" mais rate"}`);
      if (result.hit && result.damage>0) { this.flashSpine(target.sprite); this.shakeMedium(); this.showDamageNumber(target, result.damage, !!result.critical); }
      else { this.showMissEffect(target); }
      await this.sleep(120);
    } else if (result.type === 'special') {
      this.appendLog(`${attacker.stats.name} utilise une capacité spéciale !`);
      this.cameras.main.shake(130, 0.004);
      await this.sleep(140);
    }

    this.updateUI();
    if (result.gameOver) {
      this.combatOver = true;
      this.add.text(512, 120, `${result.winner.stats.name} wins!`, { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
      return; // no next turn
    }

    this.turnInProgress = false;
    await this.sleep(160);
    return this.executeTurn();
  }

  // No-op indicators for engine hooks
  showDodgeChanceIndicator(defender, dodgeChance, dodgeAttempted, dodgeSuccess) {}
  showBlockChanceIndicator(defender, blockChance, blockAttempted, blockSuccess, hasStamina) {}

  // Layout helpers
  setupCombatZone() {
    this.combatZone = { minY: 420, maxY: 580, leftMinX: 100, leftMaxX: 300, rightMinX: 724, rightMaxX: 924, centerX: 512 };
  }
  getFighterScale(y) { const n = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY); return 0.8 + (n * 0.4); }
  getShadowScale(y) { const n = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY); return 0.8 + (n * 0.8); }
  getShadowOffset(y) { return 5; }
  updateDepthOrdering() {
    const fighters = [this.fighter1, this.fighter2].filter(Boolean);
    fighters.sort((a,b)=>a.sprite.y-b.sprite.y);
    const base = 100; fighters.forEach((f,i)=>{ f.sprite.setDepth(base+i*10); if (f.shadow) f.shadow.setDepth(base-10); });
  }

  // Return to base position with optional free reposition, syncing shadow & scale
  async returnToPosition(fighter) {
    const shouldChange = Math.random() < 0.4;
    let targetX = fighter.baseX;
    let targetY = fighter.baseY;
    if (shouldChange) {
      const minX = fighter.side === 'left' ? this.combatZone.leftMinX : this.combatZone.rightMinX;
      const maxX = fighter.side === 'left' ? this.combatZone.leftMaxX : this.combatZone.rightMaxX;
      targetX = Phaser.Math.Between(minX, maxX);
      targetY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
      fighter.baseX = targetX; fighter.baseY = targetY;
    }
    const dist = Math.abs(targetX - fighter.sprite.x);
    const duration = Math.max(120, (dist / 800) * 1000);
    await this.moveFighterTo(fighter, targetX, targetY, duration, 'Power2');
    this.playIdle(fighter);
    this.updateDepthOrdering();
  }

  // UI
  createSimpleUI() {
    const barWidth = 320, barHeight = 26; // larger HP bars
    const f1bg = this.add.rectangle(80, 40, barWidth, barHeight, 0x222222).setOrigin(0,0.5);
    const f1 = this.add.rectangle(80, 40, barWidth, barHeight, 0x00e676).setOrigin(0,0.5).setStrokeStyle(2, 0x000000, 0.8);
    const f2bg = this.add.rectangle(1024-80, 40, barWidth, barHeight, 0x222222).setOrigin(1,0.5);
    const f2 = this.add.rectangle(1024-80, 40, barWidth, barHeight, 0xff5252).setOrigin(1,0.5).setStrokeStyle(2, 0x000000, 0.8);
    const f1t = this.add.text(80, 16, this.fighter1.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(0,0.5);
    const f2t = this.add.text(1024-80, 16, this.fighter2.stats.name, { fontSize:'16px', color:'#fff' }).setOrigin(1,0.5);
    // Combat log area at bottom
    this.logBox = this.add.rectangle(512, 740, 960, 44, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.2);
    this.logText = this.add.text(48, 724, '', { fontSize:'16px', color:'#fff' });
    return { f1, f2, f1bg, f2bg, f1t, f2t, w: barWidth };
  }
  appendLog(line) {
    if (!this.logText) return;
    this.logText.setText(line);
  }


  updateUI() {
    const p1 = this.fighter1.stats.health / this.fighter1.stats.maxHealth;
    const p2 = this.fighter2.stats.health / this.fighter2.stats.maxHealth;
    this.ui.f1.width = this.ui.w * Math.max(0, Math.min(1, p1));
    this.ui.f2.width = this.ui.w * Math.max(0, Math.min(1, p2));
  }

  showDamageNumber(target, amount, critical=false) {
    const t = this.add.text(target.sprite.x, target.sprite.y - 80, `${amount}`, { fontSize: critical ? '28px' : '22px', color: critical ? '#ffcc00' : '#ffffff', stroke:'#000', strokeThickness:3 }).setOrigin(0.5).setDepth(2000);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 600, ease: 'Power2', onComplete: () => t.destroy() });
  }
}

