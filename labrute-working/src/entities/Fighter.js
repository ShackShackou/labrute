// Fighter.js - Version hybride V00 + Spine
export default class Fighter {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.x = x;
        this.y = y;
ECHO is off.
        // Stats de V00
        this.hp = config.hp || 100;
        this.maxHp = config.maxHp || 100;
        this.strength = config.strength || 10;
        this.defense = config.defense || 5;
        this.speed = config.speed || 8;
ECHO is off.
        // Créer le sprite (Spine ou classique)
        if (config.useSpine && scene.spine) {
            this.createSpineSprite(config.spineAsset);
        } else {
            this.createClassicSprite(config.sprite);
        }
    }
ECHO is off.
    createSpineSprite(assetName) {
        this.sprite = this.scene.add.spine(
            this.x, 
            this.y, 
            assetName || 'spineboy',
            'idle',
            true
        );
        this.sprite.setScale(0.5);
        this.hasSpine = true;
    }
ECHO is off.
    createClassicSprite(spriteName) {
        // Ton code V00 pour créer le sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, spriteName || 'fighter');
        this.hasSpine = false;
    }
ECHO is off.
    attack() {
        if (this.hasSpine) {
            this.sprite.play('shoot', false);
        } else {
            // Animation classique V00
            this.sprite.play('attack');
        }
    }
ECHO is off.
    takeDamage(damage) {
        this.hp -= damage;
ECHO is off.
        if (this.hasSpine) {
            this.sprite.play('hit', false);
        } else {
            // Animation classique V00
            this.sprite.play('hurt');
        }
ECHO is off.
        if (this.hp <= 0) {
            this.die();
        }
    }
ECHO is off.
    die() {
        if (this.hasSpine) {
            this.sprite.play('death', false);
        } else {
            this.sprite.play('death');
        }
    }
}
