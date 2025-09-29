/* eslint-disable no-void */
import { ArriveStep, WeaponById } from '@labrute/core';
import { Easing } from 'pixi-tweener';
import { Application } from 'pixi-legacy';
import { BossName } from '@labrute/prisma';

import findFighter, { AnimationFighter } from './utils/findFighter';
import { shakeStage } from './utils/stageAnimations';
import { sound } from '@pixi/sound';
import { getRandomPosition } from './utils/fightPositions';
import updateWeapons from './updateWeapons';
import { playDustEffect } from './utils/playVFX';
import { updateShadow, airbornMove } from './utils/updateShadow';
import * as PIXI from 'pixi-legacy';

const arrive = async (
  app: Application,
  fighters: AnimationFighter[],
  step: ArriveStep,
  speed: React.MutableRefObject<number>,
) => {
  if (!app.loader) {
    return;
  }
  const spritesheet = app.loader.resources['/images/game/misc.json']?.spritesheet;

  if (!spritesheet) {
    throw new Error('Spritesheet not found');
  }

  const fighter = findFighter(fighters, step.f);

  if (!fighter) {
    throw new Error('Fighter not found');
  }

  // Equip weapon if needed
  if (typeof step.w !== 'undefined') {
    // Update available weapons
    updateWeapons(app, fighter, step.w, 'remove');

    // Update active weapon
    fighter.animation.weapon = WeaponById[step.w];
  }

  // Get random position
  const { x, y } = getRandomPosition(fighters, fighter);

  fighter.animation.once('arrive:start', () => {
    fighter.animation.pause();
  });
  fighter.animation.setAnimation('arrive');

  // Wait 0.25s before playing arrive SFX
  setTimeout(() => {
    void sound.play('sfx', { sprite: 'arrive' });
  }, 250 / speed.current);

  // Set airborn phase
  fighter.animation.setAirborn(true);

  // Hide shadow
  fighter.animation.shadow.alpha = 0;

  // Set zIndex to front
  fighter.animation.container.zIndex = y + 30;

  // Update shadow to the state from which it will be tweened
  updateShadow(fighter);

  await airbornMove({
    fighter,
    speed,
    duration: 0.5,
    ease: Easing.linear,
    endPosition: { x, y, zIndex: y },
  });

  // Stop airborn phase
  fighter.animation.setAirborn(false);

  const animations = [fighter.animation.waitForEvent('arrive:end')];

  // GroundShake for big bosses
  if (fighter.type === 'boss'
    && (fighter.name === BossName.EmberFang || fighter.name === BossName.GoldClaw)) {
    // Shake 8px for 350 ms
    animations.push(shakeStage(app, speed, 8, 350));
  }

  // Finish the arrive animation
  fighter.animation.play();

  // Dust cloud at arrival
  playDustEffect(app, fighter, speed);

  // Wait for animation to end
  await Promise.all(animations);

  // Set animation to `idle`
  fighter.animation.setAnimation('idle');

  // Attach a small visual shield overlay if the fighter currently has a shield
  try {
    const hasShield = !!fighter.animation.shield;
    const parent = fighter.animation.container;
    if (hasShield && parent) {
      // Cleanup existing overlay
      const prev = parent.children.find((c) => c.name === '__shieldOverlay__');
      if (prev) { try { parent.removeChild(prev); prev.destroy(); } catch {} }

      const overlay = new PIXI.Graphics();
      overlay.name = '__shieldOverlay__';
      // Rounded rectangular shield with subtle highlight
      overlay.lineStyle(2, 0x9ac7ff, 0.9);
      overlay.beginFill(0x3a78b3, 0.25);
      overlay.drawRoundedRect(-16, -26, 32, 44, 10);
      overlay.endFill();
      const edge = new PIXI.Graphics();
      edge.lineStyle(2, 0xffffff, 0.3);
      edge.moveTo(-14, -20); edge.lineTo(14, -20);
      edge.moveTo(-12, -8); edge.lineTo(12, -8);
      overlay.addChild(edge);
      // Position slightly in front depending on side
      const side: 'L'|'R' = fighter.team;
      overlay.position.set(side === 'L' ? 18 : -18, -5);
      // Ensure in front of body
      overlay.zIndex = (parent.zIndex || 0) + 2;
      parent.addChild(overlay);
      try { (parent as any).sortableChildren = true; } catch {}
    }
  } catch {}
};

export default arrive;
