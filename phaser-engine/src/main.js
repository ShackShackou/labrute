import { LaBruteFightScene } from './LaBruteFightScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    plugins: {
        scene: [
            {
                key: 'SpinePlugin',
                plugin: window.SpinePlugin,
                mapping: 'spine'
            }
        ]
    },
    scene: [LaBruteFightScene]
};

const game = new Phaser.Game(config);

// Communication avec le parent
window.addEventListener('message', (event) => {
    if (event.data.type === 'LOAD_FIGHT_STEPS') {
        const scene = game.scene.getScene('LaBruteFightScene');
        if (scene) {
            scene.loadFightData(event.data.payload);
        }
    } else if (event.data.type === 'PLAY') {
        const scene = game.scene.getScene('LaBruteFightScene');
        if (scene) {
            scene.play();
        }
    } else if (event.data.type === 'PAUSE') {
        const scene = game.scene.getScene('LaBruteFightScene');
        if (scene) {
            scene.pause();
        }
    } else if (event.data.type === 'SET_SPEED') {
        const scene = game.scene.getScene('LaBruteFightScene');
        if (scene) {
            scene.setSpeed(event.data.payload);
        }
    }
});

// Notifier le parent que nous sommes prêts
window.parent.postMessage({ type: 'READY' }, '*');