// Éditeur d'Animations
class AnimationEditor {
    constructor() {
        this.timeline = [];
        this.currentKeyframe = 0;
        this.animationDuration = 1000;
        this.fps = 30;
        this.isLooping = true;
        this.isPlaying = false;
        this.animationTimer = null;
        this.pixiApp = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimationPreview();
        this.createDefaultTimeline();
    }

    setupEventListeners() {
        // Propriétés d'animation
        document.getElementById('animDuration').addEventListener('change', (e) => {
            this.animationDuration = parseInt(e.target.value);
            this.updateTimeline();
        });

        document.getElementById('animFPS').addEventListener('change', (e) => {
            this.fps = parseInt(e.target.value);
            this.updateTimeline();
        });

        document.getElementById('animLoop').addEventListener('change', (e) => {
            this.isLooping = e.target.checked;
        });

        // Contrôles de keyframes
        document.getElementById('addKeyframeBtn').addEventListener('click', () => {
            this.addKeyframe();
        });

        document.getElementById('deleteKeyframeBtn').addEventListener('click', () => {
            this.deleteKeyframe();
        });

        document.getElementById('previewAnimBtn').addEventListener('click', () => {
            this.togglePreview();
        });
    }

    async initializeAnimationPreview() {
        const container = document.getElementById('animationPreview');
        
        try {
            // Dans PIXI v7+, Application est asynchrone
            this.pixiApp = await PIXI.Application.init({
                width: 600,
                height: 400,
                backgroundColor: 0xf7fafc,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            container.appendChild(this.pixiApp.canvas);
            
            // Container pour l'animation
            this.animationContainer = new PIXI.Container();
            this.animationContainer.x = this.pixiApp.canvas.width / 2;
            this.animationContainer.y = this.pixiApp.canvas.height / 2;
            this.pixiApp.stage.addChild(this.animationContainer);
        } catch (error) {
            console.error('Erreur initialisation PIXI:', error);
            // Fallback pour les anciennes versions
            try {
                this.pixiApp = new PIXI.Application({
                    width: 600,
                    height: 400,
                    backgroundColor: 0xf7fafc,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });
                
                const canvas = this.pixiApp.view || this.pixiApp.canvas;
                container.appendChild(canvas);
                
                // Container pour l'animation
                this.animationContainer = new PIXI.Container();
                this.animationContainer.x = canvas.width / 2;
                this.animationContainer.y = canvas.height / 2;
                this.pixiApp.stage.addChild(this.animationContainer);
            } catch (fallbackError) {
                console.error('Erreur fallback PIXI:', fallbackError);
            }
        }
    }

    createDefaultTimeline() {
        // Créer une timeline par défaut avec quelques keyframes
        const defaultKeyframes = 5;
        this.timeline = [];
        
        for (let i = 0; i < defaultKeyframes; i++) {
            this.timeline.push({
                time: (i / (defaultKeyframes - 1)) * this.animationDuration,
                position: { x: 0, y: 0 },
                rotation: 0,
                scale: { x: 1, y: 1 },
                alpha: 1,
                bodyParts: {} // État des parties du corps
            });
        }
        
        this.renderTimeline();
    }

    renderTimeline() {
        const container = document.getElementById('timelineViewer');
        container.innerHTML = '';
        
        // Créer les pistes de la timeline
        const tracks = [
            { name: 'Position', property: 'position' },
            { name: 'Rotation', property: 'rotation' },
            { name: 'Scale', property: 'scale' },
            { name: 'Opacity', property: 'alpha' }
        ];
        
        tracks.forEach(track => {
            const trackDiv = document.createElement('div');
            trackDiv.className = 'timeline-track';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'timeline-label';
            labelDiv.textContent = track.name;
            
            const framesDiv = document.createElement('div');
            framesDiv.className = 'timeline-frames';
            
            // Créer les frames
            const totalFrames = Math.floor(this.animationDuration / (1000 / this.fps));
            for (let i = 0; i < totalFrames; i++) {
                const frameDiv = document.createElement('div');
                frameDiv.className = 'timeline-frame';
                frameDiv.dataset.frame = i;
                frameDiv.dataset.track = track.property;
                
                // Marquer les keyframes
                const time = (i / totalFrames) * this.animationDuration;
                const keyframe = this.timeline.find(kf => Math.abs(kf.time - time) < (1000 / this.fps / 2));
                if (keyframe) {
                    frameDiv.classList.add('active');
                }
                
                frameDiv.addEventListener('click', () => {
                    this.selectFrame(i, track.property);
                });
                
                framesDiv.appendChild(frameDiv);
            }
            
            trackDiv.appendChild(labelDiv);
            trackDiv.appendChild(framesDiv);
            container.appendChild(trackDiv);
        });
    }

    selectFrame(frameIndex, track) {
        const time = (frameIndex / (Math.floor(this.animationDuration / (1000 / this.fps)))) * this.animationDuration;
        
        // Trouver ou créer un keyframe à ce moment
        let keyframe = this.timeline.find(kf => Math.abs(kf.time - time) < (1000 / this.fps / 2));
        
        if (!keyframe) {
            // Créer un nouveau keyframe
            keyframe = {
                time: time,
                position: { x: 0, y: 0 },
                rotation: 0,
                scale: { x: 1, y: 1 },
                alpha: 1,
                bodyParts: {}
            };
            
            // Interpoler les valeurs depuis les keyframes voisins
            const prevKeyframe = this.timeline.filter(kf => kf.time < time).pop();
            const nextKeyframe = this.timeline.find(kf => kf.time > time);
            
            if (prevKeyframe && nextKeyframe) {
                const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
                keyframe = this.interpolateKeyframes(prevKeyframe, nextKeyframe, t);
                keyframe.time = time;
            }
            
            this.timeline.push(keyframe);
            this.timeline.sort((a, b) => a.time - b.time);
        }
        
        this.currentKeyframe = this.timeline.indexOf(keyframe);
        this.renderTimeline();
        this.updatePreview();
    }

    interpolateKeyframes(kf1, kf2, t) {
        return {
            position: {
                x: kf1.position.x + (kf2.position.x - kf1.position.x) * t,
                y: kf1.position.y + (kf2.position.y - kf1.position.y) * t
            },
            rotation: kf1.rotation + (kf2.rotation - kf1.rotation) * t,
            scale: {
                x: kf1.scale.x + (kf2.scale.x - kf1.scale.x) * t,
                y: kf1.scale.y + (kf2.scale.y - kf1.scale.y) * t
            },
            alpha: kf1.alpha + (kf2.alpha - kf1.alpha) * t,
            bodyParts: { ...kf1.bodyParts } // Copier l'état des parties
        };
    }

    addKeyframe() {
        const time = this.currentKeyframe < this.timeline.length - 1 
            ? (this.timeline[this.currentKeyframe].time + this.timeline[this.currentKeyframe + 1].time) / 2
            : this.animationDuration;
        
        const newKeyframe = {
            time: time,
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            alpha: 1,
            bodyParts: {}
        };
        
        this.timeline.push(newKeyframe);
        this.timeline.sort((a, b) => a.time - b.time);
        this.renderTimeline();
    }

    deleteKeyframe() {
        if (this.timeline.length > 2) { // Garder au moins 2 keyframes
            this.timeline.splice(this.currentKeyframe, 1);
            this.currentKeyframe = Math.min(this.currentKeyframe, this.timeline.length - 1);
            this.renderTimeline();
            this.updatePreview();
        }
    }

    updateTimeline() {
        // Ajuster les temps des keyframes à la nouvelle durée
        const oldDuration = this.timeline[this.timeline.length - 1].time;
        const ratio = this.animationDuration / oldDuration;
        
        this.timeline.forEach(kf => {
            kf.time *= ratio;
        });
        
        this.renderTimeline();
    }

    togglePreview() {
        if (this.isPlaying) {
            this.stopPreview();
        } else {
            this.startPreview();
        }
    }

    startPreview() {
        this.isPlaying = true;
        const btn = document.getElementById('previewAnimBtn');
        btn.innerHTML = '<i class="fas fa-pause"></i> Arrêter';
        
        let startTime = Date.now();
        let currentTime = 0;
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            currentTime = (Date.now() - startTime) % this.animationDuration;
            
            // Interpoler l'état actuel
            const state = this.getInterpolatedState(currentTime);
            this.applyStateToSprite(state);
            
            if (!this.isLooping && currentTime >= this.animationDuration - (1000 / this.fps)) {
                this.stopPreview();
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    stopPreview() {
        this.isPlaying = false;
        const btn = document.getElementById('previewAnimBtn');
        btn.innerHTML = '<i class="fas fa-play"></i> Prévisualiser';
    }

    getInterpolatedState(time) {
        // Trouver les keyframes avant et après
        let prevKeyframe = this.timeline[0];
        let nextKeyframe = this.timeline[this.timeline.length - 1];
        
        for (let i = 0; i < this.timeline.length - 1; i++) {
            if (this.timeline[i].time <= time && this.timeline[i + 1].time > time) {
                prevKeyframe = this.timeline[i];
                nextKeyframe = this.timeline[i + 1];
                break;
            }
        }
        
        // Calculer le facteur d'interpolation
        const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
        
        // Interpoler
        return this.interpolateKeyframes(prevKeyframe, nextKeyframe, t);
    }

    applyStateToSprite(state) {
        if (!this.animationContainer.children.length) {
            // Créer un sprite de démonstration
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x667eea);
            graphics.drawRect(-50, -50, 100, 100);
            graphics.endFill();
            
            // Ajouter des détails
            graphics.beginFill(0xffffff);
            graphics.drawCircle(-20, -20, 10);
            graphics.drawCircle(20, -20, 10);
            graphics.endFill();
            
            graphics.beginFill(0x2d3748);
            graphics.drawRect(-30, 10, 60, 10);
            graphics.endFill();
            
            this.animationContainer.addChild(graphics);
        }
        
        const sprite = this.animationContainer.children[0];
        
        // Appliquer les transformations
        sprite.x = state.position.x;
        sprite.y = state.position.y;
        sprite.rotation = state.rotation;
        sprite.scale.x = state.scale.x;
        sprite.scale.y = state.scale.y;
        sprite.alpha = state.alpha;
    }

    updatePreview() {
        if (this.currentKeyframe < this.timeline.length) {
            const keyframe = this.timeline[this.currentKeyframe];
            this.applyStateToSprite(keyframe);
        }
    }

    // Export de l'animation
    exportAnimation() {
        return {
            duration: this.animationDuration,
            fps: this.fps,
            loop: this.isLooping,
            keyframes: this.timeline.map(kf => ({
                time: kf.time,
                position: { ...kf.position },
                rotation: kf.rotation,
                scale: { ...kf.scale },
                alpha: kf.alpha,
                bodyParts: { ...kf.bodyParts }
            }))
        };
    }

    // Import d'une animation
    importAnimation(animationData) {
        this.animationDuration = animationData.duration;
        this.fps = animationData.fps;
        this.isLooping = animationData.loop;
        this.timeline = animationData.keyframes;
        
        // Mettre à jour l'UI
        document.getElementById('animDuration').value = this.animationDuration;
        document.getElementById('animFPS').value = this.fps;
        document.getElementById('animLoop').checked = this.isLooping;
        
        this.renderTimeline();
        this.updatePreview();
    }

    // Intégration avec les sprites custom
    setCustomSprites(sprites) {
        // Remplacer le sprite de démo par les vrais sprites
        this.animationContainer.removeChildren();
        
        // Créer un container pour chaque partie du corps
        Object.entries(sprites).forEach(([partKey, spriteData]) => {
            if (spriteData.texture) {
                const sprite = new PIXI.Sprite(spriteData.texture);
                sprite.anchor.set(0.5);
                sprite.name = partKey;
                this.animationContainer.addChild(sprite);
            }
        });
        
        this.updatePreview();
    }
}

// Initialiser l'éditeur d'animations
window.animationEditor = null;

// Attendre que tout soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationEditor = new AnimationEditor();
    });
} else {
    window.animationEditor = new AnimationEditor();
}
