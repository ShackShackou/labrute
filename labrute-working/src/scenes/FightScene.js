import Phaser from 'phaser';
import { CombatEngine } from '../engine/CombatEngine.js';
import { UIManager } from '../ui/UIManager.js';
import { getRandomPet, PetName } from '../game/pets.js';
import { getRandomSkill, applySkillModifiers } from '../game/skills.js';
import { getRandomWeapon } from '../game/weapons.js';

export class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Fight' });
  }

  create() {
    // Setup background with better positioning for depth
    this.bg = this.add.image(512, 384, 'background');
    this.bg.setScale(2.2);
    this.bg.setDepth(-10);
    
    // Initialize Phaser 3 advanced features
    this.initializeAdvancedFeatures();
    
    // Create animations for warrior sprites
    this.createWarriorAnimations();
    
    // Store scene reference in fighters for debug access
    // Create fighters first (defines combatLanes)
    this.setupFighters();
    
    // Initialize combat engine
    this.combatEngine = new CombatEngine(this.fighter1, this.fighter2);
    
    // Create UI
    this.uiManager = new UIManager(this);
    this.uiManager.create();
    
    
    // Start combat
    this.startCombat();
  }
  
  initializeAdvancedFeatures() {
    // Create particle emitters for various effects
    this.bloodParticles = this.add.particles(0, 0, 'particle', {
      lifespan: 1000,
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      gravityY: 300,
      emitting: false,
      tint: 0xff0000
    });
    
    this.sparkParticles = this.add.particles(0, 0, 'particle', {
      lifespan: 500,
      speed: { min: 200, max: 400 },
      scale: { start: 0.8, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
      tint: 0xffff00
    });
    
    // Create graphics object for dynamic effects
    this.effectsGraphics = this.add.graphics();
    this.effectsGraphics.setDepth(100);
    
    // Enable lights if needed for atmospheric effects
    // this.lights.enable();
    // this.lights.setAmbientColor(0xbbbbbb);
    
    // Create render texture for trail effects
    this.trailTexture = this.add.renderTexture(0, 0, 1024, 768);
    this.trailTexture.setDepth(50);
    this.trailTexture.setAlpha(0.8);
  }
  
  createWarriorAnimations() {
    // Create all warrior animations using Phaser 3's animation system
    this.anims.create({
      key: 'warrior_idle_anim',
      frames: this.anims.generateFrameNumbers('warrior_idle', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'warrior_run_anim',
      frames: this.anims.generateFrameNumbers('warrior_run', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    
    this.anims.create({
      key: 'warrior_attack1_anim',
      frames: this.anims.generateFrameNumbers('warrior_attack1', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });
    
    this.anims.create({
      key: 'warrior_attack2_anim',
      frames: this.anims.generateFrameNumbers('warrior_attack2', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    
    this.anims.create({
      key: 'warrior_guard_anim',
      frames: this.anims.generateFrameNumbers('warrior_guard', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
  }

  setupFighters() {
    // Define combat zones for free positioning (like official LaBrute)
    this.combatZone = {
      minY: 420,  // Zone haute (plus proche)
      maxY: 580,  // Zone basse (plus loin)
      leftMinX: 100,   // Zone gauche min
      leftMaxX: 300,   // Zone gauche max
      rightMinX: 724,  // Zone droite min
      rightMaxX: 924,  // Zone droite max
      centerX: 512     // Centre de l'arène
    };
    
    // Liste des positions occupées pour éviter les collisions
    this.occupiedPositions = [];
    
    // Randomly select fighter types including warrior
    const fighterTypes = ['fight1', 'fight2', 'warrior'];
    const fighter1Type = Phaser.Utils.Array.GetRandom(fighterTypes);
    const fighter2Type = Phaser.Utils.Array.GetRandom(fighterTypes);
    
    // Use new weapon system
    const weapon1 = getRandomWeapon();
    const weapon2 = getRandomWeapon();
    
    // PETS DISABLED FOR NOW - focusing on core combat
    const pet1 = null; // Math.random() < 0.3 ? getRandomPet() : null;
    const pet2 = null; // Math.random() < 0.3 ? getRandomPet() : null;
    
    // Calculate appropriate scales based on asset dimensions
    // fight1: 1578x996, fight2: 742x564, warrior: 180x180, original brute reference: ~1024x910
    const getScaleForFighter = (fighterType) => {
      if (fighterType === 'fight1') {
        return 0.12; // Even smaller scale for the larger fight1 asset
      } else if (fighterType === 'warrior') {
        return 0.3; // Warrior sprites are smaller, need bigger scale
      } else {
        return 0.25; // Slightly smaller scale for the smaller fight2 asset
      }
    };
    
    const fighter1Scale = getScaleForFighter(fighter1Type);
    const fighter2Scale = getScaleForFighter(fighter2Type);
    
    // Find free positions for fighters
    const position1 = this.findFreePosition('left');
    const position2 = this.findFreePosition('right');
    
    // Randomly assign skills to fighters
    const skill1 = Math.random() < 0.5 ? getRandomSkill() : null;
    const skill2 = Math.random() < 0.5 ? getRandomSkill() : null;
    
    // Create fighter 1 (left side) - positioned to stand on arena floor
    const dynamicScale1 = fighter1Scale * this.getFighterScale(position1.y);
    
    // Create sprite based on fighter type
    let fighter1Sprite;
    if (fighter1Type === 'warrior') {
      fighter1Sprite = this.add.sprite(position1.x, position1.y, 'warrior_idle')
        .setScale(dynamicScale1 * 2) // Warrior sprites need larger scale
        .setOrigin(0.5, 1)
        .play('warrior_idle_anim');
    } else {
      fighter1Sprite = this.add.image(position1.x, position1.y, fighter1Type)
        .setScale(dynamicScale1)
        .setOrigin(0.5, 1);
    }
    
    this.fighter1 = {
      sprite: fighter1Sprite,
      fighterType: fighter1Type,
      weapon: this.createWeaponSprite(position1.x - 30, position1.y - 80, weapon1, dynamicScale1 * 0.6, 'left'),
      shadow: this.add.ellipse(position1.x, position1.y + this.getShadowOffset(position1.y), 
        100 * this.getShadowScale(position1.y), 
        25 * this.getShadowScale(position1.y), 0x000000, 0.4),
      stats: {
        name: 'Brute Alpha',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: Phaser.Math.Between(15, 25),
        defense: Phaser.Math.Between(5, 15),
        agility: Phaser.Math.Between(10, 20), // New agility stat
        speed: Phaser.Math.Between(8, 15),
        initiative: 0, // Initiative calculée chaque tour
        baseInitiative: Phaser.Math.Between(0.5, 1.5), // Initiative de base
        counter: 0,
        combo: 0
      },
      weaponType: weapon1,
      hasWeapon: true, // Enable weapon throwing
      petType: pet1,
      skill: skill1,
      side: 'left',
      currentPosition: position1,
      baseX: position1.x,
      baseY: position1.y,
      scene: this // Add scene reference for debug access
    };
    
    // Apply skill modifiers to fighter 1
    if (skill1) {
      this.fighter1 = applySkillModifiers(this.fighter1, skill1);
    }
    
    // Create pet sprite for fighter 1 if they have one
    if (pet1) {
      this.createPetSprite(this.fighter1, pet1);
    }
    
    // Create fighter 2 (right side) - positioned to stand on arena floor  
    const dynamicScale2 = fighter2Scale * this.getFighterScale(position2.y);
    
    // Create sprite based on fighter type
    let fighter2Sprite;
    if (fighter2Type === 'warrior') {
      fighter2Sprite = this.add.sprite(position2.x, position2.y, 'warrior_idle')
        .setScale(-dynamicScale2 * 2, dynamicScale2 * 2) // Negative X scale to flip, larger scale for warrior
        .setOrigin(0.5, 1)
        .play('warrior_idle_anim');
    } else {
      fighter2Sprite = this.add.image(position2.x, position2.y, fighter2Type)
        .setScale(-dynamicScale2, dynamicScale2)
        .setOrigin(0.5, 1);
    }
    
    this.fighter2 = {
      sprite: fighter2Sprite,
      fighterType: fighter2Type,
      weapon: this.createWeaponSprite(position2.x + 30, position2.y - 80, weapon2, dynamicScale2 * 0.6, 'right'),
      shadow: this.add.ellipse(position2.x, position2.y + this.getShadowOffset(position2.y),
        100 * this.getShadowScale(position2.y),
        25 * this.getShadowScale(position2.y), 0x000000, 0.4),
      stats: {
        name: 'Brute Beta',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: Phaser.Math.Between(15, 25),
        defense: Phaser.Math.Between(5, 15),
        agility: Phaser.Math.Between(10, 20), // New agility stat
        speed: Phaser.Math.Between(8, 15),
        initiative: 0, // Initiative calculée chaque tour
        baseInitiative: Phaser.Math.Between(0.5, 1.5), // Initiative de base
        counter: 0,
        combo: 0
      },
      weaponType: weapon2,
      hasWeapon: true, // Enable weapon throwing
      petType: pet2,
      skill: skill2,
      side: 'right',
      currentPosition: position2,
      baseX: position2.x,
      baseY: position2.y,
      scene: this // Add scene reference for debug access
    };
    
    // Apply skill modifiers to fighter 2
    if (skill2) {
      this.fighter2 = applySkillModifiers(this.fighter2, skill2);
    }
    
    // Create pet sprite for fighter 2 if they have one
    if (pet2) {
      this.createPetSprite(this.fighter2, pet2);
    }
    
    // Set depth order based on lanes
    this.updateDepthOrdering();
  }
  
  createPetSprite(fighter, petType) {
    // Pet positioning offset from owner
    const offsetX = fighter.side === 'left' ? -60 : 60;
    const petScale = 0.08;
    
    // Create simple pet representation
    let petColor, petSize;
    switch (petType) {
      case PetName.bear:
        petColor = 0x8B4513; // Brown
        petSize = { width: 40, height: 35 };
        break;
      case PetName.panther:
        petColor = 0x2F2F2F; // Dark gray
        petSize = { width: 35, height: 25 };
        break;
      case PetName.dog1:
      case PetName.dog2:
      case PetName.dog3:
        petColor = 0x964B00; // Dark brown
        petSize = { width: 30, height: 20 };
        break;
      default:
        petColor = 0x666666;
        petSize = { width: 25, height: 20 };
    }
    
    const petX = fighter.baseX + offsetX;
    const petY = fighter.currentPosition.y + 10;
    
    // Create pet body
    fighter.petSprite = this.add.ellipse(
      petX, 
      petY,
      petSize.width,
      petSize.height,
      petColor
    );
    
    // Create pet shadow
    fighter.petShadow = this.add.ellipse(
      petX,
      petY + 15,
      petSize.width * 0.8,
      petSize.height * 0.3,
      0x000000,
      0.3
    );
    
    // Add pet label
    const petName = petType.replace('dog', 'Dog ');
    fighter.petLabel = this.add.text(
      petX,
      petY - 20,
      petName.charAt(0).toUpperCase() + petName.slice(1),
      { fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5);
    
    fighter.petSprite.setDepth(fighter.sprite.depth - 1);
    fighter.petShadow.setDepth(fighter.shadow.depth);
    fighter.petLabel.setDepth(fighter.sprite.depth + 1);
  }
  
  createWeaponSprite(x, y, weaponType, scale, side) {
    // Check if we have asset for this weapon type
    if (weaponType === 'sword' || weaponType === 'hammer') {
      // Use existing assets
      const weaponSprite = this.add.image(x, y, weaponType + 'Weapon');
      weaponSprite.setScale(side === 'right' ? -scale : scale, scale);
      weaponSprite.setOrigin(0.5, 1);
      return weaponSprite;
    }
    
    // Create procedural weapons for new types
    const weaponContainer = this.add.container(x, y);
    const weapons = this.createProceduralWeapon(weaponType, scale, side);
    weapons.forEach(part => weaponContainer.add(part));
    
    return weaponContainer;
  }
  
  createProceduralWeapon(weaponType, scale, side) {
    const parts = [];
    const flipX = side === 'right' ? -1 : 1;
    
    switch (weaponType) {
      case 'axe':
        // Axe handle (brown)
        const axeHandle = this.add.rectangle(0, 0, 8 * scale, 60 * scale, 0x8B4513);
        parts.push(axeHandle);
        
        // Axe blade (steel gray)
        const axeBlade = this.add.polygon(0, -25 * scale, [
          [-15 * scale * flipX, -10 * scale],
          [15 * scale * flipX, -10 * scale], 
          [20 * scale * flipX, 0],
          [15 * scale * flipX, 10 * scale],
          [-10 * scale * flipX, 10 * scale]
        ], 0xC0C0C0);
        parts.push(axeBlade);
        
        // Axe edge highlight
        const axeEdge = this.add.rectangle(20 * scale * flipX, -25 * scale, 3 * scale, 20 * scale, 0xFFFFFF);
        parts.push(axeEdge);
        break;
        
      case 'spear':
        // Spear shaft (brown)
        const spearShaft = this.add.rectangle(0, 0, 6 * scale, 80 * scale, 0x8B4513);
        parts.push(spearShaft);
        
        // Spear tip (steel)
        const spearTip = this.add.polygon(0, -40 * scale, [
          [0, -20 * scale],
          [-8 * scale, -5 * scale],
          [8 * scale, -5 * scale]
        ], 0xC0C0C0);
        parts.push(spearTip);
        
        // Spear tip highlight
        const spearHighlight = this.add.rectangle(0, -50 * scale, 2 * scale, 15 * scale, 0xFFFFFF);
        parts.push(spearHighlight);
        break;
        
      case 'dagger':
        // Dagger handle (black)
        const daggerHandle = this.add.rectangle(0, 10 * scale, 4 * scale, 25 * scale, 0x333333);
        parts.push(daggerHandle);
        
        // Dagger crossguard (steel)
        const daggerGuard = this.add.rectangle(0, -5 * scale, 15 * scale, 3 * scale, 0xC0C0C0);
        parts.push(daggerGuard);
        
        // Dagger blade (steel)
        const daggerBlade = this.add.polygon(0, -25 * scale, [
          [0, -25 * scale],
          [-4 * scale, -10 * scale],
          [-3 * scale, 5 * scale],
          [3 * scale, 5 * scale],
          [4 * scale, -10 * scale]
        ], 0xC0C0C0);
        parts.push(daggerBlade);
        
        // Blade highlight
        const daggerHighlight = this.add.rectangle(0, -25 * scale, 2 * scale, 30 * scale, 0xFFFFFF);
        parts.push(daggerHighlight);
        break;
        
      case 'staff':
        // Staff shaft (dark brown)
        const staffShaft = this.add.rectangle(0, 0, 8 * scale, 90 * scale, 0x654321);
        parts.push(staffShaft);
        
        // Staff top orb (mystical blue)
        const staffOrb = this.add.circle(0, -45 * scale, 10 * scale, 0x4169E1);
        parts.push(staffOrb);
        
        // Orb glow effect
        const staffGlow = this.add.circle(0, -45 * scale, 12 * scale, 0x87CEEB, 0.3);
        parts.push(staffGlow);
        
        // Staff rings (gold)
        const ring1 = this.add.rectangle(0, -20 * scale, 10 * scale, 3 * scale, 0xFFD700);
        const ring2 = this.add.rectangle(0, 20 * scale, 10 * scale, 3 * scale, 0xFFD700);
        parts.push(ring1, ring2);
        
        // Add subtle glow animation to staff orb
        this.tweens.add({
          targets: staffGlow,
          alpha: 0.1,
          duration: 1500,
          yoyo: true,
          repeat: -1
        });
        break;
        
      case 'bow':
        // Bow body (wood)
        const bowBody = this.add.arc(0, 0, 40 * scale, 0, Math.PI, false, 0x8B4513);
        bowBody.setStrokeStyle(4 * scale, 0x8B4513);
        parts.push(bowBody);
        
        // Bow string
        const bowString = this.add.line(0, 0, 0, -35 * scale, 0, 35 * scale, 0xDDDDDD);
        bowString.setLineWidth(2 * scale);
        parts.push(bowString);
        
        // Arrow nocked
        const arrowShaft = this.add.rectangle(-15 * scale * flipX, 0, 30 * scale, 2 * scale, 0x8B4513);
        const arrowHead = this.add.polygon(-30 * scale * flipX, 0, [
          [0, 0], [-8 * scale, -4 * scale], [-8 * scale, 4 * scale]
        ], 0xC0C0C0);
        parts.push(arrowShaft, arrowHead);
        break;
        
      case 'mace':
        // Mace handle (dark wood)
        const maceHandle = this.add.rectangle(0, 0, 6 * scale, 50 * scale, 0x654321);
        parts.push(maceHandle);
        
        // Mace head (spiked metal ball)
        const maceHead = this.add.circle(0, -25 * scale, 12 * scale, 0x666666);
        parts.push(maceHead);
        
        // Spikes on mace head
        for (let angle = 0; angle < 360; angle += 45) {
          const spikeX = Math.cos(angle * Math.PI / 180) * 12 * scale;
          const spikeY = -25 * scale + Math.sin(angle * Math.PI / 180) * 12 * scale;
          const spike = this.add.polygon(spikeX, spikeY, [
            [0, -6 * scale], [-2 * scale, 2 * scale], [2 * scale, 2 * scale]
          ], 0x888888);
          parts.push(spike);
        }
        break;
        
      case 'whip':
        // Whip handle (leather wrapped)
        const whipHandle = this.add.rectangle(0, 10 * scale, 5 * scale, 20 * scale, 0x654321);
        parts.push(whipHandle);
        
        // Whip cord (curved segments)
        for (let i = 0; i < 8; i++) {
          const segmentY = -5 * scale - (i * 8 * scale);
          const segmentX = Math.sin(i * 0.5) * 10 * scale * flipX;
          const segment = this.add.rectangle(segmentX, segmentY, 3 * scale, 6 * scale, 0x8B4513);
          parts.push(segment);
        }
        break;
        
      case 'trident':
        // Trident shaft (longer than spear)
        const tridentShaft = this.add.rectangle(0, 0, 5 * scale, 90 * scale, 0x8B4513);
        parts.push(tridentShaft);
        
        // Center prong
        const centerProng = this.add.polygon(0, -45 * scale, [
          [0, -25 * scale], [-3 * scale, -5 * scale], [3 * scale, -5 * scale]
        ], 0xC0C0C0);
        parts.push(centerProng);
        
        // Left and right prongs
        const leftProng = this.add.polygon(-8 * scale, -35 * scale, [
          [0, -20 * scale], [-3 * scale, 0], [3 * scale, 0]
        ], 0xC0C0C0);
        const rightProng = this.add.polygon(8 * scale, -35 * scale, [
          [0, -20 * scale], [-3 * scale, 0], [3 * scale, 0]
        ], 0xC0C0C0);
        parts.push(leftProng, rightProng);
        break;
        
      case 'katana':
        // Katana handle (wrapped grip)
        const katanaHandle = this.add.rectangle(0, 15 * scale, 4 * scale, 30 * scale, 0x2F2F2F);
        parts.push(katanaHandle);
        
        // Guard (tsuba)
        const katanaGuard = this.add.circle(0, 0, 6 * scale, 0xFFD700);
        parts.push(katanaGuard);
        
        // Curved blade
        const katanaBlade = this.add.polygon(0, -30 * scale, [
          [0, -30 * scale], [-2 * scale, -20 * scale], [-3 * scale, 0],
          [3 * scale, 0], [2 * scale, -20 * scale]
        ], 0xE6E6FA);
        parts.push(katanaBlade);
        
        // Blade edge highlight
        const katanaEdge = this.add.rectangle(-1 * scale, -30 * scale, 1 * scale, 30 * scale, 0xFFFFFF);
        parts.push(katanaEdge);
        break;
        
      case 'flail':
        // Flail handle
        const flailHandle = this.add.rectangle(0, 0, 6 * scale, 40 * scale, 0x654321);
        parts.push(flailHandle);
        
        // Chain links
        for (let i = 0; i < 4; i++) {
          const linkY = -20 * scale - (i * 6 * scale);
          const linkX = Math.sin(i * 0.8) * 8 * scale * flipX;
          const link = this.add.circle(linkX, linkY, 2 * scale, 0x666666);
          parts.push(link);
        }
        
        // Spiked ball at end
        const flailBall = this.add.circle(Math.sin(4 * 0.8) * 8 * scale * flipX, -44 * scale, 8 * scale, 0x444444);
        parts.push(flailBall);
        
        // Spikes on ball
        for (let angle = 0; angle < 360; angle += 60) {
          const spikeX = Math.sin(4 * 0.8) * 8 * scale * flipX + Math.cos(angle * Math.PI / 180) * 8 * scale;
          const spikeY = -44 * scale + Math.sin(angle * Math.PI / 180) * 8 * scale;
          const spike = this.add.polygon(spikeX, spikeY, [
            [0, -4 * scale], [-1 * scale, 1 * scale], [1 * scale, 1 * scale]
          ], 0x666666);
          parts.push(spike);
        }
        break;
    }
    
    return parts;
  }
  
  startCombat() {
    this.combatEnded = false;
    this.uiManager.updateUI();
    
    // Start the first turn immediately - engine manages turn state
    this.executeTurn();
  }
  
  scheduleNextTurn() {
    // Only schedule if combat hasn't ended
    if (!this.combatEnded) {
      // Clear any existing timers to prevent conflicts
      if (this.combatTimer) {
        this.combatTimer.destroy();
        this.combatTimer = null;
      }
      if (this.failsafeTimer) {
        this.failsafeTimer.destroy();
        this.failsafeTimer = null;
      }
      
      // Force reset turn progress flag if it's stuck
      if (this.combatEngine.turnInProgress) {
        this.combatEngine.turnInProgress = false;
      }
      
      // Schedule the next turn with proper timing
      // Official LaBrute has a pause between turns for readability
      this.combatTimer = this.time.delayedCall(500, () => {
        this.executeTurn();
      });
    }
  }

  executeTurn() {
    // Check if combat has ended
    if (this.combatEnded) {
      return;
    }
    
    // Wrap in try-catch to prevent combat from stopping on errors
    try {
      // Additional safety check - if engine is somehow stuck, reset it
      if (this.combatEngine.turnInProgress) {
        console.warn("Turn was stuck in progress, forcing reset");
        this.combatEngine.turnInProgress = false;
      }
      
      const result = this.combatEngine.executeTurn();
    
    // Only proceed if we got a valid result from the engine
    if (!result) {
      console.warn("Combat engine returned null result, forcing next turn");
      // Force schedule next turn if result is null to prevent stalling
      this.time.delayedCall(200, () => {
        this.scheduleNextTurn();
      });
      return;
    }
    
    this.animateAction(result);
    this.animateParallaxMovement(result);
    this.uiManager.updateUI();
    this.uiManager.addCombatLog(result.message);
    
    // Handle special move unlock notification
    if (result.unlockedMove) {
      this.showSpecialMoveUnlock(result.attacker, result.unlockedMove);
    }
    
    // Animate multi-attack if it occurred
    if (result.multiAttack) {
      this.time.delayedCall(500, () => { // Delay for the second hit
        this.animateAction(result.multiAttack);
        this.uiManager.addCombatLog(result.multiAttack.message);
        this.uiManager.updateUI();
      });
    }
    
    // Animate pet assistance if it occurred
    if (result.petAssist) {
      this.time.delayedCall(700, () => { // Delay after multi-attack
        this.animatePetAssistance(result.petAssist);
        this.uiManager.addCombatLog(result.petAssist.message);
        this.uiManager.updateUI();
      });
    }
    
    if (result.gameOver) {
      this.combatEnded = true;
      this.endCombat(result.winner, result.achievements);
    } else {
      // Always schedule next turn after animations finish - Like official
      // Add proper delays for readability
      let scheduleDelay = 400; // Base delay for normal attacks
      
      if (result.petAssist) {
        scheduleDelay = 600; // More time for pet actions
      } else if (result.multiAttack) {
        scheduleDelay = 500; // More time for multi-attacks
      } else if (result.type === 'block' || result.type === 'dodge') {
        scheduleDelay = 300; // Defensive actions need less time
      }
      
      this.time.delayedCall(scheduleDelay, () => {
        this.scheduleNextTurn();
      });
      
      // Failsafe - if no turn happens within reasonable time, force one
      this.failsafeTimer = this.time.delayedCall(scheduleDelay + 1000, () => {
        if (!this.combatEnded && !this.combatEngine.turnInProgress) {
          console.warn("Failsafe triggered - forcing next turn");
          this.scheduleNextTurn();
        }
      });
    }
    } catch (error) {
      console.error("Error during turn execution:", error);
      // Force next turn even on error
      this.scheduleNextTurn();
    }
  }

  calculateAttackDuration(attacker, target) {
    // Calculate distance between fighters
    const distance = Math.abs(target.sprite.x - attacker.sprite.x);
    
    // Base duration based on distance
    let runDuration = 300 + (distance * 0.5);
    
    // Weapon-specific speeds
    if (attacker.weaponType === 'sword') {
      runDuration *= 0.8;
    } else if (attacker.weaponType === 'hammer') {
      runDuration *= 1.2;
    } else if (attacker.weaponType === 'dagger') {
      runDuration *= 0.6;
    } else if (attacker.weaponType === 'axe') {
      runDuration *= 1.0;
    }
    
    // Special move modifiers
    const hasRage = attacker.specialMoves && attacker.specialMoves.active && attacker.specialMoves.active.berserkerRage;
    if (hasRage) {
      runDuration *= 0.7;
    }
    
    return Math.min(600, Math.max(200, runDuration)); // Clamp between 200-600ms
  }

  animateAction(result) {
    const attacker = result.attacker;
    const target = result.target;
    
    // MANDATORY feedback guarantee - always ensure some visual response occurs
    this.guaranteeVisualFeedback(result);
    
    // Show combo effect if present
    if (result.combo) {
      this.showComboEffect(attacker, result.combo);
    }
    
    // DEBUG: Log pour comprendre les shakes
    console.log(`AnimateAction: type=${result.type}, hit=${result.hit}, damage=${result.damage || 0}`);
    
    // NE PAS faire le shake ici - le faire au moment de l'impact dans performAttackAnimation
    // Sauf pour les blocks qui sont immédiats
    if (result.type === 'block') {
      console.log('SHAKE: Block (light)');
      this.shakeLight();
    }
    
    if (result.type === 'attack') {
      // Direct attack regardless of lane - fighters can strike across lanes
      this.performAttackAnimation(result);
    } else if (result.type === 'multi_attack') {
      this.performAttackAnimation(result, true); // Mark as extra attack
    } else if (result.type === 'throw') {
      // Weapon throw animation
      this.performWeaponThrowAnimation(result);
    } else if (result.type === 'block') {
      // The attacker performs their attack, but the target blocks it
      // Calculate timing based on attack animation duration
      const runDuration = this.calculateAttackDuration(result.attacker, result.target);
      
      // Start attack animation
      this.performAttackAnimation(result);
      
      // Delay block animation to trigger when attacker reaches the target
      this.time.delayedCall(runDuration * 0.7, () => {
        this.performBlockAnimation(target);
      });
    } else if (result.type === 'dodge') {
      // GUARANTEED dodge animation - multiple fallback systems
      console.log(`${target.stats.name} should dodge ${result.dodgedAction}`);
      
      if (result.dodgedAction === 'throw') {
        // For weapon throws, calculate flight time
        const throwDuration = 600; // Standard throw duration
        this.performWeaponThrowAnimation(result);
        
        // Dodge EARLIER for weapon throws (50% of flight time)
        this.guaranteeDodgeAnimation(target, result.dodgedAction, throwDuration * 0.5);
      } else {
        // For normal attacks, calculate run duration
        const runDuration = this.calculateAttackDuration(result.attacker, result.target);
        this.performAttackAnimation(result);
        
        // Dodge EARLIER when attacker is approaching (60% of run time)
        this.guaranteeDodgeAnimation(target, result.dodgedAction, runDuration * 0.6);
      }
    } else if (result.type === 'special') {
      // Special move animation
      this.animateSpecialMove(result);
    } else if (result.type === 'rest') {
      // Subtle movement during rest
      // Fighter now remains stationary during rest to prevent vertical bobbing
    } else if (result.type === 'backup_attack') {
      // Backup brute attack animation
      this.animateBackupAttack(result);
    } else if (result.type === 'backup_arrive') {
      // Backup arrival animation
      this.animateBackupArrival(result);
    } else if (result.type === 'backup_leave') {
      // Backup departure animation
      this.animateBackupDeparture(result);
    }
  }
  
  animatePetAssistance(result) {
    const pet = result.pet;
    const owner = result.owner;
    const target = result.target;
    
    if (!owner.petSprite || !target.sprite) {
      console.warn("Pet sprite not found for assistance animation");
      return;
    }
    
    // Calculate pet attack position
    const targetX = target.sprite.x;
    const targetY = target.sprite.y;
    const attackX = targetX + (owner.side === 'left' ? -30 : 30);
    
    // Animate pet attack
    this.tweens.add({
      targets: [owner.petSprite, owner.petShadow, owner.petLabel],
      x: attackX,
      y: targetY,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onYoyo: () => {
        // Apply damage effect
        if (result.damage > 0) {
          // GUARANTEED feedback for pet attacks
          this.executeGuaranteedHitFeedback(target, owner, result);
        }
        
        // Show special effect
        if (result.specialEffect) {
          this.showPetSpecialEffect(target, result.specialEffect);
        }
      }
    });
  }
  
  showComboEffect(attacker, comboCount) {
    const x = attacker.sprite.x;
    const y = attacker.sprite.y - 60;
    
    const comboText = this.add.text(x, y, `COMBO x${comboCount}!`, {
      fontSize: '24px',
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add screen shake for big combos
    if (comboCount >= 4) {
      this.cameras.main.shake(200, 0.01 * comboCount);
    }
    
    // Animate combo text
    this.tweens.add({
      targets: comboText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: comboText,
          y: y - 30,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => comboText.destroy()
        });
      }
    });
    
    // Flash attacker sprite for combo
    const flashColors = [0xffaa00, 0xffffff, 0xffaa00];
    let flashIndex = 0;
    const flashTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (flashIndex < flashColors.length) {
          attacker.sprite.setTint(flashColors[flashIndex]);
          flashIndex++;
        } else {
          attacker.sprite.clearTint();
          flashTimer.remove();
        }
      },
      repeat: flashColors.length
    });
  }
  
  showPetSpecialEffect(target, effect) {
    const x = target.sprite.x;
    const y = target.sprite.y - 30;
    
    let effectColor, effectText;
    switch(effect) {
      case 'bleed':
        effectColor = 0xff0000;
        effectText = 'BLEED';
        break;
      case 'stun':
        effectColor = 0xffff00;
        effectText = 'STUNNED';
        break;
      case 'weaken':
        effectColor = 0x9900ff;
        effectText = 'WEAKENED';
        break;
      case 'shield':
        effectColor = 0x00ff00;
        effectText = 'SHIELDED';
        break;
      default:
        return;
    }
    
    const effectLabel = this.add.text(x, y, effectText, {
      fontSize: '14px',
      color: `#${effectColor.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: effectLabel,
      y: y - 20,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => effectLabel.destroy()
    });
  }
  
  performAttackAnimation(result, isMultiAttack = false) {
    const attacker = result.attacker;
    const target = result.target;
    
    // Safety check to ensure both fighters exist and have valid positions
    if (!attacker || !target || !attacker.sprite || !target.sprite) {
      console.warn("Invalid fighter data in attack animation");
      return;
    }
    
    // Get target's ACTUAL Y position instead of using potentially outdated lane
    // This fixes the bug where fighters attack empty space
    const targetLaneY = target.sprite.y; // Use real sprite position
    
    // Calculate exact attack position (close to target but not overlapping)
    const attackerX = attacker.sprite.x;
    const targetX = target.sprite.x;
    
    // Ensure we always move toward the opponent with minimum distance guarantee
    const minAttackDistance = 60; // Minimum distance to move for visual clarity
    let characterWidth = attacker.side === 'left' ? 50 : -50; // Attack distance
    
    // Force minimum movement distance if fighters are too close
    const currentDistance = Math.abs(targetX - attackerX);
    if (currentDistance < minAttackDistance) {
      characterWidth = attacker.side === 'left' ? minAttackDistance : -minAttackDistance;
    }
    
    const attackPositionX = targetX - characterWidth;
    
    // Validate attack position is actually different from current position
    const movementDistance = Math.abs(attackPositionX - attackerX);
    if (movementDistance < 10) {
      console.warn("Attack movement too small, forcing minimum movement");
      const forceMovement = attacker.side === 'left' ? 80 : -80;
      const forcedAttackPosition = targetX - forceMovement;
      
      // Force attack animation with guaranteed movement
      this.executeAttackMovement(attacker, target, forcedAttackPosition, targetLaneY, result, isMultiAttack, 300);
    } else {
      // Normal attack animation
      this.executeAttackMovement(attacker, target, attackPositionX, targetLaneY, result, isMultiAttack);
    }
  }
  
  executeAttackMovement(attacker, target, attackPositionX, targetLaneY, result, isMultiAttack = false, forcedDuration = null) {
    // Check for active special move effects on attacker
    const hasRage = attacker.specialMoves.active.berserkerRage;
    const hasVampiric = attacker.specialMoves.active.vampiricStrike;
    
    // Add rage glow effect with safety check
    if (hasRage) {
      if (attacker.sprite && attacker.sprite.setTint && typeof attacker.sprite.setTint === 'function') {
        attacker.sprite.setTint(0xff4444);
        this.time.delayedCall(500, () => {
          if (attacker.sprite && attacker.sprite.clearTint && typeof attacker.sprite.clearTint === 'function') {
            attacker.sprite.clearTint();
          }
        });
      }
    }
    
    // Calculate animation duration - Like LaBrute official
    // Calculate run duration based on distance like official LaBrute
    const distance = Math.abs(attackPositionX - attacker.sprite.x);
    let runDuration = forcedDuration || Math.max(
      300, 
      distance / 500 * 1000
    );
    
    if (!forcedDuration) {
      // Weapon-specific speeds
      if (attacker.weaponType === 'hammer') {
        runDuration *= 1.2; // Heavier weapons slower
      } else if (attacker.weaponType === 'dagger') {
        runDuration *= 0.8; // Light weapons faster
      }
      
      if (hasRage) {
        runDuration *= 0.7;
      }
    }
    
    // Guaranteed attack animation with failsafe
    const attackTween = this.tweens.add({
      targets: [attacker.sprite, attacker.weapon, attacker.shadow],
      x: attackPositionX, // Move to exact attack position
      y: targetLaneY, // Move to target's exact lane position
      duration: runDuration,
      ease: 'Linear', // No acceleration curve - constant speed
      onStart: () => {
        console.log(`${attacker.stats.name} attacking: moving from ${attacker.sprite.x} to ${attackPositionX}`);
        
        // Play run animation for warrior
        if (attacker.fighterType === 'warrior' && attacker.sprite.anims) {
          attacker.sprite.play('warrior_run_anim', true);
        } else {
          // Squash and stretch effect during run for non-warrior fighters
          if (attacker.sprite && attacker.sprite.setScale && typeof attacker.sprite.setScale === 'function') {
            attacker.sprite.setScale(
              attacker.sprite.scaleX * 0.9,
              Math.abs(attacker.sprite.scaleY) * 1.1
            );
          }
        }
      },
      onComplete: () => {
        this.handleAttackComplete(attacker, target, result, isMultiAttack, runDuration);
      }
    });
    
    // Failsafe: if animation doesn't complete within expected time, force completion
    this.time.delayedCall(runDuration + 200, () => {
      if (attackTween && attackTween.isPlaying()) {
        console.warn("Attack animation timeout, forcing completion");
        attackTween.stop();
        this.handleAttackComplete(attacker, target, result, isMultiAttack, runDuration);
      }
    });
  }
  
  handleAttackComplete(attacker, target, result, isMultiAttack, runDuration) {
    // Play attack animation for warrior
    if (attacker.fighterType === 'warrior' && attacker.sprite.anims) {
      const attackAnim = Math.random() < 0.5 ? 'warrior_attack1_anim' : 'warrior_attack2_anim';
      attacker.sprite.play(attackAnim);
      
      // Wait for attack animation to reach impact frame
      this.time.delayedCall(150, () => {
        // IMMEDIATE damage feedback on hit
        if (result.hit && result.damage > 0) {
          this.showDamageNumber(target, result.damage, result.critical || false);
        }
      });
    } else {
      // IMMEDIATE damage feedback on hit for non-warrior
      if (result.hit && result.damage > 0) {
        this.showDamageNumber(target, result.damage, result.critical || false);
      }
      // Reset scale after run with safety check
      if (attacker.sprite && attacker.sprite.setScale && typeof attacker.sprite.setScale === 'function') {
        const originalScale = attacker.fighterType === 'fight1' ? 0.12 : (attacker.fighterType === 'warrior' ? 0.6 : 0.25);
        attacker.sprite.setScale(
          attacker.side === 'left' ? originalScale : -originalScale,
          originalScale
        );
      }
    }
    
    // Enhanced hit detection - check for both hit flag and damage dealt
    const actuallyHit = result.hit || (result.damage && result.damage > 0);
    
    if (actuallyHit) {
      console.log(`Hit confirmed: ${attacker.stats.name} -> ${target.stats.name} for ${result.damage} damage`);
      
      // Ensure target sprite exists before applying effects
      if (!target.sprite || !target.sprite.active) {
        console.warn("Target sprite missing or inactive, skipping hit effects");
        // Still provide minimal feedback even if sprite is problematic
        this.cameras.main.shake(200, 0.015);
        return;
      }
      
      // Reduced hit reactions with gentler shaking
      const hitIntensity = result.damage > 25 ? 2 : 1;
      const hitDistance = (target.side === 'left' ? -12 : 12) * hitIntensity;
      
      // Store original position for safety
      const originalX = target.sprite.x;
      
      // No delay - we'll put the feedback in the knockback animation itself
      
      // Hit reaction animation - proper timing like official LaBrute
      const hitTween = this.tweens.add({
        targets: [target.sprite, target.weapon, target.shadow].filter(obj => obj && obj.active !== false),
        x: target.sprite.x + hitDistance,
        duration: 250, // 0.25s knockback like official
        yoyo: true,
        repeat: 0, // Single knockback
        ease: 'Power2.easeOut',
        delay: 50, // Small delay for impact to register
        onStart: () => {
          // Apply visual feedback at actual impact moment
          this.executeGuaranteedHitFeedback(target, attacker, result);
          
          // SHAKE ON IMPACT
          if (result.damage >= 20) {
            console.log('SHAKE ON HIT: Heavy');
            this.shakeHeavy();
          } else if (result.damage >= 10 || result.isCritical) {
            console.log('SHAKE ON HIT: Medium');
            this.shakeMedium();
          } else {
            console.log('SHAKE ON HIT: Light');
            this.shakeLight();
          }
        },
        onComplete: () => {
          
          // Ensure target returns to original position
          if (target.sprite && target.sprite.active) {
            target.sprite.x = originalX;
            if (target.weapon && target.weapon.x !== undefined) target.weapon.x = originalX + (target.side === 'left' ? -30 : 30);
            if (target.shadow && target.shadow.x !== undefined) target.shadow.x = originalX;
          }
        }
      });
      
      // Reduced failsafe timeout for faster recovery
      this.time.delayedCall(200, () => {
        if (hitTween && hitTween.isPlaying()) {
          console.warn("Hit animation timeout, forcing completion");
          hitTween.stop();
          if (target.sprite && target.sprite.active) {
            target.sprite.x = originalX;
          }
        }
      });
    } else {
      console.log(`Miss confirmed: ${attacker.stats.name} -> ${target.stats.name}`);
      // Miss animation with safety check
      if (attacker.sprite && attacker.sprite.active) {
        this.tweens.add({
          targets: attacker.sprite,
          rotation: (attacker.side === 'left' ? 0.1 : -0.1),
          duration: 150,
          yoyo: true
        });
      }
      
      // Miss visual effect - ONLY if it's not a dodge (dodge already has its own effect)
      if (result.type !== 'dodge') {
        this.showMissEffect(target);
      }
    }
    
    // Only return to position if it's not a multi-attack sequence
    if (!isMultiAttack) {
      this.returnToPosition(attacker, runDuration);
    } else {
      // Quick retract before next potential action - faster for multi-attacks
      this.tweens.add({
        targets: [attacker.sprite, attacker.weapon, attacker.shadow],
        x: attacker.baseX,
        duration: runDuration * 0.4, // Faster retract for multi-attack sequences
        ease: 'Power1.easeIn'
      });
    }
  }
  
  returnToPosition(attacker, runDuration) {
    // Play run animation for warrior during return
    if (attacker.fighterType === 'warrior' && attacker.sprite.anims) {
      attacker.sprite.play('warrior_run_anim', true);
    }
    
    // 40% chance to change position during return journey
    const shouldChangePosition = Math.random() < 0.4;
    let targetX = attacker.baseX;
    let targetY = attacker.baseY;
    
    if (shouldChangePosition) {
      // Choose a new random position in the fighter's zone
      const minX = attacker.side === 'left' ? this.combatZone.leftMinX : this.combatZone.rightMinX;
      const maxX = attacker.side === 'left' ? this.combatZone.leftMaxX : this.combatZone.rightMaxX;
      targetX = Phaser.Math.Between(minX, maxX);
      targetY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
      
      // Update base position
      attacker.baseX = targetX;
      attacker.baseY = targetY;
    }
    
    // Update current position
    attacker.currentPosition = { x: targetX, y: targetY };
    
    // Return animation with proper speed like official LaBrute
    const returnDistance = Math.abs(targetX - attacker.sprite.x);
    const returnDuration = Math.max(
      200, 
      returnDistance / 700 * 1000
    );
    
    this.tweens.add({
      targets: attacker.sprite,
      x: targetX,
      y: targetY,
      duration: returnDuration,
      ease: 'Power2.easeIn',
      onComplete: () => {
        // Switch back to idle animation for warrior
        if (attacker.fighterType === 'warrior' && attacker.sprite.anims) {
          attacker.sprite.play('warrior_idle_anim', true);
        }
        this.updateDepthOrdering();
      }
    });
    
    // Animate weapon
    this.tweens.add({
      targets: attacker.weapon,
      x: targetX + (attacker.side === 'left' ? -30 : 30),
      y: targetY - 80,
      duration: returnDuration,
      ease: 'Power2.easeIn'
    });
    
    // Animate shadow
    this.tweens.add({
      targets: attacker.shadow,
      x: targetX,
      y: targetY + this.getShadowOffset(targetY),
      scaleX: this.getShadowScale(targetY),
      scaleY: this.getShadowScale(targetY),
      duration: returnDuration,
      ease: 'Power2.easeIn'
    });
  }
  
  performDodgeAnimation(fighter, dodgeType = 'attack') {
    // Safety check to ensure fighter exists
    if (!fighter || !fighter.sprite) {
      console.warn("Invalid fighter data in dodge animation");
      return;
    }
    
    console.log(`Performing dodge animation for ${fighter.stats.name} (type: ${dodgeType})`);
    
    // Stop any existing tweens on this fighter to avoid conflicts
    this.tweens.killTweensOf([fighter.sprite, fighter.weapon, fighter.shadow]);
    
    // MASSIVE dodge distances for GUARANTEED visibility
    const dodgeDistance = dodgeType === 'throw' ? 
      (fighter.side === 'left' ? -150 : 150) : 
      (fighter.side === 'left' ? -120 : 120);
    
    const hopHeight = dodgeType === 'throw' ? -80 : -60; // BIG jump for visibility
    
    // Store original position for guaranteed return
    const originalX = fighter.sprite.x;
    const originalY = fighter.sprite.y;
    
    // Calculate absolute positions
    const dodgeX = originalX + dodgeDistance;
    const dodgeY = originalY + hopHeight;
    
    // Enhanced dodge animation with guaranteed execution
    const dodgeTween = this.tweens.add({
      targets: [fighter.sprite, fighter.weapon, fighter.shadow],
      x: dodgeX,
      y: dodgeY,
      duration: 300,
      yoyo: true,
      ease: 'Power2.easeOut',
      onStart: () => {
        console.log(`Dodge animation started for ${fighter.stats.name}`);
        
        // Create BIG DODGE text
        this.createBigDodgeText(fighter);
        // Multiple visual indicators
        this.createDodgeIndicator(fighter);
        
        // Quick squash effect with safety check
        if (fighter.sprite && fighter.sprite.setScale && typeof fighter.sprite.setScale === 'function') {
          fighter.sprite.setScale(
            fighter.sprite.scaleX * 1.1,
            Math.abs(fighter.sprite.scaleY) * 0.9
          );
        }
        
        // Create dodge trail effect
        this.createDodgeTrail(fighter);
      },
      onComplete: () => {
        console.log(`Dodge animation completed for ${fighter.stats.name}`);
        
        // Animation complete
        
        // Reset scale after dodge with safety check
        if (fighter.sprite && fighter.sprite.setScale && typeof fighter.sprite.setScale === 'function') {
          const originalScale = fighter.sprite.texture && fighter.sprite.texture.key === 'fight1' ? 0.12 : 0.25;
          fighter.sprite.setScale(
            fighter.side === 'left' ? originalScale : -originalScale,
            originalScale
          );
        }
        
        // Ensure fighter is back at original position (failsafe)
        fighter.sprite.x = originalX;
        fighter.weapon.x = fighter.weapon.x;
        fighter.shadow.x = fighter.shadow.x;
      }
    });
    
    // Failsafe: if animation doesn't complete within expected time, force completion
    this.time.delayedCall(400, () => {
      if (dodgeTween && dodgeTween.isPlaying()) {
        console.warn("Dodge animation timeout, forcing completion");
        dodgeTween.stop();
        
        // Reset fighter to original state
        const originalScale = fighter.sprite.texture.key === 'fight1' ? 0.12 : 0.25;
        fighter.sprite.setScale(
          fighter.side === 'left' ? originalScale : -originalScale,
          originalScale
        );
        fighter.sprite.x = originalX;
        fighter.sprite.y = originalY;
      }
    });
  }
  
  createDodgeTrail(fighter) {
    // Create a brief trail effect to make dodge more visible
    const trail = this.add.image(fighter.sprite.x, fighter.sprite.y, fighter.sprite.texture.key);
    trail.setScale(fighter.sprite.scaleX, fighter.sprite.scaleY);
    trail.setAlpha(0.4);
    // trail.setTint(0x88ffff); // Disabled color change
    trail.setDepth(fighter.sprite.depth - 1);
    
    this.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 300,
      onComplete: () => trail.destroy()
    });
  }
  
  performBlockAnimation(fighter) {
    // ENHANCED BLOCK animation with more visible movement
    if (fighter.sprite && fighter.sprite.active) {
      // Store original position
      const originalX = fighter.sprite.x;
      
      // Play guard animation for warrior
      if (fighter.fighterType === 'warrior' && fighter.sprite.anims) {
        fighter.sprite.play('warrior_guard_anim');
        // Stop guard animation after a short time
        this.time.delayedCall(800, () => {
          if (fighter.sprite && fighter.sprite.anims) {
            fighter.sprite.play('warrior_idle_anim', true);
          }
        });
      }
      
      // Block stance - fighter moves back slightly and braces
      this.tweens.add({
        targets: [fighter.sprite, fighter.weapon, fighter.shadow].filter(target => target && target.active),
        x: originalX + (fighter.side === 'left' ? -20 : 20), // Step back
        scaleX: fighter.sprite.scaleX * 1.1,
        scaleY: Math.abs(fighter.sprite.scaleY) * 0.9,
        duration: 150,
        yoyo: true,
        ease: 'Power2.easeOut',
        onStart: () => {
          // Add BLOCK! text indicator
          this.createBlockText(fighter);
        }
      });
      
      // Weapon raises to block position
      if (fighter.weapon) {
        this.tweens.add({
          targets: fighter.weapon,
          y: fighter.weapon.y - 20,
          rotation: fighter.side === 'left' ? -0.3 : 0.3,
          duration: 150,
          yoyo: true,
          ease: 'Power2.easeOut'
        });
      }
    }
    
    // Create a BIG shield visual effect
    const shieldX = fighter.side === 'left' ? fighter.sprite.x + 40 : fighter.sprite.x - 40;
    const shieldY = fighter.sprite.y - 50;
    const shieldEffect = this.add.graphics({ fillStyle: { color: 0x4488ff, alpha: 0.8 } });
    shieldEffect.fillCircle(0, 0, 50);
    shieldEffect.setPosition(shieldX, shieldY);
    shieldEffect.setDepth(fighter.sprite.depth + 1);
    
    // Animate shield appearing and disappearing
    this.tweens.add({
      targets: shieldEffect,
      scale: 1.8,
      alpha: 0,
      duration: 400,
      ease: 'Expo.easeOut',
      onComplete: () => {
        shieldEffect.destroy();
      }
    });
    
    // Flash effect on block
    this.flashScreen(0x4488ff, 0.2, 100);
  }
  
  createBlockText(fighter) {
    // Create BLOCK! text for visibility
    const blockText = this.add.text(
      fighter.sprite.x,
      fighter.sprite.y - 80,
      'BLOCK!', {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#4488ff',
      stroke: '#000000',
      strokeThickness: 4
    });
    blockText.setOrigin(0.5);
    blockText.setDepth(1000);
    
    this.tweens.add({
      targets: blockText,
      y: blockText.y - 30,
      scale: 1.2,
      alpha: 0,
      duration: 800,
      onComplete: () => blockText.destroy()
    });
  }
  animateSpecialMove(result) {
    const attacker = result.attacker;
    const moveData = result.specialMove;
    
    // Base special move glow with safety check
    const glowColor = this.getSpecialMoveColor(moveData.name);
    if (attacker.sprite && attacker.sprite.setTint && typeof attacker.sprite.setTint === 'function') {
      attacker.sprite.setTint(glowColor);
    }
    
    // Scale pulse effect with safety check
    if (attacker.sprite && attacker.sprite.active) {
      this.tweens.add({
        targets: attacker.sprite,
        scaleX: attacker.sprite.scaleX * 1.2,
        scaleY: Math.abs(attacker.sprite.scaleY) * 1.2,
        duration: 200,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (attacker.sprite && attacker.sprite.clearTint && typeof attacker.sprite.clearTint === 'function') {
            attacker.sprite.clearTint();
          }
        }
      });
    }
    
    // Specific special move effects (PAS de shake ici, seulement sur impact)
    switch (moveData.effect) {
      case 'damage_boost': // Berserker Rage
        this.createRageAura(attacker);
        break;
      case 'defense_boost': // Defensive Shield
        this.createShieldEffect(attacker);
        break;
      case 'lifesteal': // Vampiric Strike
        this.createVampiricAura(attacker);
        break;
      case 'stamina_accuracy': // Adrenaline Rush
        this.createAdrenalineEffect(attacker);
        break;
    }
    
    // Special move activation text
    this.showSpecialMoveText(attacker, moveData.name, glowColor);
  }
  
  createParticleEffect(x, y, color, count = 8) {
    // Use Phaser 3 particle emitter for better performance
    if (color === 0xff0000 || color === 0xff4444) {
      // Blood particles
      this.bloodParticles.setPosition(x, y);
      this.bloodParticles.explode(count);
    } else {
      // Spark particles for other colors
      this.sparkParticles.setPosition(x, y);
      this.sparkParticles.setParticleTint(color);
      this.sparkParticles.explode(count);
    }
  }

  createHealingEffect(fighter) {
    // Green healing particles rising from fighter
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(fighter.sprite.x + Phaser.Math.Between(-20, 20), 
        fighter.sprite.y + 20, 4, 0x00ff44);
      this.tweens.add({
        targets: particle,
        y: fighter.sprite.y - 60,
        alpha: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
  }
  
  getSpecialMoveColor(moveName) {
    switch (moveName) {
      case 'Berserker Rage': return 0xff4444;
      case 'Defensive Shield': return 0x4488ff;
      case 'Vampiric Strike': return 0x884488;
      case 'Adrenaline Rush': return 0xffff44;
      default: return 0xffffff;
    }
  }
  
  createRageAura(fighter) {
    // Red pulsing aura effect
    for (let i = 0; i < 8; i++) {
      const flame = this.add.circle(
        fighter.sprite.x + Phaser.Math.Between(-30, 30),
        fighter.sprite.y + Phaser.Math.Between(-40, 40),
        Phaser.Math.Between(8, 15), 0xff4444, 0.7
      );
      this.tweens.add({
        targets: flame,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 1000,
        onComplete: () => flame.destroy()
      });
    }
  }
  
  createShieldEffect(fighter) {
    // Use Graphics API for dynamic shield effect
    const shieldGraphics = this.add.graphics();
    shieldGraphics.setDepth(fighter.sprite.depth + 1);
    shieldGraphics.setBlendMode(Phaser.BlendModes.ADD);
    
    let shieldAlpha = 0.8;
    let shieldRadius = 40;
    
    // Animate shield
    const shieldTween = this.tweens.add({
      targets: { radius: shieldRadius, alpha: shieldAlpha },
      radius: 80,
      alpha: 0,
      duration: 1500,
      onUpdate: (tween) => {
        const values = tween.getValue();
        shieldGraphics.clear();
        
        // Draw hexagonal shield
        shieldGraphics.lineStyle(3, 0x4488ff, values.alpha);
        shieldGraphics.fillStyle(0x4488ff, values.alpha * 0.2);
        
        const sides = 6;
        const angleStep = (Math.PI * 2) / sides;
        
        shieldGraphics.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = i * angleStep;
          const x = fighter.sprite.x + Math.cos(angle) * values.radius;
          const y = fighter.sprite.y + Math.sin(angle) * values.radius;
          
          if (i === 0) {
            shieldGraphics.moveTo(x, y);
          } else {
            shieldGraphics.lineTo(x, y);
          }
        }
        shieldGraphics.closePath();
        shieldGraphics.fillPath();
        shieldGraphics.strokePath();
      },
      onComplete: () => shieldGraphics.destroy()
    });
  }
  
  createVampiricAura(fighter) {
    // Purple swirling effect using Graphics API
    const auraGraphics = this.add.graphics();
    auraGraphics.setDepth(fighter.sprite.depth - 1);
    auraGraphics.setBlendMode(Phaser.BlendModes.MULTIPLY);
    
    let rotation = 0;
    const spiralEvent = this.time.addEvent({
      delay: 30,
      callback: () => {
        auraGraphics.clear();
        
        // Draw spiraling vampiric tendrils
        for (let i = 0; i < 3; i++) {
          const angleOffset = (i * 120 * Math.PI) / 180;
          const spiralAngle = rotation + angleOffset;
          
          auraGraphics.lineStyle(4, 0x884488, 0.6);
          auraGraphics.beginPath();
          
          let lastX = fighter.sprite.x;
          let lastY = fighter.sprite.y;
          
          for (let r = 0; r < 60; r += 5) {
            const angle = spiralAngle + (r * 0.1);
            const x = fighter.sprite.x + Math.cos(angle) * r;
            const y = fighter.sprite.y + Math.sin(angle) * r;
            
            if (r === 0) {
              auraGraphics.moveTo(x, y);
            } else {
              auraGraphics.lineTo(x, y);
            }
          }
          
          auraGraphics.strokePath();
        }
        
        rotation += 0.1;
      },
      repeat: 50
    });
    
    // Fade out and cleanup
    this.time.delayedCall(1500, () => {
      spiralEvent.remove();
      this.tweens.add({
        targets: auraGraphics,
        alpha: 0,
        duration: 500,
        onComplete: () => auraGraphics.destroy()
      });
    });
    for (let i = 0; i < 6; i++) {
      const spiral = this.add.circle(fighter.sprite.x, fighter.sprite.y, 5, 0x884488, 0.8);
      const radius = 40;
      const startAngle = i * 60;
      
      this.tweens.add({
        targets: spiral,
        x: fighter.sprite.x + Math.cos(startAngle * Math.PI / 180) * radius,
        y: fighter.sprite.y + Math.sin(startAngle * Math.PI / 180) * radius,
        alpha: 0,
        duration: 1000,
        onComplete: () => spiral.destroy()
      });
    }
  }
  
  createAdrenalineEffect(fighter) {
    // Yellow lightning-like effect
    for (let i = 0; i < 10; i++) {
      const lightning = this.add.circle(
        fighter.sprite.x + Phaser.Math.Between(-25, 25),
        fighter.sprite.y + Phaser.Math.Between(-50, 20),
        2, 0xffff44
      );
      this.tweens.add({
        targets: lightning,
        x: lightning.x + Phaser.Math.Between(-15, 15),
        y: lightning.y + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 300,
        onComplete: () => lightning.destroy()
      });
    }
  }
  
  showSpecialMoveText(fighter, moveName, color) {
    const text = this.add.text(fighter.sprite.x, fighter.sprite.y - 80, moveName, {
      fontSize: '18px',
      fill: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }
  
  showSpecialMoveUnlock(fighter, move) {
    // Bright unlock notification
    const unlockText = this.add.text(fighter.sprite.x, fighter.sprite.y - 100, 
      `NEW MOVE UNLOCKED!\n${move.name}`, {
      fontSize: '16px',
      fill: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'Arial Black',
      align: 'center'
    }).setOrigin(0.5);
    
    // Sparkling effect around fighter
    for (let i = 0; i < 15; i++) {
      const spark = this.add.star(
        fighter.sprite.x + Phaser.Math.Between(-60, 60),
        fighter.sprite.y + Phaser.Math.Between(-60, 60),
        5, 10, 20, 0xffdd00
      );
      this.tweens.add({
        targets: spark,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 1200,
        onComplete: () => spark.destroy()
      });
    }
    
    this.tweens.add({
      targets: unlockText,
      y: unlockText.y - 40,
      alpha: 0,
      duration: 2500,
      onComplete: () => unlockText.destroy()
    });
  }
  
  createDodgeIndicator(fighter) {
    // Create smaller dodge indicator
    const indicator = this.add.text(
      fighter.sprite.x,
      fighter.sprite.y - 70,
      'DODGE', {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    indicator.setOrigin(0.5);
    indicator.setDepth(1000);
    
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => indicator.destroy()
    });
  }

  createBigDodgeText(fighter) {
    // Create MASSIVE DODGE text for guaranteed visibility
    const dodgeText = this.add.text(
      fighter.sprite.x,
      fighter.sprite.y - 100,
      'DODGE!', {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 6
    });
    dodgeText.setOrigin(0.5);
    dodgeText.setDepth(1001);
    
    // Animate the text
    this.tweens.add({
      targets: dodgeText,
      y: dodgeText.y - 50,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => dodgeText.destroy()
    });
    
    // Add secondary dodge indicator
    const dodgeCircle = this.add.circle(fighter.sprite.x, fighter.sprite.y, 50, 0x00ffff, 0.3);
    dodgeCircle.setDepth(998);
    this.tweens.add({
      targets: dodgeCircle,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => dodgeCircle.destroy()
    });
  }

  performWeaponThrowAnimation(result) {
    const attacker = result.attacker;
    const target = result.target;
    
    // Store original weapon position for animation
    const weaponStartX = attacker.weapon.x;
    const weaponStartY = attacker.weapon.y;
    const weaponTargetX = target.sprite.x;
    const weaponTargetY = target.sprite.y - 20;
    
    // Ensure weapon is EXTREMELY visible during throw
    attacker.weapon.setDepth(1000); // Bring weapon to front
    attacker.weapon.setScale(Math.abs(attacker.weapon.scaleX) * 2.0, Math.abs(attacker.weapon.scaleY) * 2.0); // Make weapon much larger
    
    // Add bright pulsing glow to weapon - handle both image sprites and containers
    if (attacker.weapon.setTint && typeof attacker.weapon.setTint === 'function') {
      // For image-based weapons (sword, hammer)
      attacker.weapon.setTint(0xffffff); // Bright white glow
    } else if (attacker.weapon.list) {
      // For container-based procedural weapons
      attacker.weapon.list.forEach(part => {
        if (part.setTint && typeof part.setTint === 'function') {
          part.setTint(0xffffff); // Bright white glow
        }
      });
    }
    
    // Create a glowing aura around the weapon for maximum visibility
    const weaponGlow = this.add.circle(attacker.weapon.x, attacker.weapon.y, 40, 0xffff00, 0.6);
    weaponGlow.setDepth(999); // Behind weapon but in front of everything else
    weaponGlow.setBlendMode(Phaser.BlendModes.ADD); // Additive blending for glow effect
    
    // Attacker throwing motion
    this.tweens.add({
      targets: attacker.sprite,
      rotation: (attacker.side === 'left' ? 0.3 : -0.3),
      scaleY: Math.abs(attacker.sprite.scaleY) * 1.1, // Stretch during throw
      duration: 200,
      yoyo: true,
      onStart: () => {
        // Add throwing effect tint with safety check
        if (attacker.sprite && attacker.sprite.setTint && typeof attacker.sprite.setTint === 'function') {
          attacker.sprite.setTint(0xffaa44);
        }
      },
      onComplete: () => {
        if (attacker.sprite && attacker.sprite.clearTint && typeof attacker.sprite.clearTint === 'function') {
          attacker.sprite.clearTint();
        }
        if (attacker.sprite) {
          attacker.sprite.rotation = 0;
        }
      }
    });
    
    // Calculate throw trajectory - much faster
    const distance = Math.abs(weaponTargetX - weaponStartX);
    const throwDuration = 350 + (distance / 5.0); // Much faster throw
    
    // Create enhanced weapon trail effect for maximum visibility
    this.createWeaponTrail(attacker.weapon, weaponStartX, weaponStartY, weaponTargetX, weaponTargetY, throwDuration);
    
    // Animate the glowing aura to follow the weapon
    this.tweens.add({
      targets: weaponGlow,
      x: weaponTargetX,
      y: weaponTargetY - 30,
      duration: throwDuration * 0.7,
      ease: 'Power2.easeOut',
      onComplete: () => {
        weaponGlow.destroy(); // Clean up the glow effect
      }
    });
    
    // Weapon projectile animation with dramatic spinning
    this.tweens.add({
      targets: attacker.weapon,
      x: weaponTargetX,
      y: weaponTargetY - 30, // Arc trajectory
      rotation: attacker.weapon.rotation + (attacker.side === 'left' ? 6 * Math.PI : -6 * Math.PI), // More rotation
      duration: throwDuration * 0.7,
      ease: 'Power2.easeOut',
      onStart: () => {
        // Add dramatic pulsing glow effect during flight
        this.tweens.add({
          targets: attacker.weapon,
          alpha: 1.0,
          duration: 100,
          yoyo: true,
          repeat: Math.floor((throwDuration * 0.7) / 200)
        });
        
        // Add screen flash effect when weapon is thrown
        const throwFlash = this.add.rectangle(512, 384, 1024, 768, 0xffff00, 0.2);
        this.tweens.add({
          targets: throwFlash,
          alpha: 0,
          duration: 200,
          onComplete: () => throwFlash.destroy()
        });
      },
      onComplete: () => {
        // Reset weapon visual effects - handle both image sprites and containers
        if (attacker.weapon.clearTint && typeof attacker.weapon.clearTint === 'function') {
          // For image-based weapons (sword, hammer)
          attacker.weapon.clearTint();
        } else if (attacker.weapon.list) {
          // For container-based procedural weapons
          attacker.weapon.list.forEach(part => {
            if (part.clearTint && typeof part.clearTint === 'function') {
              part.clearTint();
            }
          });
        }
        attacker.weapon.setAlpha(1);
        
        // Weapon hits or misses
        if (result.hit) {
          // Impact effects
          this.createWeaponImpactEffect(weaponTargetX, weaponTargetY - 30, result.damage);
          
          // No delay here - we'll put feedback in the knockback animation
          
          // Target hit reaction - reduced intensity for thrown weapons
          const hitIntensity = result.damage > 30 ? 3 : 2;
          const hitDistance = (target.side === 'left' ? -18 : 18) * hitIntensity;
          
          this.tweens.add({
            targets: [target.sprite, target.shadow],
            x: target.sprite.x + hitDistance,
            rotation: target.sprite.rotation + (target.side === 'left' ? -0.08 : 0.08),
            duration: 100,
            yoyo: true,
            repeat: hitIntensity,
            ease: 'Power2.easeInOut',
            onStart: () => {
              // Apply visual feedback when knockback starts (this is the actual impact moment)
              this.executeGuaranteedHitFeedback(target, attacker, result);
              
              // SHAKE ON IMPACT - Right when weapon hits
              console.log('SHAKE ON THROW HIT: Medium');
              this.shakeMedium();
            },
            onComplete: () => {
              
              // Tint disabled - no color changes
              if (target.sprite) {
                target.sprite.rotation = 0;
              }
            }
          });
          
          // Shake déjà géré dans animateAction()
          
          // GUARANTEED feedback for weapon throw hits - moved to onStart of hit animation above
        } else {
          // Miss effect - weapon flies past target with continued visibility
          this.tweens.add({
            targets: attacker.weapon,
            x: weaponTargetX + (attacker.side === 'left' ? 120 : -120),
            y: weaponTargetY + 60,
            rotation: attacker.weapon.rotation + (attacker.side === 'left' ? 2 * Math.PI : -2 * Math.PI),
            duration: 300,
            ease: 'Power1.easeIn',
            onComplete: () => {
              // Weapon embeds in ground or wall with bounce effect
              this.tweens.add({
                targets: attacker.weapon,
                rotation: attacker.weapon.rotation + (attacker.side === 'left' ? 0.2 : -0.2),
                duration: 100,
                yoyo: true,
                repeat: 2
              });
            }
          });
        }
        
        // Slower weapon disappearing to ensure visibility
        this.time.delayedCall(400, () => {
          this.tweens.add({
            targets: attacker.weapon,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            ease: 'Power1.easeIn',
            onComplete: () => {
              attacker.weapon.setVisible(false);
              // Reset weapon properties for next fight
              attacker.weapon.setDepth(attacker.sprite.depth + 1);
            }
          });
        });
        
        // Show weapon lost notification
        this.showWeaponLostText(attacker);
      }
    });
    
    // Arc trajectory for weapon (parabolic motion)
    this.tweens.add({
      targets: attacker.weapon,
      y: weaponTargetY - 60, // Higher arc
      duration: throwDuration * 0.5,
      ease: 'Power2.easeOut',
      yoyo: true
    });
  }
  
  createWeaponTrail(weapon, startX, startY, targetX, targetY, duration) {
    // Use render texture for smooth weapon trail
    const trailGraphics = this.add.graphics();
    trailGraphics.setDepth(weapon.depth - 1);
    
    // Draw weapon trail using Graphics API
    let lastX = startX;
    let lastY = startY;
    let trailAlpha = 0.8;
    
    // Create trail update event
    const trailEvent = this.time.addEvent({
      delay: 16, // 60 FPS update
      callback: () => {
        if (!weapon.active) {
          trailEvent.remove();
          this.time.delayedCall(500, () => trailGraphics.destroy());
          return;
        }
        
        // Draw trail segment
        trailGraphics.lineStyle(4, 0xffaa00, trailAlpha);
        trailGraphics.beginPath();
        trailGraphics.moveTo(lastX, lastY);
        trailGraphics.lineTo(weapon.x, weapon.y);
        trailGraphics.strokePath();
        
        // Update for next segment
        lastX = weapon.x;
        lastY = weapon.y;
        trailAlpha *= 0.95; // Fade trail over time
        
        // Draw to render texture for persistence
        this.trailTexture.draw(trailGraphics);
        trailGraphics.clear();
      },
      repeat: -1
    });
    
    // Clear trail texture after throw completes
    this.time.delayedCall(duration + 1000, () => {
      this.tweens.add({
        targets: this.trailTexture,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.trailTexture.clear();
          this.trailTexture.setAlpha(0.8);
        }
      });
    });
  }
  
  createWeaponImpactEffect(x, y, damage) {
    // Create impact explosion based on damage
    const particleCount = Math.min(20, 8 + Math.floor(damage / 3));
    const colors = [0xff6600, 0xff3300, 0xffaa00, 0xff9900];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.circle(x, y, 
        Phaser.Math.Between(3, 8), 
        Phaser.Utils.Array.GetRandom(colors)
      );
      
      const angle = (i / particleCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.5, 0.5);
      const speed = Phaser.Math.Between(30, 80);
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;
      
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: Phaser.Math.Between(400, 700),
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    
    // Central impact flash
    const flash = this.add.circle(x, y, 25, 0xffffff, 0.8);
    this.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy()
    });
    
    // Impact shockwave
    const shockwave = this.add.circle(x, y, 5, 0xff6600, 0.6);
    shockwave.setStrokeStyle(3, 0xffaa00);
    this.tweens.add({
      targets: shockwave,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 300,
      ease: 'Power1.easeOut',
      onComplete: () => shockwave.destroy()
    });
  }
  
  showWeaponLostText(fighter) {
    const lostText = this.add.text(fighter.sprite.x, fighter.sprite.y - 100, 'WEAPON LOST!', {
      fontSize: '16px',
      fill: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: lostText,
      y: lostText.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => lostText.destroy()
    });
  }
  
  showDamageNumber(target, damage, isCritical = false) {
    const color = isCritical ? '#ffff00' : '#ff4444';
    const text = isCritical ? `${damage} CRIT!` : `${damage}`;
    
    const damageText = this.add.text(target.sprite.x, target.sprite.y - 50, text, {
      fontSize: '20px',
      fill: color,
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => damageText.destroy()
    });
  }
  
  executeGuaranteedHitFeedback(target, attacker, result) {
    // MANDATORY feedback system that ALWAYS triggers on damage
    console.log(`Executing guaranteed hit feedback: ${result.damage} damage`);
    
    // 1. MANDATORY screen shake - gentler and scaled to damage
    const shakeIntensity = Math.min(0.006, 0.002 + (result.damage * 0.00005));
    const shakeDuration = Math.min(150, 50 + (result.damage * 1.5));
    this.cameras.main.shake(shakeDuration, shakeIntensity);
    
    // 2. MANDATORY damage number - always shows
    this.showDamageNumber(target, result.damage, result.critical || false);
    
    // 3. MANDATORY particle effect - always creates
    this.createParticleEffect(target.sprite.x, target.sprite.y - 30, 0xff0000, 8);
    
    // 4. MANDATORY visual feedback through multiple systems
    this.createHitFeedback(target, result.damage);
    
    // 5. Special effects based on attacker state
    const hasRage = attacker.specialMoves && attacker.specialMoves.active && attacker.specialMoves.active.berserkerRage;
    const hasVampiric = attacker.specialMoves && attacker.specialMoves.active && attacker.specialMoves.active.vampiricStrike;
    
    if (hasRage) {
      this.createParticleEffect(target.sprite.x, target.sprite.y - 30, 0xff4444, 12);
    }
    
    if (hasVampiric) {
      this.createHealingEffect(attacker);
    }
    
    console.log(`Guaranteed hit feedback completed`);
  }
  
  createHitFeedback(target, damage) {
    // Multi-layered hit feedback to ensure visibility
    
    // 1. Target tint flash with proper timing
    if (target.sprite && target.sprite.setTint && typeof target.sprite.setTint === 'function') {
      target.sprite.setTint(0xff3333);
      this.time.delayedCall(200, () => {
        if (target.sprite && target.sprite.clearTint && typeof target.sprite.clearTint === 'function') {
          target.sprite.clearTint();
        }
      });
    }
    
    // 2. Impact flash at hit location - ALWAYS create regardless of sprite state
    const flash = this.add.circle(target.sprite.x, target.sprite.y - 20, 15, 0xffffff, 0.8);
    this.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy()
    });
    
    // 3. Force particle effect regardless of other conditions
    this.createParticleEffect(target.sprite.x, target.sprite.y - 30, 0xff4444, 6);
  }
  
  showMissEffect(target) {
    // BIG visual indication of miss
    const missText = this.add.text(target.sprite.x, target.sprite.y - 60, 'MISS!', {
      fontSize: '36px',
      fill: '#ff9999',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    missText.setDepth(1000);
    
    // Add miss circle effect
    const missCircle = this.add.circle(target.sprite.x, target.sprite.y, 30, 0xff0000, 0.2);
    missCircle.setDepth(999);
    
    this.tweens.add({
      targets: missText,
      y: missText.y - 40,
      scale: 1.3,
      alpha: 0,
      duration: 1000,
      onComplete: () => missText.destroy()
    });
    
    this.tweens.add({
      targets: missCircle,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => missCircle.destroy()
    });
  }
  
  animateParallaxMovement(result) {
    // Parallax movement removed since decorative backgrounds are no longer present
    // This method can be used for other atmospheric effects if needed
  }
  
  endCombat(winner, achievements = []) {
    if (this.combatTimer) {
      this.combatTimer.destroy();
    }
    
    
    // Victory animation
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
    
    this.add.text(512, 650, 'NEW FIGHT', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
  }
  
  moveToLane(fighter, targetLane, callback = null) {
    // Compatibilité avec l'ancien système - redirige vers moveToPosition
    const targetY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
    const targetX = fighter.side === 'left' 
      ? Phaser.Math.Between(this.combatZone.leftMinX, this.combatZone.leftMaxX)
      : Phaser.Math.Between(this.combatZone.rightMinX, this.combatZone.rightMaxX);
    
    this.moveToPosition(fighter, targetX, targetY, callback);
  }
  
  moveToRandomLane(fighter) {
    // Mouvement aléatoire dans la zone de combat
    const targetY = Phaser.Math.Between(this.combatZone.minY, this.combatZone.maxY);
    const targetX = fighter.side === 'left'
      ? Phaser.Math.Between(this.combatZone.leftMinX, this.combatZone.leftMaxX)
      : Phaser.Math.Between(this.combatZone.rightMinX, this.combatZone.rightMaxX);
    
    this.moveToPosition(fighter, targetX, targetY);
  }
  
  updateDepthOrdering() {
    // Sort fighters by Y position (back to front) for depth
    const fighters = [this.fighter1, this.fighter2];
    
    fighters.sort((a, b) => a.sprite.y - b.sprite.y);
    
    let baseDepth = 100;
    fighters.forEach((fighter, index) => {
      fighter.sprite.setDepth(baseDepth + index * 10);
      fighter.weapon.setDepth(baseDepth + index * 10 + 1);
      fighter.shadow.setDepth(50); // Shadows always behind everything
    });
  }
  
  animateFamiliarAssistance(assistResult) {
    const familiar = assistResult.familiar;
    const target = assistResult.target;
    const owner = assistResult.owner;
    
    if (!familiar.sprites || familiar.sprites.length === 0) return;
    
    // Store original positions
    const originalPositions = familiar.sprites.map(sprite => ({
      x: sprite.x,
      y: sprite.y
    }));
    
    // Calculate target position (near the target)
    const targetX = target.sprite.x + (owner.side === 'left' ? -40 : 40);
    const targetY = target.sprite.y - 20;
    
    // Animation duration based on familiar speed
    const moveDuration = Math.max(200, 400 / familiar.speed);
    
    // Move familiar to target with different animations based on type
    this.animateFamiliarMovement(familiar, targetX, targetY, moveDuration, () => {
      // Perform attack animation
      if (assistResult.hit) {
        this.performFamiliarAttack(familiar, target, assistResult);
      }
      
      // Return familiar to original position after a short delay
      this.time.delayedCall(300, () => {
        this.tweens.add({
          targets: familiar.sprites,
          x: (target, targetKey, value, index) => originalPositions[index].x,
          y: (target, targetKey, value, index) => originalPositions[index].y,
          duration: moveDuration * 0.7,
          ease: 'Power1.easeIn'
        });
      });
    });
  }
  
  animateFamiliarMovement(familiar, targetX, targetY, duration, onComplete) {
    const movementType = familiar.type;
    
    switch (movementType) {
      case 'wolf':
        // Wolf pounces in an arc
        familiar.sprites.forEach(sprite => {
          this.tweens.add({
            targets: sprite,
            x: targetX,
            duration: duration,
            ease: 'Power2.easeOut'
          });
          this.tweens.add({
            targets: sprite,
            y: targetY - 30, // Arc height
            duration: duration * 0.5,
            ease: 'Power2.easeOut',
            yoyo: true,
            onComplete: onComplete
          });
        });
        break;
        
      case 'sprite':
        // Fire sprite darts quickly in a zigzag pattern
        let zigzagComplete = false;
        familiar.sprites.forEach(sprite => {
          this.tweens.add({
            targets: sprite,
            x: targetX + 20,
            y: targetY - 10,
            duration: duration * 0.3,
            ease: 'Power1.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: sprite,
                x: targetX - 15,
                y: targetY + 10,
                duration: duration * 0.3,
                ease: 'Power1.easeOut',
                onComplete: () => {
                  this.tweens.add({
                    targets: sprite,
                    x: targetX,
                    y: targetY,
                    duration: duration * 0.4,
                    ease: 'Power1.easeOut',
                    onComplete: () => {
                      if (!zigzagComplete) {
                        zigzagComplete = true;
                        onComplete();
                      }
                    }
                  });
                }
              });
            }
          });
        });
        break;
        
      case 'bear':
        // Bear charges forward with ground shake
        this.tweens.add({
          targets: familiar.sprites,
          x: targetX,
          y: targetY,
          duration: duration,
          ease: 'Power3.easeOut',
          onStart: () => {
            // Animation starts - no shake here, shake happens on impact (onComplete)
          },
          onComplete: () => {
            // SHAKE ON IMPACT - moved from onStart to onComplete for proper timing!
            this.cameras.main.shake(200, 0.005);
            if (onComplete) onComplete();
          }
        });
        break;
        
      case 'raven':
        // Raven swoops down from above
        familiar.sprites.forEach(sprite => {
          this.tweens.add({
            targets: sprite,
            x: targetX,
            y: targetY - 60, // High swoop
            duration: duration * 0.6,
            ease: 'Power2.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: sprite,
                y: targetY,
                duration: duration * 0.4,
                ease: 'Power3.easeIn',
                onComplete: onComplete
              });
            }
          });
        });
        break;
        
      case 'golem':
        // Golem moves slowly but steadily
        this.tweens.add({
          targets: familiar.sprites,
          x: targetX,
          y: targetY,
          duration: duration * 1.5, // Slower movement
          ease: 'Linear',
          onComplete: onComplete
        });
        break;
        
      default:
        // Default movement
        this.tweens.add({
          targets: familiar.sprites,
          x: targetX,
          y: targetY,
          duration: duration,
          ease: 'Power2.easeOut',
          onComplete: onComplete
        });
        break;
    }
  }
  
  performFamiliarAttack(familiar, target, assistResult) {
    const ability = familiar.ability;
    
    // Create attack-specific visual effects
    switch (ability) {
      case 'bite':
        // Wolf bite - quick shake and bite marks
        this.tweens.add({
          targets: familiar.sprites,
          rotation: 0.3,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
        this.createBiteEffect(target);
        break;
        
      case 'burn':
        // Fire sprite - flame explosion
        this.createFireEffect(target, familiar);
        break;
        
      case 'freeze':
        // Ice bear - frost effect
        this.createFrostEffect(target);
        break;
        
      case 'lightning':
        // Storm raven - lightning bolts
        this.createLightningEffect(target, familiar);
        break;
        
      case 'shield':
        // Earth golem - no attack, just protective glow
        this.createShieldBoostEffect(familiar.owner);
        return; // No target shake for shield ability
        break;
    }
    
    // Target hit reaction for damaging abilities - gentler familiar attacks
    if (assistResult.hit && assistResult.damage > 0) {
      const hitDistance = (target.side === 'left' ? -8 : 8);
      this.tweens.add({
        targets: [target.sprite, target.weapon, target.shadow],
        x: target.sprite.x + hitDistance,
        duration: 100,
        yoyo: true,
        repeat: 1,
        ease: 'Power1.easeOut'
      });
    }
  }
  
  createBiteEffect(target) {
    // Create bite mark particles
    for (let i = 0; i < 4; i++) {
      const biteMark = this.add.circle(
        target.sprite.x + Phaser.Math.Between(-15, 15),
        target.sprite.y + Phaser.Math.Between(-20, 10),
        3, 0x8B0000
      );
      this.tweens.add({
        targets: biteMark,
        alpha: 0,
        duration: 800,
        onComplete: () => biteMark.destroy()
      });
    }
  }
  
  createFireEffect(target, familiar) {
    // Fire burst around target
    for (let i = 0; i < 8; i++) {
      const flame = this.add.circle(
        target.sprite.x + Phaser.Math.Between(-25, 25),
        target.sprite.y + Phaser.Math.Between(-30, 20),
        Phaser.Math.Between(4, 8), 0xFF4400, 0.8
      );
      this.tweens.add({
        targets: flame,
        scaleX: 0,
        scaleY: 2,
        alpha: 0,
        y: flame.y - 30,
        duration: 600,
        ease: 'Power1.easeOut',
        onComplete: () => flame.destroy()
      });
    }
    
    // Familiar glows briefly
    familiar.sprites.forEach(sprite => {
      // Check if sprite has tint methods before using them
      if (sprite.setTint && typeof sprite.setTint === 'function') {
        sprite.setTint(0xFFAA00);
        this.time.delayedCall(300, () => {
          if (sprite.clearTint && typeof sprite.clearTint === 'function') {
            sprite.clearTint();
          }
        });
      }
    });
  }
  
  createFrostEffect(target) {
    // Ice crystals around target
    for (let i = 0; i < 6; i++) {
      const ice = this.add.star(
        target.sprite.x + Phaser.Math.Between(-20, 20),
        target.sprite.y + Phaser.Math.Between(-25, 15),
        6, 8, 16, 0x88CCFF
      );
      this.tweens.add({
        targets: ice,
        rotation: Math.PI * 2,
        alpha: 0,
        duration: 1000,
        onComplete: () => ice.destroy()
      });
    }
    
    // Temporary frost tint on target
    if (target.sprite.setTint && typeof target.sprite.setTint === 'function') {
      target.sprite.setTint(0xCCEEFF);
      this.time.delayedCall(500, () => {
        if (target.sprite.clearTint && typeof target.sprite.clearTint === 'function') {
          target.sprite.clearTint();
        }
      });
    }
  }
  
  createLightningEffect(target, familiar) {
    // Lightning bolts from familiar to target
    for (let i = 0; i < 3; i++) {
      const lightning = this.add.line(
        0, 0,
        familiar.sprites[0].x, familiar.sprites[0].y,
        target.sprite.x + Phaser.Math.Between(-10, 10),
        target.sprite.y + Phaser.Math.Between(-20, 20),
        0xFFFF44, 1
      );
      lightning.setLineWidth(3);
      
      this.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 200 + (i * 100),
        onComplete: () => lightning.destroy()
      });
    }
    
    // Brief screen flash
    const flash = this.add.rectangle(512, 384, 1024, 768, 0xFFFF44, 0.2);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy()
    });
  }
  
  createShieldBoostEffect(owner) {
    // Protective aura around owner
    const shield = this.add.circle(owner.sprite.x, owner.sprite.y, 50, 0x8B4513, 0.3);
    shield.setStrokeStyle(3, 0xD2B48C);
    
    this.tweens.add({
      targets: shield,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power1.easeOut',
      onComplete: () => shield.destroy()
    });
  }
  
  showDodgeChanceIndicator(defender, dodgeChance, dodgeAttempted, dodgeSuccess) {
    // Removed visual indicator to reduce screen clutter
    // Only keep internal logic if needed for other systems
  }
  
  showBlockChanceIndicator(defender, blockChance, blockAttempted, blockSuccess, hasStamina) {
    // Removed visual indicator to reduce screen clutter
    // Only keep internal logic if needed for other systems
  }
  
  guaranteeVisualFeedback(result) {
    // MANDATORY system that ensures SOME visual feedback always occurs
    const target = result.target;
    const attacker = result.attacker;
    
    // Force immediate visual feedback for ALL actions
    if (!target || !attacker) {
      console.error('Missing target or attacker for feedback!');
      return;
    }
    
    // Immediate feedback for any action type - NO DELAYS
    if (result.hit && result.damage > 0) {
      // IMMEDIATE hit feedback - no delays at all
      this.executeEmergencyHitFeedback(target, result);
      
      // Screen flash for guaranteed visibility
      this.createGuaranteedScreenFlash(0xff4444, 0.1, 100);
      
      // Utilisons notre système de shake unifié (déjà fait dans animateAction)
      
      console.log(`GUARANTEED HIT FEEDBACK: ${attacker.stats.name} -> ${target.stats.name} for ${result.damage} damage`);
    }
    
    if (result.type === 'dodge') {
      // Guarantee dodge feedback with screen effects
      this.createGuaranteedScreenFlash(0x88ffff, 0.15, 150);
      
      console.log(`GUARANTEED DODGE FEEDBACK: ${target.stats.name} dodges ${result.dodgedAction}`);
    }
  }
  
  guaranteeDodgeAnimation(fighter, dodgeType, delay) {
    // Primary dodge animation attempt
    this.time.delayedCall(delay, () => {
      this.performDodgeAnimation(fighter, dodgeType);
    });
    
    // Fallback dodge animation attempt
    this.time.delayedCall(delay + 200, () => {
      this.executeEmergencyDodgeAnimation(fighter, dodgeType);
    });
    
    // Emergency visual dodge feedback (always works)
    this.time.delayedCall(delay + 50, () => {
      this.createEmergencyDodgeEffect(fighter);
    });
  }
  
  executeEmergencyHitFeedback(target, result) {
    // Emergency hit feedback that ALWAYS works regardless of sprite state
    if (!target || !target.sprite) {
      console.warn("Target sprite missing - using emergency position feedback");
      // Use center screen if target sprite is missing
      this.createParticleEffect(512, 400, 0xff0000, 8);
      this.showDamageNumber({ sprite: { x: 512, y: 400 } }, result.damage, result.critical);
      return;
    }
    
    // Force particle effect regardless of other conditions
    this.createParticleEffect(target.sprite.x, target.sprite.y - 30, 0xff4444, 10);
    
    // Force damage number display
    this.showDamageNumber(target, result.damage, result.critical || false);
    
    // Force target tint effect with multiple attempts
    if (target.sprite.setTint && typeof target.sprite.setTint === 'function') {
      target.sprite.setTint(0xff3333);
      
      // Multiple attempts to clear tint
      this.time.delayedCall(150, () => {
        if (target.sprite && target.sprite.clearTint) target.sprite.clearTint();
      });
      this.time.delayedCall(300, () => {
        if (target.sprite && target.sprite.clearTint) target.sprite.clearTint();
      });
    }
    
    // Force impact flash at target location
    const impactFlash = this.add.circle(target.sprite.x, target.sprite.y - 20, 20, 0xffffff, 0.9);
    this.tweens.add({
      targets: impactFlash,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 200,
      onComplete: () => impactFlash.destroy()
    });
    
    console.log(`Emergency hit feedback executed for ${target.stats.name}`);
  }
  
  executeEmergencyDodgeAnimation(fighter, dodgeType) {
    // Emergency dodge animation that works even if primary animation fails
    if (!fighter || !fighter.sprite) {
      console.warn("Fighter sprite missing for emergency dodge animation");
      return;
    }
    
    // Simple, guaranteed dodge movement
    const originalX = fighter.sprite.x;
    const dodgeDistance = fighter.side === 'left' ? -25 : 25;
    
    // Stop any existing tweens that might interfere
    this.tweens.killTweensOf(fighter.sprite);
    
    // Force dodge movement with guaranteed completion
    fighter.sprite.x = originalX + dodgeDistance;
    
    this.time.delayedCall(120, () => {
      fighter.sprite.x = originalX; // Force return to original position
    });
    
    // Add emergency dodge tint
    if (fighter.sprite.setTint) {
      fighter.sprite.setTint(0x88ffff);
      this.time.delayedCall(200, () => {
        if (fighter.sprite && fighter.sprite.clearTint) {
          fighter.sprite.clearTint();
        }
      });
    }
    
    console.log(`Emergency dodge animation executed for ${fighter.stats.name}`);
  }
  
  createEmergencyDodgeEffect(fighter) {
    // Visual effect that always works for dodge indication
    if (!fighter || !fighter.sprite) return;
    
    // Create multiple visual indicators for dodge
    const dodgeIndicator = this.add.text(
      fighter.sprite.x, 
      fighter.sprite.y - 60, 
      'DODGE!', 
      {
        fontSize: '16px',
        fill: '#88ffff',
        stroke: '#000000',
        strokeThickness: 2,
        fontFamily: 'Arial Black'
      }
    ).setOrigin(0.5);
    
    // Animated dodge text
    this.tweens.add({
      targets: dodgeIndicator,
      y: dodgeIndicator.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => dodgeIndicator.destroy()
    });
    
    // Dodge particle burst
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(
        fighter.sprite.x + Phaser.Math.Between(-20, 20),
        fighter.sprite.y + Phaser.Math.Between(-30, 10),
        4, 0x88ffff, 0.8
      );
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-30, 30),
        y: particle.y - 40,
        alpha: 0,
        duration: 600,
        onComplete: () => particle.destroy()
      });
    }
  }
  
  createGuaranteedScreenFlash(color, alpha, duration) {
    // Screen flash effect that always works
    const flash = this.add.rectangle(512, 384, 1024, 768, color, alpha);
    flash.setDepth(2000); // Ensure it's on top
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy()
    });
  }
  
  // Méthodes pour le positionnement libre
  findFreePosition(side) {
    const minX = side === 'left' ? this.combatZone.leftMinX : this.combatZone.rightMinX;
    const maxX = side === 'left' ? this.combatZone.leftMaxX : this.combatZone.rightMaxX;
    const minY = this.combatZone.minY;
    const maxY = this.combatZone.maxY;
    
    // Essayer de trouver une position libre (max 10 tentatives)
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(minX, maxX);
      const y = Phaser.Math.Between(minY, maxY);
      
      // Vérifier les collisions avec les positions existantes
      let collision = false;
      for (const pos of this.occupiedPositions) {
        const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
        if (distance < 80) { // Marge de sécurité de 80 pixels
          collision = true;
          break;
        }
      }
      
      if (!collision) {
        const position = { x, y };
        this.occupiedPositions.push(position);
        return position;
      }
    }
    
    // Si pas de position libre, retourner une position par défaut
    const defaultX = side === 'left' ? 200 : 824;
    const defaultY = Phaser.Math.Between(minY, maxY);
    return { x: defaultX, y: defaultY };
  }
  
  getFighterScale(y) {
    // Calcul de l'échelle du personnage basé sur Y
    // Plus bas sur l'écran (Y élevé) = plus proche = plus gros
    const normalized = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY);
    return 0.8 + (normalized * 0.4); // De 0.8 (haut/loin) à 1.2 (bas/proche)
  }

  getShadowScale(y) {
    // Calcul dynamique de l'échelle d'ombre basé sur la position Y
    // INVERSÉ: plus bas sur l'écran (Y élevé) = plus proche = plus gros
    const normalized = (y - this.combatZone.minY) / (this.combatZone.maxY - this.combatZone.minY);
    return 0.8 + (normalized * 0.8); // De 0.8 (haut/loin) à 1.6 (bas/proche)
  }
  
  getShadowOffset(y) {
    // Offset réduit pour coller les persos au sol
    return 5; // Petit offset fixe pour que l'ombre soit juste sous les pieds
  }
  
  moveToPosition(fighter, targetX, targetY, callback = null) {
    // Mouvement libre vers n'importe quelle position
    if (!this.combatEngine.isActivePlayer(fighter)) {
      if (callback) callback();
      return;
    }
    
    fighter.currentPosition = { x: targetX, y: targetY };
    
    // Animer le sprite
    this.tweens.add({
      targets: fighter.sprite,
      x: targetX,
      y: targetY,
      duration: 400,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        this.updateDepthOrdering();
        if (callback) callback();
      }
    });
    
    // Animer l'arme
    this.tweens.add({
      targets: fighter.weapon,
      x: targetX + (fighter.side === 'left' ? -30 : 30),
      y: targetY - 80,
      duration: 400,
      ease: 'Power2.easeInOut'
    });
    
    // Animer l'ombre
    this.tweens.add({
      targets: fighter.shadow,
      x: targetX,
      y: targetY + this.getShadowOffset(targetY),
      scaleX: this.getShadowScale(targetY),
      scaleY: this.getShadowScale(targetY),
      duration: 400,
      ease: 'Power2.easeInOut'
    });
  }
  
  // Système de camera shake simplifié utilisant Phaser natif
  shakeCamera(intensity = 0.01, duration = 200) {
    // Utiliser la méthode native de Phaser qui est plus stable
    this.cameras.main.shake(duration, intensity);
  }
  
  // Différents types de shakes pour différentes actions (valeurs Phaser)
  shakeLight() {
    this.shakeCamera(0.002, 100); // Léger shake pour coups normaux
  }
  
  shakeMedium() {
    this.shakeCamera(0.005, 150); // Shake moyen pour coups critiques
  }
  
  shakeHeavy() {
    this.shakeCamera(0.008, 200); // Gros shake pour hammer/bomb
  }
  
  shakeVertical() {
    this.shakeCamera(0.006, 150); // Shake pour arrivées/sauts
  }
  
  shakeHorizontal() {
    this.shakeCamera(0.004, 150); // Shake pour charges
  }

  flashScreen(color, alpha, duration) {
    // Create screen flash effect for blocks
    const flash = this.add.rectangle(512, 384, 1024, 768, color, alpha);
    flash.setDepth(2000);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy()
    });
  }
}