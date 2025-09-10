import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { FightScene } from './scenes/FightScene.js';

const config = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'phaser-game-container',
    width: 1024,
    height: 768
  },
  backgroundColor: '#2d2419',
  scene: [BootScene, FightScene]
};

new Phaser.Game(config);