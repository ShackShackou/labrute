// main.js - Configuration COMPLÈTE automatique
// Généré automatiquement - NE PAS MODIFIER À LA MAIN

// Configuration Phaser + Spine
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#2a2a2a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Charger toutes les scènes automatiquement
const scenesToLoad = [];

// SCÈNES DÉTECTÉES AUTOMATIQUEMENT:
// Ajout de BootScene 
try { 
    const BootScene = window.BootScene; 
    if (BootScene) scenesToLoad.push(BootScene); 
} catch(e) { console.log('Scene BootScene non trouvée'); } 
 
// Ajout de FightScene 
try { 
    const FightScene = window.FightScene; 
    if (FightScene) scenesToLoad.push(FightScene); 
} catch(e) { console.log('Scene FightScene non trouvée'); } 
 
// Ajout de FightSceneSimple 
try { 
    const FightSceneSimple = window.FightSceneSimple; 
    if (FightSceneSimple) scenesToLoad.push(FightSceneSimple); 
} catch(e) { console.log('Scene FightSceneSimple non trouvée'); } 
 
// Ajout de PreloadScene_spine 
try { 
    const PreloadScene_spine = window.PreloadScene_spine; 
    if (PreloadScene_spine) scenesToLoad.push(PreloadScene_spine); 
} catch(e) { console.log('Scene PreloadScene_spine non trouvée'); } 
 
// Ajouter les scènes à la config
config.scene = scenesToLoad;

// Si aucune scène trouvée, créer une scène de test
if (config.scene.length === 0) {
    console.warn('Aucune scène trouvée, création d\'une scène de test');

    class TestScene extends Phaser.Scene {
        constructor() {
            super('TestScene');
        }

        preload() {
            // Charger Spine
            this.load.spine('spineboy', 
                'assets/spine/spineboy-pro.json',
                'assets/spine/spineboy.atlas'
            );
        }

        create() {
            this.add.text(640, 100, 'LABRUTE V04 - TEST', {
                fontSize: '48px',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Test Spine
            try {
                const spine = this.add.spine(640, 400, 'spineboy', 'idle', true);
                spine.setScale(0.5);
                this.add.text(640, 600, 'Spine fonctionne!', {
                    fontSize: '24px',
                    color: '#00ff00'
                }).setOrigin(0.5);
            } catch(e) {
                this.add.text(640, 600, 'Spine non chargé', {
                    fontSize: '24px',
                    color: '#ff0000'
                }).setOrigin(0.5);
            }
        }
    }

    config.scene = [TestScene];
}

// Configuration du plugin Spine
if (typeof SpinePlugin !== 'undefined') {
    config.plugins = {
        scene: [{
            key: 'SpinePlugin',
            plugin: window.SpinePlugin,
            mapping: 'spine'
        }]
    };
}

// Lancer le jeu
const game = new Phaser.Game(config);
console.log('🎮 LaBrute V04 lancé avec', config.scene.length, 'scènes');
