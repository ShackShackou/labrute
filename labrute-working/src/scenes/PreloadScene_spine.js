// PreloadScene.js - Modifié pour charger Spine
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Barre de chargement (ton code V00)
        this.createLoadingBar();

        // CHARGER LES BACKGROUNDS DE V00
        this.load.image('arena_bg', 'assets/images/backgrounds/arena.png');
        this.load.image('menu_bg', 'assets/images/backgrounds/menu.png');

        // CHARGER SPINE
        this.load.spine('spineboy', 
            'assets/spine/spineboy-pro.json',
            'assets/spine/spineboy.atlas'
        );

        this.load.spine('raptor',
            'assets/spine/raptor-pro.json',
            'assets/spine/raptor.atlas'
        );

        // Charger tes autres assets V00
        // this.load.image(...);
    }

    create() {
        console.log('✅ Assets chargés');
        this.scene.start('MenuScene');
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 160, height/2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width/2 - 150, height/2 - 15, 300 * value, 30);
        });
    }
}
