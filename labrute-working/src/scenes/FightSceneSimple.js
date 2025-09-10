import { CombatEngine } from '../engine/CombatEngine.js';
import { UIManager } from '../ui/UIManager.js';
import { applySkillModifiers, getRandomSkill } from '../game/skills.js';
import { getRandomPet } from '../game/pets.js';

export class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Fight' });
    this.combatEnded = false;
  }

  create() {
    // Background
    this.bg = this.add.image(512, 384, 'background');
    this.bg.setScale(2.2);
    this.bg.setDepth(-10);
    
    // Setup fighters
    this.setupFighters();
    
    // Initialize combat engine
    this.combatEngine = new CombatEngine(this.fighter1, this.fighter2);
    
    // Create UI
    this.uiManager = new UIManager(this);
    this.uiManager.create();
    
    // Start continuous combat
    this.runCombat();
  }

  runCombat() {
    if (this.combatEnded) return;
    
    // Check for winner
    if (this.fighter1.stats.health <= 0) {
      this.combatEnded = true;
      this.endCombat(this.fighter2);
      return;
    }
    if (this.fighter2.stats.health <= 0) {
      this.combatEnded = true;
      this.endCombat(this.fighter1);
      return;
    }
    
    // Force reset turn flag to prevent stuck
    if (this.combatEngine.turnInProgress) {
      this.combatEngine.turnInProgress = false;
    }
    
    // Execute turn
    const result = this.combatEngine.executeTurn();
    
    if (result && result.gameOver) {
      this.combatEnded = true;
      this.endCombat(result.winner);
      return;
    }
    
    // Animate if we got a result
    if (result) {
      this.simpleAnimate(result);
      this.uiManager.updateUI();
      this.uiManager.addCombatLog(result.message);
    }
    
    // ALWAYS schedule next turn, no matter what
    this.time.delayedCall(600, () => {
      this.runCombat();
    });
  }

  simpleAnimate(result) {
    const attacker = result.attacker;
    const target = result.target;
    
    if (!attacker || !target) return;
    
    // Simple attack animation
    if (result.type === 'attack' || result.type === 'throw') {
      if (result.hit) {
        // Hit shake
        this.shakeTarget(target);
        this.shakeMedium();
        
        // Show damage
        this.showDamageNumber(target, result.damage, result.critical);
      } else {
        // Miss indicator
        this.showMissEffect(target);
      }
    }
    
    // Dodge animation
    if (result.type === 'dodge') {
      this.performSimpleDodge(target);
      this.createDodgeIndicator(target);
    }
    
    // Block animation
    if (result.type === 'block') {
      this.shakeLight();
      this.showBlockIndicator(target);
    }
  }

  shakeTarget(target) {
    if (!target.sprite) return;
    
    this.tweens.add({
      targets: target.sprite,
      x: target.sprite.x + 10,
      duration: 50,
      yoyo: true,
      repeat: 2
    });
  }

  performSimpleDodge(fighter) {
    if (!fighter.sprite) return;
    
    const dodgeDistance = fighter.side === 'left' ? -80 : 80;
    
    this.tweens.add({
      targets: fighter.sprite,
      x: fighter.sprite.x + dodgeDistance,
      y: fighter.sprite.y - 40,
      duration: 250,
      yoyo: true,
      ease: 'Power2.easeInOut'
    });
  }

  showDamageNumber(target, damage, isCritical) {
    const damageText = this.add.text(
      target.sprite.x, 
      target.sprite.y - 60, 
      damage.toString(), {
      fontSize: isCritical ? '48px' : '36px',
      fontWeight: 'bold',
      color: isCritical ? '#ffdd00' : '#ff3333',
      stroke: '#000000',
      strokeThickness: 4
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(1000);
    
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    });
  }

  showMissEffect(target) {
    const missText = this.add.text(
      target.sprite.x,
      target.sprite.y - 60,
      'MISS!', {
      fontSize: '28px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3
    });
    missText.setOrigin(0.5);
    
    this.tweens.add({
      targets: missText,
      y: missText.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => missText.destroy()
    });
  }

  createDodgeIndicator(fighter) {
    const dodgeText = this.add.text(
      fighter.sprite.x,
      fighter.sprite.y - 80,
      'DODGE!', {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    dodgeText.setOrigin(0.5);
    
    this.tweens.add({
      targets: dodgeText,
      y: dodgeText.y - 30,
      scale: 1.3,
      alpha: 0,
      duration: 700,
      onComplete: () => dodgeText.destroy()
    });
  }

  showBlockIndicator(fighter) {
    const blockText = this.add.text(
      fighter.sprite.x,
      fighter.sprite.y - 80,
      'BLOCK!', {
      fontSize: '28px',
      color: '#4488ff',
      stroke: '#000000',
      strokeThickness: 3
    });
    blockText.setOrigin(0.5);
    
    this.tweens.add({
      targets: blockText,
      y: blockText.y - 25,
      alpha: 0,
      duration: 600,
      onComplete: () => blockText.destroy()
    });
  }

  shakeLight() {
    this.cameras.main.shake(100, 0.01);
  }

  shakeMedium() {
    this.cameras.main.shake(150, 0.02);
  }

  shakeHeavy() {
    this.cameras.main.shake(200, 0.03);
  }

  endCombat(winner) {
    // Clear any timers
    this.time.removeAllEvents();
    
    // Victory text
    const victoryText = this.add.text(512, 200, `${winner.stats.name} WINS!`, {
      fontSize: '48px',
      fill: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: victoryText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Restart button
    const restartBtn = this.add.rectangle(512, 650, 200, 60, 0x4a4a4a)
      .setInteractive()
      .on('pointerdown', () => this.scene.restart());
    
    const restartText = this.add.text(512, 650, 'RESTART', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }

  setupFighters() {
    // Quick fighter setup - simplified
    const weapons = ['sword', 'hammer', 'axe', 'spear', 'dagger'];
    
    this.fighter1 = {
      sprite: this.add.image(200, 500, 'fight1').setScale(0.15),
      stats: {
        name: 'Fighter 1',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 20,
        defense: 10,
        agility: 15,
        speed: 10
      },
      weaponType: weapons[Math.floor(Math.random() * weapons.length)],
      hasWeapon: true,
      side: 'left',
      specialMoves: { unlocked: [], active: {} }
    };
    
    this.fighter2 = {
      sprite: this.add.image(824, 500, 'fight2').setScale(0.25).setFlipX(true),
      stats: {
        name: 'Fighter 2',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 20,
        defense: 10,
        agility: 15,
        speed: 10
      },
      weaponType: weapons[Math.floor(Math.random() * weapons.length)],
      hasWeapon: true,
      side: 'right',
      specialMoves: { unlocked: [], active: {} }
    };
  }
}