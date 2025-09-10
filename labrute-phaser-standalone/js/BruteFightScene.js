import { StepType, ANIMATION_SPEED, ARENA_WIDTH, ARENA_LEFT, ARENA_RIGHT } from './constants.js';

export class BruteFightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BruteFightScene' });
    this.fighters = [];
    this.steps = [];
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1;
    this.fighterSprites = {};
    this.weaponSprites = {};
    this.healthBars = {};
  }

  preload() {
    // Load fighter placeholder
    this.load.image('fighter', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    // We'll use shapes for now, but this is where we'd load real assets
    // this.load.atlas('fighter', 'assets/fighter.png', 'assets/fighter.json');
  }

  create() {
    // Create arena background
    this.createArena();
    
    // Initialize UI
    this.createUI();
    
    // Listen for external commands
    this.setupEventListeners();
  }

  createArena() {
    // Arena background
    const graphics = this.add.graphics();
    
    // Sky gradient
    const skyGradient = graphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xFFE4B5, 0xFFE4B5, 1);
    graphics.fillRect(0, 0, 800, 300);
    
    // Ground
    graphics.fillStyle(0xD2691E, 1);
    graphics.fillRect(0, 300, 800, 300);
    
    // Arena boundaries
    graphics.lineStyle(3, 0x8B4513, 1);
    graphics.strokeRect(ARENA_LEFT, 250, ARENA_WIDTH, 200);
    
    // Center line
    graphics.lineStyle(1, 0x8B4513, 0.3);
    graphics.lineBetween(400, 250, 400, 450);
  }

  createUI() {
    // Turn indicator
    this.turnText = this.add.text(400, 20, '', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Speed indicator
    this.speedText = this.add.text(750, 20, 'Speed: 1x', {
      fontSize: '14px',
      color: '#ffff00'
    }).setOrigin(1, 0);
  }

  loadFightData(data) {
    console.log('Loading fight data:', data);
    
    this.fighters = data.fighters || [];
    this.steps = data.steps || [];
    this.currentStepIndex = 0;
    this.isPlaying = false;
    
    // Clear existing sprites
    this.clearFighters();
    
    // Create fighter sprites
    this.createFighters();
    
    // Update UI if elements exist
    if (this.turnText) {
      this.updateUI();
    }
  }

  clearFighters() {
    Object.values(this.fighterSprites).forEach(sprite => sprite.destroy());
    Object.values(this.weaponSprites).forEach(sprite => sprite.destroy());
    Object.values(this.healthBars).forEach(bar => {
      bar.bg.destroy();
      bar.fill.destroy();
      bar.text.destroy();
    });
    
    this.fighterSprites = {};
    this.weaponSprites = {};
    this.healthBars = {};
  }

  createFighters() {
    this.fighters.forEach(fighter => {
      const x = fighter.team === 'L' ? ARENA_LEFT + 100 : ARENA_RIGHT - 100;
      const y = 350;
      
      // Create fighter sprite (colored rectangle for now)
      const color = fighter.team === 'L' ? 0xff4444 : 0x4444ff;
      const fighterSprite = this.add.rectangle(x, y, 60, 120, color);
      fighterSprite.setStrokeStyle(2, 0x000000);
      this.fighterSprites[fighter.id] = fighterSprite;
      
      // Store initial position
      fighter.position = x;
      fighter.baseY = y;
      
      // Create health bar
      this.createHealthBar(fighter, x, y - 80);
      
      // Create name label
      this.add.text(x, y - 100, fighter.name, {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Create stats display
      this.add.text(x, y + 80, `STR:${fighter.strength} AGI:${fighter.agility} SPD:${fighter.speed}`, {
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    });
  }

  createHealthBar(fighter, x, y) {
    const barWidth = 80;
    const barHeight = 10;
    
    // Background
    const bg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333);
    bg.setStrokeStyle(1, 0x000000);
    
    // Fill
    const fill = this.add.rectangle(x, y, barWidth - 2, barHeight - 2, 0x00ff00);
    
    // Text
    const text = this.add.text(x, y, `${fighter.hp}/${fighter.maxHp}`, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.healthBars[fighter.id] = { bg, fill, text, maxWidth: barWidth - 2 };
  }

  updateHealthBar(fighterId, newHp) {
    const fighter = this.fighters.find(f => f.id === fighterId);
    if (!fighter) return;
    
    fighter.hp = Math.max(0, newHp);
    
    const healthBar = this.healthBars[fighterId];
    if (!healthBar) return;
    
    // Update fill width
    const percentage = fighter.hp / fighter.maxHp;
    const newWidth = healthBar.maxWidth * percentage;
    
    // Animate health bar
    this.tweens.add({
      targets: healthBar.fill,
      displayWidth: newWidth,
      duration: 300,
      ease: 'Power2'
    });
    
    // Update color
    let color = 0x00ff00;
    if (percentage < 0.25) color = 0xff0000;
    else if (percentage < 0.5) color = 0xffaa00;
    healthBar.fill.setFillStyle(color);
    
    // Update text
    healthBar.text.setText(`${fighter.hp}/${fighter.maxHp}`);
  }

  play() {
    if (this.currentStepIndex >= this.steps.length) {
      this.currentStepIndex = 0;
    }
    this.isPlaying = true;
    this.processNextStep();
  }

  pause() {
    this.isPlaying = false;
  }

  reset() {
    this.currentStepIndex = 0;
    this.isPlaying = false;
    
    // Reset fighter positions and HP
    this.fighters.forEach(fighter => {
      const sprite = this.fighterSprites[fighter.id];
      if (sprite) {
        const x = fighter.team === 'L' ? ARENA_LEFT + 100 : ARENA_RIGHT - 100;
        sprite.x = x;
        sprite.y = fighter.baseY;
        sprite.alpha = 1;
        sprite.angle = 0;
      }
      
      // Reset HP
      this.updateHealthBar(fighter.id, fighter.maxHp);
    });
    
    this.updateUI();
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
    if (this.speedText) {
      this.speedText.setText(`Speed: ${speed}x`);
    }
  }

  processNextStep() {
    if (!this.isPlaying || this.currentStepIndex >= this.steps.length) {
      if (this.currentStepIndex >= this.steps.length) {
        this.onFightEnd();
      }
      return;
    }

    const step = this.steps[this.currentStepIndex];
    console.log(`Step ${this.currentStepIndex}:`, step);
    
    // Update turn display if it exists
    if (this.turnText) {
      this.turnText.setText(`Step: ${this.currentStepIndex + 1}/${this.steps.length}`);
    }
    
    this.executeStep(step, () => {
      this.currentStepIndex++;
      if (this.isPlaying) {
        this.processNextStep();
      }
    });
  }

  executeStep(step, callback) {
    const duration = (step.duration || 500) / this.playbackSpeed;
    
    switch (step.type) {
      case StepType.Move:
        this.executeMove(step, duration, callback);
        break;
      case StepType.MoveBack:
        this.executeMoveBack(step, duration, callback);
        break;
      case StepType.Hit:
        this.executeHit(step, duration, callback);
        break;
      case StepType.AttemptHit:
        this.executeAttemptHit(step, duration, callback);
        break;
      case StepType.Block:
        this.executeBlock(step, duration, callback);
        break;
      case StepType.Evade:
        this.executeEvade(step, duration, callback);
        break;
      case StepType.Counter:
        this.executeCounter(step, duration, callback);
        break;
      case StepType.Death:
        this.executeDeath(step, duration, callback);
        break;
      case StepType.Equip:
        this.executeEquip(step, duration, callback);
        break;
      case StepType.Throw:
        this.executeThrow(step, duration, callback);
        break;
      case StepType.Disarm:
        this.executeDisarm(step, duration, callback);
        break;
      case StepType.SkillActivate:
        this.executeSkillActivate(step, duration, callback);
        break;
      case StepType.End:
        this.executeEnd(step, callback);
        break;
      default:
        console.warn('Unknown step type:', step.type);
        callback();
    }
  }

  executeMove(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    const fighter = this.fighters.find(f => f.id === step.fighter);
    const opponent = this.fighters.find(f => f.id !== step.fighter && f.hp > 0);
    
    if (!opponent) {
      callback();
      return;
    }
    
    // Calculate target position
    let targetX;
    if (step.to === 1) {
      // Move to center
      targetX = 400;
    } else if (step.to === -1) {
      // Move back
      targetX = fighter.team === 'L' ? ARENA_LEFT + 100 : ARENA_RIGHT - 100;
    } else {
      // Move towards opponent
      const direction = opponent.position > fighter.position ? 1 : -1;
      targetX = fighter.position + (direction * 100);
      targetX = Math.max(ARENA_LEFT + 50, Math.min(ARENA_RIGHT - 50, targetX));
    }
    
    // Animate movement
    this.tweens.add({
      targets: sprite,
      x: targetX,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        fighter.position = targetX;
        callback();
      }
    });
    
    // Add dust effect
    this.createDustEffect(sprite.x, sprite.y + 60);
  }

  executeMoveBack(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    const fighter = this.fighters.find(f => f.id === step.fighter);
    const baseX = fighter.team === 'L' ? ARENA_LEFT + 100 : ARENA_RIGHT - 100;
    
    this.tweens.add({
      targets: sprite,
      x: baseX,
      duration: duration,
      ease: 'Back.easeOut',
      onComplete: () => {
        fighter.position = baseX;
        callback();
      }
    });
  }

  executeAttemptHit(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    // Attack animation - lean forward
    this.tweens.add({
      targets: sprite,
      scaleX: 1.1,
      angle: step.target > step.fighter ? 5 : -5,
      duration: duration / 2,
      yoyo: true,
      ease: 'Power2',
      onComplete: callback
    });
  }

  executeHit(step, duration, callback) {
    const attackerSprite = this.fighterSprites[step.fighter];
    const targetSprite = this.fighterSprites[step.target];
    
    if (!attackerSprite || !targetSprite) {
      callback();
      return;
    }
    
    // Impact effect
    this.createImpactEffect(targetSprite.x, targetSprite.y);
    
    // Flash target
    this.tweens.add({
      targets: targetSprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Update health
        const target = this.fighters.find(f => f.id === step.target);
        if (target) {
          this.updateHealthBar(step.target, target.hp - step.damage);
        }
        
        // Knockback
        this.tweens.add({
          targets: targetSprite,
          x: targetSprite.x + (step.fighter < step.target ? 20 : -20),
          duration: 100,
          yoyo: true,
          ease: 'Power2'
        });
        
        callback();
      }
    });
    
    // Show damage number
    this.showDamageNumber(targetSprite.x, targetSprite.y - 50, step.damage);
  }

  executeBlock(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    // Block animation - raise arms
    this.tweens.add({
      targets: sprite,
      scaleY: 0.9,
      y: sprite.y - 10,
      duration: duration / 2,
      yoyo: true,
      ease: 'Power2',
      onComplete: callback
    });
    
    // Show block text
    this.showCombatText(sprite.x, sprite.y - 70, 'BLOCK!', 0x4ecdc4);
  }

  executeEvade(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    const fighter = this.fighters.find(f => f.id === step.fighter);
    const dodgeDirection = fighter.team === 'L' ? -1 : 1;
    
    // Dodge animation
    this.tweens.add({
      targets: sprite,
      x: sprite.x + (dodgeDirection * 40),
      angle: dodgeDirection * 15,
      duration: duration / 2,
      yoyo: true,
      ease: 'Power2',
      onComplete: callback
    });
    
    // Show evade text
    this.showCombatText(sprite.x, sprite.y - 70, 'DODGE!', 0xffe66d);
  }

  executeCounter(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    // Counter animation - spin
    this.tweens.add({
      targets: sprite,
      angle: 360,
      duration: duration,
      ease: 'Power2',
      onComplete: callback
    });
    
    // Show counter text
    this.showCombatText(sprite.x, sprite.y - 70, 'COUNTER!', 0xff6b6b);
  }

  executeDeath(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    // Death animation - fall down
    this.tweens.add({
      targets: sprite,
      angle: 90,
      y: sprite.y + 60,
      alpha: 0.5,
      duration: duration,
      ease: 'Power2',
      onComplete: callback
    });
    
    // Show death text
    this.showCombatText(sprite.x, sprite.y - 70, 'K.O.!', 0xff0000);
  }

  executeEquip(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    // Equip animation
    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: duration / 2,
      yoyo: true,
      ease: 'Back',
      onComplete: callback
    });
    
    // Show weapon name
    this.showCombatText(sprite.x, sprite.y - 70, step.weapon.toUpperCase(), 0x00ff00);
  }

  executeThrow(step, duration, callback) {
    const attackerSprite = this.fighterSprites[step.fighter];
    const targetSprite = this.fighterSprites[step.target];
    
    if (!attackerSprite || !targetSprite) {
      callback();
      return;
    }
    
    // Create projectile
    const projectile = this.add.circle(attackerSprite.x, attackerSprite.y, 5, 0xffff00);
    
    // Throw animation
    this.tweens.add({
      targets: projectile,
      x: targetSprite.x,
      y: targetSprite.y,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        projectile.destroy();
        this.createImpactEffect(targetSprite.x, targetSprite.y);
        callback();
      }
    });
    
    // Rotate projectile
    this.tweens.add({
      targets: projectile,
      angle: 720,
      duration: duration
    });
  }

  executeDisarm(step, duration, callback) {
    const sprite = this.fighterSprites[step.target];
    if (!sprite) {
      callback();
      return;
    }
    
    // Create weapon drop effect
    const weapon = this.add.rectangle(sprite.x, sprite.y, 20, 5, 0x888888);
    
    // Drop animation
    this.tweens.add({
      targets: weapon,
      y: sprite.y + 80,
      angle: 180,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        weapon.destroy();
        callback();
      }
    });
    
    // Show disarm text
    this.showCombatText(sprite.x, sprite.y - 70, 'DISARMED!', 0xffa500);
  }

  executeSkillActivate(step, duration, callback) {
    const sprite = this.fighterSprites[step.fighter];
    if (!sprite) {
      callback();
      return;
    }
    
    // Skill activation effect
    const circle = this.add.circle(sprite.x, sprite.y, 10, 0xffff00, 0.5);
    
    this.tweens.add({
      targets: circle,
      scale: 5,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        circle.destroy();
        callback();
      }
    });
    
    // Show skill name
    this.showCombatText(sprite.x, sprite.y - 70, step.skill?.toUpperCase() || 'SKILL!', 0xa29bfe);
  }

  executeEnd(step, callback) {
    const winnerText = step.winner ? 
      `${this.fighters.find(f => f.id === step.winner)?.name} WINS!` : 
      'DRAW!';
    
    // Show victory text
    const text = this.add.text(400, 200, winnerText, {
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Victory animation
    this.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    callback();
  }

  createImpactEffect(x, y) {
    const impact = this.add.circle(x, y, 20, 0xffffff, 0.8);
    
    this.tweens.add({
      targets: impact,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => impact.destroy()
    });
  }

  createDustEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      const dust = this.add.circle(
        x + (Math.random() - 0.5) * 30,
        y,
        Math.random() * 3 + 2,
        0xd2691e,
        0.6
      );
      
      this.tweens.add({
        targets: dust,
        y: y - Math.random() * 20 - 10,
        alpha: 0,
        duration: 500,
        delay: i * 50,
        ease: 'Power2',
        onComplete: () => dust.destroy()
      });
    }
  }

  showDamageNumber(x, y, damage) {
    const text = this.add.text(x, y, `-${damage}`, {
      fontSize: '24px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  showCombatText(x, y, message, color) {
    const text = this.add.text(x, y, message, {
      fontSize: '18px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: y - 20,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  onFightEnd() {
    this.isPlaying = false;
    console.log('Fight completed!');
    
    // Trigger event
    this.events.emit('fightEnd');
  }

  updateUI() {
    if (this.turnText) {
      this.turnText.setText(`Ready - ${this.steps.length} steps`);
    }
  }

  setupEventListeners() {
    // External event handling for iframe integration
    if (window.addEventListener) {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'LOAD_FIGHT_STEPS') {
          this.loadFightData(event.data.payload);
        }
      });
    }
  }
}