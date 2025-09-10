import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Create particle texture programmatically
    this.createParticleTexture();
    
    // Load all LaBrute assets
    this.load.image('background', 'assets/images/sprites/background.png');
    this.load.image('bruteMale', 'https://play.rosebud.ai/assets/bruteMale.png?YX5C');
    this.load.image('bruteFemale', 'https://play.rosebud.ai/assets/bruteFemale.png?5zm3');
    this.load.image('swordWeapon', 'assets/images/weapons/swordWeapon.png');
    this.load.image('hammerWeapon', 'assets/images/weapons/hammerWeapon.png');
    this.load.image('fight1', 'assets/images/sprites/fight1.png');
    this.load.image('fight2', 'assets/images/sprites/fight2.png');
    
    // Load Warrior spritesheets with animations
    this.load.spritesheet('warrior_idle', 'assets/animations/Warrior/Warrior_Idle.png', {
      frameWidth: 180,
      frameHeight: 180
    });
    this.load.spritesheet('warrior_run', 'assets/animations/Warrior/Warrior_Run.png', {
      frameWidth: 180,
      frameHeight: 180
    });
    this.load.spritesheet('warrior_attack1', 'assets/animations/Warrior/Warrior_Attack1.png', {
      frameWidth: 180,
      frameHeight: 180
    });
    this.load.spritesheet('warrior_attack2', 'assets/animations/Warrior/Warrior_Attack2.png', {
      frameWidth: 180,
      frameHeight: 180
    });
    this.load.spritesheet('warrior_guard', 'assets/animations/Warrior/Warrior_Guard.png', {
      frameWidth: 180,
      frameHeight: 180
    });
    
    // Loading progress bar
    const progressBg = this.add.rectangle(512, 384, 400, 20, 0x333333);
    const progressBar = this.add.rectangle(512, 384, 0, 16, 0xff6b35);
    
    this.load.on('progress', (value) => {
      progressBar.width = 400 * value;
    });
    
    this.load.on('complete', () => {
      // Go to Spine autobattler test scene immediately (no initial zoom feel)
      this.scene.start('FightSpine');
    });
  }
  
  createParticleTexture() {
    // Create a simple circular particle texture using Phaser 3 Graphics
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }
}