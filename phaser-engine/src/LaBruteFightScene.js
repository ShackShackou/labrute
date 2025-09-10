export class LaBruteFightScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LaBruteFightScene' });
        this.fighters = [];
        this.steps = [];
        this.currentStepIndex = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.fighterSprites = {};
    }

    preload() {
        // Charger les assets Spine
        this.load.setPath('/assets/spine/');
        
        // Charger spineboy comme placeholder
        this.load.spine('spineboy', 'spineboy.json', 'spineboy.atlas', true);
        
        // Charger charA et charB si disponibles
        this.load.spine('charA', 'charA.json', 'charA.atlas', true);
        this.load.spine('charB', 'charB.json', 'charB.atlas', true);
        
        // Assets de fallback
        this.load.setPath('/assets/');
        this.load.image('placeholder', 'placeholder.png');
    }

    create() {
        console.log('LaBruteFightScene created');
        
        // Créer le terrain de combat
        this.createBattlefield();
        
        // Initialiser les positions
        this.positions = {
            L: { x: 200, y: 400 },  // Position équipe gauche
            R: { x: 600, y: 400 }   // Position équipe droite
        };
    }

    createBattlefield() {
        // Fond simple
        this.add.rectangle(400, 300, 800, 600, 0x333333);
        
        // Lignes de séparation
        this.add.line(400, 300, 400, 0, 400, 600, 0x666666, 0.5);
        
        // Zones d'équipe
        this.add.text(100, 50, 'Team L', { fontSize: '24px', color: '#ff0000' });
        this.add.text(650, 50, 'Team R', { fontSize: '24px', color: '#0000ff' });
    }

    loadFightData(data) {
        console.log('Loading fight data:', data);
        
        this.fighters = data.fighters || [];
        this.steps = data.steps || [];
        this.currentStepIndex = 0;
        
        // Créer les sprites des combattants
        this.createFighters();
        
        // Auto-play si configuré
        if (data.autoPlay) {
            this.play();
        }
    }

    createFighters() {
        this.fighters.forEach(fighter => {
            const position = this.positions[fighter.team] || { x: 400, y: 400 };
            
            try {
                // Essayer de créer un sprite Spine
                const spineKey = this.getSpineKeyForFighter(fighter);
                
                if (this.cache.custom.spine.has(spineKey)) {
                    const spine = this.add.spine(position.x, position.y, spineKey);
                    spine.setScale(0.5);
                    
                    // Animation idle par défaut
                    if (spine.findAnimation('idle')) {
                        spine.play('idle', true);
                    } else if (spine.findAnimation('animation')) {
                        spine.play('animation', true);
                    }
                    
                    this.fighterSprites[fighter.id] = spine;
                } else {
                    // Fallback: créer un rectangle
                    this.createFallbackFighter(fighter, position);
                }
            } catch (error) {
                console.warn(`Failed to create Spine sprite for fighter ${fighter.id}:`, error);
                this.createFallbackFighter(fighter, position);
            }
            
            // Ajouter la barre de vie
            this.createHealthBar(fighter, position);
        });
    }

    createFallbackFighter(fighter, position) {
        const color = fighter.team === 'L' ? 0xff0000 : 0x0000ff;
        const rect = this.add.rectangle(position.x, position.y, 50, 100, color);
        this.fighterSprites[fighter.id] = rect;
        
        // Ajouter le nom
        this.add.text(position.x, position.y - 70, fighter.name, {
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
    }

    createHealthBar(fighter, position) {
        const barWidth = 60;
        const barHeight = 8;
        const yOffset = -90;
        
        // Fond de la barre
        const bgBar = this.add.rectangle(
            position.x, 
            position.y + yOffset, 
            barWidth, 
            barHeight, 
            0x333333
        );
        
        // Barre de vie
        const hpBar = this.add.rectangle(
            position.x - (barWidth / 2) + (barWidth * fighter.hp / fighter.maxHp) / 2,
            position.y + yOffset,
            barWidth * (fighter.hp / fighter.maxHp),
            barHeight,
            0x00ff00
        );
        
        // Stocker les références
        fighter.healthBarBg = bgBar;
        fighter.healthBar = hpBar;
    }

    getSpineKeyForFighter(fighter) {
        // Mapping simple pour les tests
        if (fighter.id === 1 || fighter.name.includes('A')) {
            return 'charA';
        } else if (fighter.id === 2 || fighter.name.includes('B')) {
            return 'charB';
        }
        return 'spineboy';  // Fallback
    }

    play() {
        this.isPlaying = true;
        this.processNextStep();
    }

    pause() {
        this.isPlaying = false;
    }

    setSpeed(speed) {
        this.playbackSpeed = speed;
    }

    processNextStep() {
        if (!this.isPlaying || this.currentStepIndex >= this.steps.length) {
            this.onFightEnd();
            return;
        }

        const step = this.steps[this.currentStepIndex];
        console.log('Processing step:', step);

        this.executeStep(step, () => {
            this.currentStepIndex++;
            if (this.isPlaying) {
                this.processNextStep();
            }
        });
    }

    executeStep(step, callback) {
        const duration = (step.duration || 1000) / this.playbackSpeed;

        switch (step.type) {
            case 'Move':
                this.executeMove(step, duration, callback);
                break;
            case 'Hit':
                this.executeHit(step, duration, callback);
                break;
            case 'Block':
                this.executeBlock(step, duration, callback);
                break;
            case 'Evade':
                this.executeEvade(step, duration, callback);
                break;
            case 'Death':
                this.executeDeath(step, duration, callback);
                break;
            case 'End':
                this.executeEnd(step, callback);
                break;
            default:
                console.warn('Unknown step type:', step.type);
                callback();
        }
    }

    executeMove(step, duration, callback) {
        const sprite = this.fighterSprites[step.fighter];
        if (!sprite) {
            callback();
            return;
        }

        const targetX = step.to === 1 ? 400 : this.positions[this.getFighterTeam(step.fighter)].x;

        this.tweens.add({
            targets: sprite,
            x: targetX,
            duration: duration,
            ease: 'Power2',
            onComplete: callback
        });
    }

    executeHit(step, duration, callback) {
        const attacker = this.fighterSprites[step.fighter];
        const target = this.fighterSprites[step.target];
        
        if (!attacker || !target) {
            callback();
            return;
        }

        // Animation d'attaque
        if (attacker.play) {
            attacker.play('attack', false);
        }

        // Flash de dégât
        this.tweens.add({
            targets: target,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                // Mettre à jour la barre de vie
                this.updateHealthBar(step.target, step.damage);
                setTimeout(callback, duration - 100);
            }
        });
    }

    executeBlock(step, duration, callback) {
        const sprite = this.fighterSprites[step.fighter];
        if (sprite && sprite.play) {
            sprite.play('block', false);
        }
        setTimeout(callback, duration);
    }

    executeEvade(step, duration, callback) {
        const sprite = this.fighterSprites[step.fighter];
        if (!sprite) {
            callback();
            return;
        }

        this.tweens.add({
            targets: sprite,
            x: sprite.x - 30,
            duration: duration / 2,
            yoyo: true,
            ease: 'Power2',
            onComplete: callback
        });
    }

    executeDeath(step, duration, callback) {
        const sprite = this.fighterSprites[step.fighter];
        if (!sprite) {
            callback();
            return;
        }

        if (sprite.play) {
            sprite.play('death', false);
        }

        this.tweens.add({
            targets: sprite,
            alpha: 0.3,
            duration: duration,
            onComplete: callback
        });
    }

    executeEnd(step, callback) {
        console.log('Fight ended! Winner:', step.winner);
        
        // Afficher le résultat
        const winnerText = step.winner ? `Winner: Fighter ${step.winner}` : 'Draw!';
        this.add.text(400, 300, winnerText, {
            fontSize: '48px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        callback();
    }

    updateHealthBar(fighterId, damage) {
        const fighter = this.fighters.find(f => f.id === fighterId);
        if (!fighter) return;

        fighter.hp = Math.max(0, fighter.hp - damage);
        
        if (fighter.healthBar) {
            const barWidth = 60;
            const newWidth = barWidth * (fighter.hp / fighter.maxHp);
            
            this.tweens.add({
                targets: fighter.healthBar,
                displayWidth: newWidth,
                x: fighter.healthBarBg.x - (barWidth / 2) + newWidth / 2,
                duration: 300,
                ease: 'Power2'
            });
            
            // Changer la couleur selon les HP
            const color = fighter.hp / fighter.maxHp > 0.5 ? 0x00ff00 :
                         fighter.hp / fighter.maxHp > 0.25 ? 0xffff00 : 0xff0000;
            fighter.healthBar.setFillStyle(color);
        }
    }

    getFighterTeam(fighterId) {
        const fighter = this.fighters.find(f => f.id === fighterId);
        return fighter ? fighter.team : 'L';
    }

    onFightEnd() {
        this.isPlaying = false;
        console.log('Fight completed');
        
        // Notifier le parent
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'FIGHT_END' }, '*');
        }
    }
}