/* eslint-disable no-void */
import { randomBetween, SkillId } from '@labrute/core';
import { Application, AnimatedSprite, Graphics } from 'pixi-legacy';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { AnimationFighter } from './findFighter';
import getHitDistance from './getHitDistance';

const playDustEffect = (
  app: Application,
  fighter: AnimationFighter,
  speed: React.MutableRefObject<number>,
  offset: number = 0,
) => {
  const spritesheet = app.loader.resources['/images/game/misc.json']?.spritesheet;
  if (!spritesheet) {
    throw new Error('Spritesheet not found');
  }

  // Create dust sprite
  const dustSprite = new AnimatedSprite(spritesheet.animations.dust || []);
  dustSprite.animationSpeed = speed.current / 2;
  dustSprite.loop = false;

  // Set dust sprite position to the feet of fighter
  dustSprite.x = fighter.animation.container.x + (fighter.team === 'L' ? -offset : offset);
  dustSprite.y = fighter.animation.container.y + 5;
  dustSprite.zIndex = fighter.animation.container.zIndex - 1;

  // Add dust sprite to stage
  app.stage.addChild(dustSprite);

  // Destroy dust sprite when animation ends
  dustSprite.onComplete = () => {
    dustSprite.destroy();
  };

  // Play dust
  dustSprite.play();
};

const playHitEffect = (
  app: Application,
  fighter: AnimationFighter,
  target: AnimationFighter,
  speed: React.MutableRefObject<number>,
  VFX?: string,
) => {
  if (!app.loader) {
    return;
  }
  const spritesheet = app.loader.resources['/images/game/misc.json']?.spritesheet;

  if (!spritesheet) {
    throw new Error('Spritesheet not found');
  }

  // Dans l'officiel, la plupart des coups standards affichent des étincelles jaunes (impact),
  // alors que le sang est plus rare (ou pour certaines situations). On favorise donc "impact".
  const vfx = VFX
    ? VFX
    : (fighter.type === 'pet' ? 'blood' : `impact-${randomBetween(1, 2)}`);

  // Préparer les frames; si absentes, on bascule sur un fallback graphique
  const frames = (spritesheet.animations as any)?.[vfx]
    || (spritesheet.animations as any)?.['impact-1']
    || (spritesheet.animations as any)?.['impact-2']
    || (spritesheet.animations as any)?.['blood']
    || null;
  let hitVfx: AnimatedSprite | null = null;
  if (frames && (frames as any[]).length) {
    hitVfx = new AnimatedSprite(frames as any);
    hitVfx.zIndex = 1000;
    hitVfx.animationSpeed = speed.current / 4;
    hitVfx.loop = false;
    hitVfx.scale.x = target.team === 'L' ? -1 : 1;
    hitVfx.anchor.set(0.5, 0.5);
  }

  // Teinte jaune et alpha réduit pour éviter les flashs blancs (impact)
  try {
    if (hitVfx && typeof vfx === 'string' && vfx.startsWith('impact')) {
      hitVfx.filters = [new ColorOverlayFilter(0xFFD200, 1)];
      hitVfx.alpha = 0.75;
      hitVfx.animationSpeed = Math.max(0.2, speed.current / 5);
    }
  } catch {}

  const distance = Math.abs(fighter.animation.container.x - target.animation.container.x);
  const hitDistance = getHitDistance(fighter, target);

  const fighterHead = {
    x: fighter.team === 'L'
      ? fighter.animation.container.x + fighter.animation.baseWidth * 0.1
      : fighter.animation.container.x - fighter.animation.baseWidth * 0.1,
    y: fighter.animation.container.y - fighter.animation.baseHeight * 0.55,
  };

  const targetHead = {
    x: target.team === 'L'
      ? target.animation.container.x + target.animation.baseWidth * 0.1
      : target.animation.container.x - target.animation.baseWidth * 0.1,
    y: target.animation.container.y - target.animation.baseHeight * 0.55,
  };

  // If target is smaller than fighter
  let posX: number; let posY: number;
  if (fighter.animation.baseHeight > target.animation.baseHeight
    // or thrown attack
    || distance > hitDistance * 1.2
    // or fighter and target are too close (vampirism, hammer)
    || distance < hitDistance * 0.9) {
    // Set position to target head
    posX = targetHead.x; posY = targetHead.y;
  // Else set position to contact point
  } else {
    posX = targetHead.x; posY = fighterHead.y;
  }
  if (hitVfx) {
    hitVfx.position.set(posX, posY);
    // Add hit VFX to stage
    app.stage.addChild(hitVfx);
  }

  // Fallback/complément: de petites étincelles jaunes (comme l'officiel) mais uniquement
  // quand cela a du sens: critique, ou compétences 'lightningBolt' / 'shock'
  const hasSkill = (id: SkillId) => Array.isArray(fighter.skills) && (fighter.skills as any[]).includes(id as any);
  const enableSparks = (
    (typeof vfx === 'string' && vfx.startsWith('impact')) && (
      hasSkill(SkillId.lightningBolt) || hasSkill(SkillId.shock) || Math.random() < 0.15
    )
  );
  if (enableSparks) {
    const sparksCount = 10;
    for (let i = 0; i < sparksCount; i++) {
      const spark = new Graphics();
      const r = 2 + Math.random() * 1.5;
      try { spark.clear(); } catch {}
      try { spark.beginFill(0xFFD200, 0.95); spark.drawCircle(0, 0, r); spark.endFill(); } catch {}
      spark.position.set(posX, posY);
      // @ts-ignore
      spark.zIndex = 1001;
      app.stage.addChild(spark);

      // Vitesse radiale aléatoire
      const ang = Math.random() * Math.PI * 2;
      const speedPx = 1.5 + Math.random() * 2.0;
      const vx = Math.cos(ang) * speedPx;
      const vy = Math.sin(ang) * speedPx * 0.6; // un peu aplati verticalement

      let t = 0;
      const life = 220 + Math.random() * 140;
      const tick = (tk: any) => {
        const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
        t += dm;
        spark.x += vx * (dm / 16.7);
        spark.y += vy * (dm / 16.7);
        const p = Math.min(1, t / life);
        spark.alpha = Math.max(0, 1 - p);
        if (p >= 1) {
          app.ticker.remove(tick);
          try { app.stage.removeChild(spark); } catch {}
          try { spark.destroy(); } catch {}
        }
      };
      app.ticker.add(tick);
    }
  }

  // Destroy hit VFX when animation is finished
  if (hitVfx) {
    hitVfx.onComplete = () => {
      hitVfx?.destroy();
    };
    // Play hit VFX
    hitVfx.play();
  }
};

export { playDustEffect, playHitEffect };
