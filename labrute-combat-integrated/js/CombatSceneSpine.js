import { StepType } from './LaBruteCombatEngine.js';

export class CombatSceneSpine extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatSceneSpine' });
    this.fighters = [];
    this.steps = [];
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1;
    this.fighterSprites = {};
    this.combatZone = null;  // Sera initialisé dans create()
    this.pendingFightData = null;  // Pour stocker les données si chargées trop tôt
  }

  preload() {
    // Charger les assets Spine
    if (this.load.spine) {
      // Si le plugin est chargé correctement
      this.load.spine('spineboy', 
        'assets/spine/spineboy-pro.json',
        'assets/spine/spineboy.atlas',
        true
      );
    } else {
      console.warn('Spine plugin not loaded, using fallback');
      // Charger juste une image de fallback
      this.load.image('fighter-fallback', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
    
    // Charger le background (optionnel pour l'instant)
    // this.load.image('arena-bg', 'assets/images/sprites/background.png');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Configuration de la caméra
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    
    // Background
    const bg = this.add.rectangle(W/2, H/2, W, H, 0x87CEEB);
    const ground = this.add.rectangle(W/2, H*0.75, W, H/2, 0xD2691E);
    
    // Zone de combat
    this.combatZone = {
      leftX: W * 0.25,
      rightX: W * 0.75,
      centerX: W * 0.5,
      baseY: H * 0.65
    };
    
    // UI
    this.createUI();
    
    // Écouter les messages externes
    this.setupEventListeners();
    
    // Si des données de combat étaient en attente, les charger maintenant
    if (this.pendingFightData) {
      const data = this.pendingFightData;
      this.pendingFightData = null;
      this.loadFightData(data);
    }
  }

  createUI() {
    // Indicateur de tour
    this.turnText = this.add.text(400, 20, '', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Indicateur de vitesse
    this.speedText = this.add.text(750, 20, 'Speed: 1x', {
      fontSize: '14px',
      color: '#ffff00'
    }).setOrigin(1, 0);
  }

  loadFightData(data) {
    console.log('Loading fight data with Spine:', data);
    
    this.fighters = data.fighters || [];
    this.steps = data.steps || [];
    this.currentStepIndex = 0;
    this.isPlaying = false;
    
    // S'assurer que la scène est créée avant de charger les données
    if (!this.combatZone) {
      // Si la scène n'est pas encore créée, stocker les données pour plus tard
      this.pendingFightData = data;
      return;
    }
    
    // Nettoyer les sprites existants
    this.clearFighters();
    
    // Créer les combattants avec Spine
    this.createSpineFighters();
    
    // Mettre à jour l'UI
    this.updateUI();
  }

  clearFighters() {
    Object.values(this.fighterSprites).forEach(obj => {
      if (obj.spine) obj.spine.destroy();
      if (obj.shadow) obj.shadow.destroy();
      if (obj.healthBar) {
        obj.healthBar.bg.destroy();
        obj.healthBar.fill.destroy();
        obj.healthBar.text.destroy();
      }
      if (obj.nameText) obj.nameText.destroy();
    });
    
    this.fighterSprites = {};
  }

  createSpineFighters() {
    const baseScale = 0.3;
    
    this.fighters.forEach(fighter => {
      const x = fighter.team === 'L' ? this.combatZone.leftX : this.combatZone.rightX;
      const y = this.combatZone.baseY;
      
      // Créer le sprite Spine ou fallback
      let spine = null;
      let isSpine = false;
      
      // Essayer de créer un sprite Spine si disponible
      if (this.add.spine && this.cache.custom && this.cache.custom.spine && this.cache.custom.spine.has('spineboy')) {
        try {
          spine = this.add.spine(x, y, 'spineboy', 'spineboy', true);
          const scaleDir = fighter.team === 'L' ? baseScale : -baseScale;
          spine.setScale(scaleDir, baseScale);
          
          // Animation idle par défaut
          if (spine.animationState) {
            spine.animationState.setAnimation(0, 'idle', true);
            isSpine = true;
          }
        } catch (error) {
          console.warn('Spine creation failed:', error);
        }
      }
      
      // Fallback: créer un sprite animé simple
      if (!spine) {
        // Rectangle avec animation simple
        spine = this.add.rectangle(x, y, 60, 120, fighter.team === 'L' ? 0xff4444 : 0x4444ff);
        spine.setStrokeStyle(3, 0x000000);
        
        // Ajouter une animation de respiration simple
        this.tweens.add({
          targets: spine,
          scaleY: 1.02,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Ombre
      const shadow = this.add.ellipse(x, y + 60, 80, 20, 0x000000, 0.3);
      
      // Barre de vie
      const healthBar = this.createHealthBar(fighter, x, y - 80);
      
      // Nom
      const nameText = this.add.text(x, y - 100, fighter.name, {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Stocker les références
      this.fighterSprites[fighter.id] = {
        spine,
        shadow,
        healthBar,
        nameText,
        fighter,
        baseX: x,
        baseY: y,
        baseScale,
        isSpine  // Flag pour savoir si c'est un vrai sprite Spine
      };
      
      // Position initiale
      fighter.displayX = x;
      fighter.displayY = y;
    });
  }

  createHealthBar(fighter, x, y) {
    const barWidth = 100;
    const barHeight = 12;
    
    const bg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333);
    bg.setStrokeStyle(1, 0x000000);
    
    const fill = this.add.rectangle(x, y, barWidth - 2, barHeight - 2, 0x00ff00);
    
    const text = this.add.text(x, y, `${fighter.hp}/${fighter.maxHp}`, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    return { bg, fill, text, maxWidth: barWidth - 2 };
  }

  updateHealthBar(fighterId, newHp) {
    const spriteObj = this.fighterSprites[fighterId];
    if (!spriteObj || !spriteObj.healthBar) return;
    
    const fighter = spriteObj.fighter;
    fighter.hp = Math.max(0, newHp);
    
    const healthBar = spriteObj.healthBar;
    const percentage = fighter.hp / fighter.maxHp;
    const newWidth = healthBar.maxWidth * percentage;
    
    this.tweens.add({
      targets: healthBar.fill,
      displayWidth: newWidth,
      duration: 300,
      ease: 'Power2'
    });
    
    // Couleur selon HP
    let color = 0x00ff00;
    if (percentage < 0.25) color = 0xff0000;
    else if (percentage < 0.5) color = 0xffaa00;
    healthBar.fill.setFillStyle(color);
    
    healthBar.text.setText(`${fighter.hp}/${fighter.maxHp}`);
  }

  // Méthodes de contrôle
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
    
    // Réinitialiser les positions et HP
    this.fighters.forEach(fighter => {
      const spriteObj = this.fighterSprites[fighter.id];
      if (spriteObj) {
        spriteObj.spine.x = spriteObj.baseX;
        spriteObj.spine.y = spriteObj.baseY;
        spriteObj.shadow.x = spriteObj.baseX;
        spriteObj.shadow.y = spriteObj.baseY + 60;
        
        this.setSpineAnimation(spriteObj, 'idle', true);
        
        this.updateHealthBar(fighter.id, fighter.maxHp);
      }
    });
    
    this.updateUI();
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
    if (this.speedText) {
      this.speedText.setText(`Speed: ${speed}x`);
    }
  }

  // Traitement des steps
  processNextStep() {
    if (!this.isPlaying || this.currentStepIndex >= this.steps.length) {
      if (this.currentStepIndex >= this.steps.length) {
        this.onFightEnd();
      }
      return;
    }

    const step = this.steps[this.currentStepIndex];
    console.log(`Step ${this.currentStepIndex}:`, step);
    
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
      case StepType.SkillActivate:
        this.executeSkillActivate(step, duration, callback);
        break;
      case StepType.End:
        this.executeEnd(step, callback);
        break;
      default:
        console.warn('Step type not implemented:', step.type);
        callback();
    }
  }

  // Animations Spine ou fallback
  setSpineAnimation(spriteObj, animName, loop = false) {
    if (!spriteObj) return;
    
    // Si c'est un vrai sprite Spine
    if (spriteObj.isSpine && spriteObj.spine && spriteObj.spine.animationState) {
      try {
        spriteObj.spine.animationState.setAnimation(0, animName, loop);
      } catch (e) {
        console.warn('Animation not found:', animName);
      }
    }
    // Sinon, animations fallback avec tweens
    else if (spriteObj.spine) {
      // Arrêter les tweens existants
      this.tweens.killTweensOf(spriteObj.spine);
      
      // Animations simples selon le type
      switch(animName) {
        case 'walk':
        case 'run':
          // Mouvement de marche
          this.tweens.add({
            targets: spriteObj.spine,
            scaleY: 1.05,
            duration: 200,
            yoyo: true,
            repeat: loop ? -1 : 0,
            ease: 'Sine.easeInOut'
          });
          break;
        case 'attack':
        case 'shoot':
          // Animation d'attaque
          this.tweens.add({
            targets: spriteObj.spine,
            scaleX: spriteObj.spine.scaleX * 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
          });
          break;
        case 'idle':
        default:
          // Animation idle
          this.tweens.add({
            targets: spriteObj.spine,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          break;
      }
    }
  }

  executeMove(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    // Animation de course
    this.setSpineAnimation(spriteObj, 'walk', true);
    
    // Calculer la position cible
    const targetX = typeof step.to === 'number' ? step.to : this.combatZone.centerX;
    
    // Déplacer le sprite et l'ombre
    this.tweens.add({
      targets: [spriteObj.spine, spriteObj.shadow],
      x: targetX,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.setSpineAnimation(spriteObj, 'idle', true);
        callback();
      }
    });
  }

  executeMoveBack(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    this.setSpineAnimation(spriteObj, 'walk', true);
    
    this.tweens.add({
      targets: [spriteObj.spine, spriteObj.shadow],
      x: spriteObj.baseX,
      duration: duration,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.setSpineAnimation(spriteObj, 'idle', true);
        callback();
      }
    });
  }

  executeAttemptHit(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    // Animation d'attaque
    this.setSpineAnimation(spriteObj, 'attack', false);
    
    // Revenir à idle après l'attaque
    this.time.delayedCall(duration, () => {
      this.setSpineAnimation(spriteObj, 'idle', true);
      callback();
    });
  }

  executeHit(step, duration, callback) {
    const targetObj = this.fighterSprites[step.target];
    if (!targetObj) {
      callback();
      return;
    }
    
    // Effet d'impact
    this.cameras.main.shake(100, 0.005);
    
    // Flash rouge
    if (targetObj.spine.setTint) {
      targetObj.spine.setTint(0xff6666);
      this.time.delayedCall(100, () => targetObj.spine.clearTint());
    }
    
    // Knockback
    const knockbackDir = step.fighter < step.target ? 20 : -20;
    this.tweens.add({
      targets: targetObj.spine,
      x: targetObj.spine.x + knockbackDir,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
    
    // Mettre à jour la barre de vie
    const target = this.fighters.find(f => f.id === step.target);
    if (target) {
      this.updateHealthBar(step.target, target.hp - step.damage);
    }
    
    // Afficher les dégâts
    this.showDamageNumber(targetObj.spine.x, targetObj.spine.y - 50, step.damage);
    
    this.time.delayedCall(duration, callback);
  }

  executeBlock(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    // Animation de blocage
    this.tweens.add({
      targets: spriteObj.spine,
      scaleY: Math.abs(spriteObj.spine.scaleY) * 0.8,
      duration: duration / 2,
      yoyo: true,
      ease: 'Power2'
    });
    
    this.showCombatText(spriteObj.spine.x, spriteObj.spine.y - 70, 'BLOCK!', 0xffd700);
    this.time.delayedCall(duration, callback);
  }

  executeEvade(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    // Animation d'esquive
    const dodgeDir = spriteObj.fighter.team === 'L' ? -50 : 50;
    
    this.setSpineAnimation(spriteObj, 'walk', true);
    
    this.tweens.add({
      targets: [spriteObj.spine, spriteObj.shadow],
      x: spriteObj.spine.x + dodgeDir,
      duration: duration / 2,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.setSpineAnimation(spriteObj, 'idle', true);
        callback();
      }
    });
    
    this.showCombatText(spriteObj.spine.x, spriteObj.spine.y - 70, 'DODGE!', 0x4ecdc4);
  }

  executeCounter(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    this.showCombatText(spriteObj.spine.x, spriteObj.spine.y - 70, 'COUNTER!', 0xff6b6b);
    this.time.delayedCall(duration, callback);
  }

  executeDeath(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    // Animation de mort (Spine gérera le fallback si nécessaire)
    this.tweens.add({
      targets: spriteObj.spine,
      angle: spriteObj.fighter.team === 'L' ? -90 : 90,
      y: spriteObj.spine.y + 60,
      alpha: 0.5,
      duration: duration,
      ease: 'Power2'
    });
    
    // Essayer aussi l'animation Spine si disponible
    if (spriteObj.isSpine) {
      try {
        spriteObj.spine.animationState.setAnimation(0, 'death', false);
      } catch (e) {
        // Pas grave, on a déjà le tween
      }
    }
    
    this.showCombatText(spriteObj.spine.x, spriteObj.spine.y - 70, 'K.O.!', 0xff0000);
    this.time.delayedCall(duration, callback);
  }

  executeEquip(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    this.showCombatText(spriteObj.spine.x, spriteObj.spine.y - 70, step.weapon.toUpperCase(), 0x00ff00);
    this.time.delayedCall(duration, callback);
  }

  executeSkillActivate(step, duration, callback) {
    const spriteObj = this.fighterSprites[step.fighter];
    if (!spriteObj) {
      callback();
      return;
    }
    
    const skillName = step.skill === 'critical' ? 'CRITICAL!' : (step.skill || 'SKILL!').toUpperCase();
    const color = step.skill === 'critical' ? 0xff0000 : 0xa29bfe;
    
    this.showCombatText(spriteObj.spine.x, spriteObj.spine.y - 70, skillName, color);
    
    // Effet visuel
    const circle = this.add.circle(spriteObj.spine.x, spriteObj.spine.y, 10, color, 0.5);
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
  }

  executeEnd(step, callback) {
    const winnerText = step.winner ? 
      `${this.fighters.find(f => f.id === step.winner)?.name} WINS!` : 
      'DRAW!';
    
    const text = this.add.text(400, 200, winnerText, {
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    callback();
  }

  // Effets visuels
  showDamageNumber(x, y, damage) {
    const text = this.add.text(x, y, `-${damage}`, {
      fontSize: '28px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  showCombatText(x, y, message, color) {
    const text = this.add.text(x, y, message, {
      fontSize: '20px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  onFightEnd() {
    this.isPlaying = false;
    console.log('Fight completed!');
    this.events.emit('fightEnd');
  }

  updateUI() {
    if (this.turnText) {
      this.turnText.setText(`Ready - ${this.steps.length} steps`);
    }
  }

  setupEventListeners() {
    if (window.addEventListener) {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'LOAD_FIGHT_STEPS') {
          this.loadFightData(event.data.payload);
        }
      });
    }
  }
}