import { LaBruteFightScene } from './LaBruteFightScene.js';

class EmbedScene extends LaBruteFightScene {
    create() {
        super.create();
        
        // Ajouter un listener pour le bouton de test
        document.getElementById('test-button').addEventListener('click', () => {
            this.runTestAnimation();
        });
        
        this.updateStatus('Ready');
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    runTestAnimation() {
        this.updateStatus('Loading test animation...');
        
        // Données de test minimales
        const testData = {
            fighters: [
                {
                    id: 1,
                    name: "TestBrute1",
                    level: 1,
                    hp: 100,
                    maxHp: 100,
                    strength: 10,
                    agility: 10,
                    speed: 10,
                    team: 'L'
                },
                {
                    id: 2,
                    name: "TestBrute2",
                    level: 1,
                    hp: 100,
                    maxHp: 100,
                    strength: 10,
                    agility: 10,
                    speed: 10,
                    team: 'R'
                }
            ],
            steps: [
                { type: 'Move', fighter: 1, to: 1, duration: 1000 },
                { type: 'Hit', fighter: 1, target: 2, damage: 10, duration: 500 },
                { type: 'Move', fighter: 2, to: 0, duration: 1000 },
                { type: 'Hit', fighter: 2, target: 1, damage: 15, duration: 500 },
                { type: 'End', winner: 2 }
            ]
        };
        
        this.loadFightData(testData);
        this.updateStatus('Test animation loaded');
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a',
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
    scene: EmbedScene
};

const game = new Phaser.Game(config);

// Communication avec le parent
window.addEventListener('message', (event) => {
    console.log('Message received:', event.data);
    
    if (event.data.type === 'LOAD_FIGHT_STEPS') {
        const scene = game.scene.getScene('EmbedScene');
        if (scene) {
            scene.loadFightData(event.data.payload);
            scene.updateStatus('Fight data loaded');
        }
    } else if (event.data.type === 'PLAY') {
        const scene = game.scene.getScene('EmbedScene');
        if (scene) {
            scene.play();
            scene.updateStatus('Playing');
        }
    } else if (event.data.type === 'PAUSE') {
        const scene = game.scene.getScene('EmbedScene');
        if (scene) {
            scene.pause();
            scene.updateStatus('Paused');
        }
    } else if (event.data.type === 'SET_SPEED') {
        const scene = game.scene.getScene('EmbedScene');
        if (scene) {
            scene.setSpeed(event.data.payload);
            scene.updateStatus(`Speed: ${event.data.payload}x`);
        }
    }
});

// Notifier le parent que nous sommes prêts
setTimeout(() => {
    window.parent.postMessage({ type: 'READY' }, '*');
    console.log('READY message sent to parent');
}, 100);