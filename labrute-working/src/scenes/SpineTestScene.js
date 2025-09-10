import Phaser from 'phaser';

// Simple scene to validate Spine integration while keeping the same background
// Assets used from assets/spine: spineboy-* and raptor-*
export class SpineTestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpineTest' });
  }

  preload() {
    // Load Spine skeletons (Esoteric spine-phaser API)
    // Load skeleton data and atlas separately
    this.load.spineJson('spineboy-data', 'assets/spine/spineboy-pro.json');
    this.load.spineAtlas('spineboy-atlas', 'assets/spine/spineboy.atlas');

    this.load.spineJson('raptor-data', 'assets/spine/raptor-pro.json');
    this.load.spineAtlas('raptor-atlas', 'assets/spine/raptor.atlas');
  }

  create() {
    // Keep the same decor (background) as your FightScene
    try {
      const bg = this.add.image(512, 384, 'background');
      bg.setScale(2.2).setDepth(-10);
    } catch (e) {
      console.warn('Background not found. Make sure BootScene loaded it.');
    }

    // Center info text
    this.add.text(512, 40, 'Spine Test Scene (spineboy + raptor) — press SPACE to toggle animations', {
      fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5);

    // Add Spineboy using data+atlas keys
    let spineboy;
    let spineboyAnim = 'idle';
    try {
      spineboy = this.add.spine(350, 580, 'spineboy-data', 'spineboy-atlas');
      spineboy.setScale(0.4);
      spineboy.animationState.setAnimation(0, spineboyAnim, true);
    } catch (e) {
      console.error('Failed to create Spineboy:', e);
    }

    // Add Raptor
    let raptor;
    let raptorAnim = 'walk';
    try {
      raptor = this.add.spine(700, 580, 'raptor-data', 'raptor-atlas');
      raptor.setScale(0.4);
      raptor.animationState.setAnimation(0, raptorAnim, true);
    } catch (e) {
      console.error('Failed to create Raptor:', e);
    }

    // Simple toggle with SPACE
    this.input.keyboard.on('keydown-SPACE', () => {
      if (spineboy) {
        spineboyAnim = spineboyAnim === 'idle' ? 'walk' : 'idle';
        spineboy.animationState.setAnimation(0, spineboyAnim, true);
      }
      if (raptor) {
        raptorAnim = raptorAnim === 'walk' ? 'roar' : 'walk';
        raptor.animationState.setAnimation(0, raptorAnim, true);
      }
    });
  }
}

