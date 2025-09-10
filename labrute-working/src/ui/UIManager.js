
export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.combatLogEntries = [];
  }

  create() {
    // Fighter 1 UI (Left)
    this.createFighterUI(this.scene.fighter1, 50, 50);
    
    // Fighter 2 UI (Right)
    this.createFighterUI(this.scene.fighter2, 974, 50, true);
    
    // Turn counter - REMOVED for cleaner UI
    
    // Combat log background
    this.logBg = this.scene.add.rectangle(512, 680, 600, 120, 0x1a1a1a, 0.8);
    this.logBg.setStrokeStyle(2, 0x444444);
    
    // Combat log title
    this.scene.add.text(512, 630, 'COMBAT LOG', {
      fontSize: '16px',
      fill: '#ff6b35',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
  }

  createFighterUI(fighter, x, y, rightAlign = false) {
    const align = rightAlign ? 1 : 0;
    
    // Portrait background
    const portraitBg = this.scene.add.rectangle(x, y, 80, 80, 0x333333);
    portraitBg.setOrigin(align, 0);
    
    // Fighter portrait (mini version)
    const portrait = this.scene.add.image(x + (rightAlign ? -40 : 40), y + 40, 
      fighter.sprite.texture.key);
    portrait.setScale(0.08).setOrigin(0.5);
    
    // Name
    fighter.nameText = this.scene.add.text(x + (rightAlign ? -90 : 90), y + 10, 
      fighter.stats.name, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial Black'
    }).setOrigin(align, 0);
    
    // Health bar
    fighter.healthBg = this.scene.add.rectangle(x + (rightAlign ? -90 : 90), y + 35, 
      200, 20, 0x333333).setOrigin(align, 0);
    fighter.healthBar = this.scene.add.rectangle(x + (rightAlign ? -90 : 90), y + 35, 
      200, 20, 0x00ff00).setOrigin(align, 0);
    
    // Stamina bar - REMOVED for cleaner UI
    
    // Stats text - SUPPRIMÉ pour simplifier l'interface
    // fighter.statsText = null;
    
    // Initiative indicator - SUPPRIMÉ pour simplifier l'interface
    // fighter.initiativeText = null;
    
    // Special moves status area - REMOVED for cleaner UI
    fighter.activeSpecialMoves = {};
  }

  updateUI() {
    // Update fighter 1
    this.updateFighterBars(this.scene.fighter1);
    this.updateSpecialMoveStatus(this.scene.fighter1, false);
    
    // Update fighter 2
    this.updateFighterBars(this.scene.fighter2);
    this.updateSpecialMoveStatus(this.scene.fighter2, true);
    
    // Update turn counter - REMOVED
    
    // Highlight active player with border
    const activePlayer = this.scene.combatEngine.activePlayer;
    this.scene.fighter1.healthBg.setStrokeStyle(activePlayer === this.scene.fighter1 ? 3 : 0, 0xff6b35);
    this.scene.fighter2.healthBg.setStrokeStyle(activePlayer === this.scene.fighter2 ? 3 : 0, 0xff6b35);
  }

  updateFighterBars(fighter) {
    // Health bar
    const healthPercent = fighter.stats.health / fighter.stats.maxHealth;
    fighter.healthBar.scaleX = healthPercent;
    
    // Color based on health
    if (healthPercent > 0.6) {
      fighter.healthBar.setFillStyle(0x00ff00);
    } else if (healthPercent > 0.3) {
      fighter.healthBar.setFillStyle(0xffaa00);
    } else {
      fighter.healthBar.setFillStyle(0xff0000);
    }
    
    // Stamina bar - REMOVED
    
    // Stats text supprimé pour simplifier l'interface
  }

  addCombatLog(message) {
    this.combatLogEntries.push(message);
    if (this.combatLogEntries.length > 4) {
      this.combatLogEntries.shift();
    }
    
    // Clear existing log text
    if (this.logText) {
      this.logText.destroy();
    }
    
    // Display current log entries
    const logString = this.combatLogEntries.join('\n');
    this.logText = this.scene.add.text(512, 650, logString, {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 580 }
    }).setOrigin(0.5, 0);
  }
  
  updateSpecialMoveStatus(fighter, rightAlign = false) {
    // Special moves display - REMOVED for cleaner UI
    return;
    let yOffset = 0;
    Object.keys(fighter.specialMoves.active).forEach(moveKey => {
      const duration = fighter.specialMoves.active[moveKey];
      const moveData = this.scene.combatEngine.specialMoves[moveKey];
      
      // Create container for this special move
      const moveContainer = this.scene.add.container(0, yOffset);
      
      // Background for special move indicator
      const moveBg = this.scene.add.rectangle(0, 0, 180, 30, 0x2a2a2a, 0.9);
      moveBg.setOrigin(rightAlign ? 1 : 0, 0);
      moveBg.setStrokeStyle(2, this.getSpecialMoveColor(moveData.name));
      
      // Icon circle with special move color
      const iconBg = this.scene.add.circle(rightAlign ? -10 : 10, 10, 8, this.getSpecialMoveColor(moveData.name));
      
      // Special move icon symbol
      const iconSymbol = this.getSpecialMoveIcon(moveKey);
      const icon = this.scene.add.text(rightAlign ? -10 : 10, 10, iconSymbol, {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'Arial Black'
      }).setOrigin(0.5);
      
      // Move name
      const moveName = this.scene.add.text(rightAlign ? -25 : 25, 5, moveData.name, {
        fontSize: '10px',
        fill: '#ffffff',
        fontFamily: 'Arial Black'
      }).setOrigin(rightAlign ? 1 : 0, 0);
      
      // Duration timer with pulsing effect
      const durationText = this.scene.add.text(rightAlign ? -25 : 25, 18, `${duration} turns`, {
        fontSize: '9px',
        fill: '#ffdd00',
        fontFamily: 'Arial'
      }).setOrigin(rightAlign ? 1 : 0, 0);
      
      // Add pulsing animation to duration text
      this.scene.tweens.add({
        targets: durationText,
        alpha: 0.6,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      // Add glowing effect to the background
      this.scene.tweens.add({
        targets: moveBg,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
      
      moveContainer.add([moveBg, iconBg, icon, moveName, durationText]);
      fighter.specialMovesContainer.add(moveContainer);
      
      // Store reference for cleanup
      fighter.activeSpecialMoves[moveKey] = {
        container: moveContainer,
        duration: duration
      };
      
      yOffset += 35;
    });
  }
  
  getSpecialMoveColor(moveName) {
    switch (moveName) {
      case 'Berserker Rage': return 0xff4444;
      case 'Defensive Shield': return 0x4488ff;
      case 'Vampiric Strike': return 0x884488;
      case 'Adrenaline Rush': return 0xffff44;
      case 'Lightning Reflexes': return 0x00ffff; // Cyan color for reflexes
      default: return 0xffffff;
    }
  }
  
  getSpecialMoveIcon(moveKey) {
    switch (moveKey) {
      case 'berserkerRage': return '⚔';
      case 'defensiveShield': return '🛡';
      case 'vampiricStrike': return '🩸';
      case 'adrenalineRush': return '⚡';
      case 'lightningReflexes': return '👟'; // Boot icon for speed
      default: return '✨';
    }
  }
}