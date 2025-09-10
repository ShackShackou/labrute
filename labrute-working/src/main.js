import Phaser from 'phaser';
import { SpinePlugin } from '@esotericsoftware/spine-phaser';
import { LaBruteFightScene } from './scenes/LaBruteFightScene.js';

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
    parent: 'game-container',
    width: 1024,
    height: 768
  },
  backgroundColor: '#2d2419',
  plugins: {
    scene: [
      {
        key: 'SpinePlugin',
        plugin: SpinePlugin,
        mapping: 'spine'
      }
    ]
  },
  // Register only the LaBrute scene to avoid auto-running other demo scenes
  scene: [LaBruteFightScene]
};

const game = new Phaser.Game(config);
// Expose globally for external controllers (test page, embed)
// eslint-disable-next-line no-undef
window.game = game;