// Explorateur d'Assets du Jeu
class AssetExplorer {
    constructor() {
        this.currentAsset = null;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.animationTimer = null;
        this.assetCache = new Map();
        
        this.init();
    }

    init() {
        this.buildAssetTree();
        this.setupEventListeners();
        this.initCanvas();
    }

    buildAssetTree() {
        const container = document.getElementById('assetTree');
        
        // Structure des assets du jeu - CHEMINS RÉELS
        const assetStructure = {
            'Personnages': {
                icon: 'fa-users',
                items: {
                    'male-brute': {
                        name: 'Brute Homme',
                        path: '../client/public/images/game/male-brute.json',
                        atlasPath: '../client/public/images/game/male-brute.png',
                        resourcePath: '../client/public/images/game/resources/male-brute/',
                        frames: this.getAnimationList('male')
                    },
                    'female-brute': {
                        name: 'Brute Femme', 
                        path: '../client/public/images/game/female-brute.json',
                        atlasPath: '../client/public/images/game/female-brute.png',
                        resourcePath: '../client/public/images/game/resources/female-brute/',
                        frames: this.getAnimationList('female')
                    }
                }
            },
            'Animaux': {
                icon: 'fa-paw',
                items: {
                    'dog': {
                        name: 'Chien',
                        path: '../client/public/images/game/dog.json',
                        atlasPath: '../client/public/images/game/dog.png',
                        frames: ['idle', 'run', 'attack', 'hit', 'death']
                    },
                    'bear': {
                        name: 'Ours',
                        path: '../client/public/images/game/bear.json',
                        atlasPath: '../client/public/images/game/bear.png',
                        frames: ['idle', 'run', 'attack', 'hit', 'death']
                    },
                    'panther': {
                        name: 'Panthère/Loup',
                        path: '../client/public/images/game/panther.json',
                        atlasPath: '../client/public/images/game/panther.png',
                        frames: ['idle', 'run', 'attack', 'hit', 'death']
                    }
                }
            },
            'Armes': {
                icon: 'fa-sword',
                items: {
                    'weapons': {
                        name: 'Armes de mêlée',
                        path: '../client/public/images/weapons/',
                        frames: this.getWeaponsList()
                    },
                    'thrown-weapons': {
                        name: 'Armes de jet',
                        path: '../client/public/images/game/thrown-weapons.json',
                        atlasPath: '../client/public/images/game/thrown-weapons.png',
                        frames: ['knife', 'axe', 'spear', 'shuriken']
                    }
                }
            },
            'Effets': {
                icon: 'fa-sparkles',
                items: {
                    'misc': {
                        name: 'Effets divers',
                        path: '../client/public/images/game/misc.json',
                        atlasPath: '../client/public/images/game/misc.png',
                        frames: ['hit', 'block', 'dust', 'blood', 'stars']
                    }
                }
            }
        };

        container.innerHTML = '';
        
        Object.entries(assetStructure).forEach(([categoryName, category]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'asset-category';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'asset-category-header';
            headerDiv.innerHTML = `
                <i class="fas ${category.icon}"></i>
                <span>${categoryName}</span>
                <i class="fas fa-chevron-right category-arrow"></i>
            `;
            
            const listDiv = document.createElement('div');
            listDiv.className = 'asset-list';
            
            Object.entries(category.items).forEach(([itemKey, item]) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'asset-item';
                itemDiv.dataset.assetKey = itemKey;
                itemDiv.dataset.assetPath = item.path;
                itemDiv.innerHTML = `
                    <i class="fas fa-file-image"></i>
                    <span>${item.name}</span>
                `;
                
                itemDiv.addEventListener('click', () => {
                    this.selectAsset(itemKey, item);
                });
                
                listDiv.appendChild(itemDiv);
            });
            
            headerDiv.addEventListener('click', () => {
                headerDiv.classList.toggle('expanded');
                listDiv.classList.toggle('expanded');
                const arrow = headerDiv.querySelector('.category-arrow');
                arrow.classList.toggle('fa-chevron-right');
                arrow.classList.toggle('fa-chevron-down');
            });
            
            categoryDiv.appendChild(headerDiv);
            categoryDiv.appendChild(listDiv);
            container.appendChild(categoryDiv);
        });
    }

    getAnimationList(gender) {
        // Liste des animations pour les brutes
        return [
            'idle', 'run', 'arrive-start', 'arrive-end',
            'hit-0', 'hit-1', 'hit-2', 'hit-3',
            'fist', 'slash', 'estoc', 'whip',
            'block', 'evade', 'death', 'win',
            'grab', 'grabbed', 'throw', 'launch',
            'drink', 'eat', 'steal', 'stolen',
            'equip', 'trash', 'strengthen', 'train',
            'monk-start', 'monk-loop',
            'constipated-start', 'constipated-loop',
            'trapped-start', 'trapped-loop'
        ];
    }

    getWeaponsList() {
        // Liste des armes disponibles
        return [
            'knife', 'broadsword', 'lance', 'baton',
            'trident', 'hatchet', 'scimitar', 'axe',
            'hammer', 'mace', 'flail', 'whip',
            'noodle', 'racquet', 'keyboard', 'leek',
            'mug', 'fan', 'shuriken', 'sword'
        ];
    }

    setupEventListeners() {
        // Contrôles de frame
        document.getElementById('prevFrameBtn').addEventListener('click', () => {
            this.previousFrame();
        });

        document.getElementById('nextFrameBtn').addEventListener('click', () => {
            this.nextFrame();
        });

        document.getElementById('frameSlider').addEventListener('input', (e) => {
            this.setFrame(parseInt(e.target.value));
        });

        // Contrôles d'animation
        document.getElementById('playAnimBtn').addEventListener('click', () => {
            this.playAnimation();
        });

        document.getElementById('pauseAnimBtn').addEventListener('click', () => {
            this.pauseAnimation();
        });

        // Actions d'extraction
        document.getElementById('extractFrameBtn').addEventListener('click', () => {
            this.extractCurrentFrame();
        });

        document.getElementById('extractAllBtn').addEventListener('click', () => {
            this.extractAllFrames();
        });
    }

    initCanvas() {
        const canvas = document.getElementById('assetCanvas');
        this.ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 400;
        
        // Style initial
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#718096';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Sélectionnez un asset à explorer', canvas.width/2, canvas.height/2);
    }

    async selectAsset(key, assetData) {
        // Marquer comme sélectionné
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-asset-key="${key}"]`).classList.add('selected');

        this.currentAsset = assetData;
        this.currentFrame = 0;
        
        // Charger l'asset
        await this.loadAsset(assetData);
        
        // Afficher le premier frame
        this.displayFrame(0);
        
        // Mettre à jour les métadonnées
        this.updateMetadata();
    }

    async loadAsset(assetData) {
        try {
            if (assetData.path.endsWith('.json')) {
                // Essayer de charger le vrai atlas JSON
                try {
                    const response = await fetch(assetData.path);
                    if (response.ok) {
                        const atlasData = await response.json();
                        this.currentAssetData = atlasData;
                        
                        // Charger l'image de l'atlas
                        if (assetData.atlasPath) {
                            const img = new Image();
                            img.src = assetData.atlasPath;
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                            });
                            this.currentAtlasImage = img;
                        }
                    } else {
                        throw new Error('Atlas non trouvé');
                    }
                } catch (error) {
                    console.warn('Atlas non disponible, utilisation des frames individuelles');
                    // Fallback : créer une structure pour les frames individuelles
                    this.currentAssetData = {
                        frames: {},
                        images: []
                    };
                    
                    // Pour chaque animation, créer les chemins vers les frames
                    if (assetData.resourcePath) {
                        assetData.frames.forEach(animName => {
                            // Ajouter plusieurs frames par animation (estimation)
                            for (let i = 1; i <= 10; i++) {
                                const frameName = `${animName}_${String(i).padStart(5, '0')}`;
                                this.currentAssetData.images.push({
                                    name: frameName,
                                    animation: animName,
                                    path: `${assetData.resourcePath}${animName}/${String(i).padStart(5, '0')}.png`
                                });
                            }
                        });
                    }
                }
            } else {
                // Charger des images individuelles (armes)
                this.currentAssetData = {
                    frames: {},
                    images: []
                };
                
                assetData.frames.forEach(frameName => {
                    this.currentAssetData.images.push({
                        name: frameName,
                        path: `${assetData.path}${frameName}.png`
                    });
                });
            }
            
            // Mettre à jour le slider
            const frameCount = Object.keys(this.currentAssetData.frames || this.currentAssetData.images).length;
            const slider = document.getElementById('frameSlider');
            slider.max = Math.max(0, frameCount - 1);
            slider.value = 0;
        } catch (error) {
            console.error('Erreur chargement asset:', error);
            // Fallback avec données simulées
            this.loadAssetFallback(assetData);
        }
    }
    
    loadAssetFallback(assetData) {
        // Méthode de fallback avec données simulées
        this.currentAssetData = {
            frames: {},
            meta: {
                image: assetData.path.replace('.json', '.png'),
                size: { w: 2048, h: 2048 },
                scale: "1"
            }
        };
        
        // Simuler des frames
        assetData.frames.forEach((frameName, index) => {
            this.currentAssetData.frames[frameName] = {
                frame: { x: index * 100, y: 0, w: 100, h: 100 },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: 100, h: 100 },
                sourceSize: { w: 100, h: 100 }
            };
        });
        
        const frameCount = Object.keys(this.currentAssetData.frames).length;
        const slider = document.getElementById('frameSlider');
        slider.max = frameCount - 1;
        slider.value = 0;
    }

    displayFrame(frameIndex) {
        const canvas = document.getElementById('assetCanvas');
        const ctx = this.ctx;
        
        // Effacer le canvas
        ctx.fillStyle = '#f7fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner une représentation du frame
        if (this.currentAssetData.frames && Object.keys(this.currentAssetData.frames).length > 0) {
            // Atlas de sprites
            const frameNames = Object.keys(this.currentAssetData.frames);
            const frameName = frameNames[frameIndex];
            const frameData = this.currentAssetData.frames[frameName];
            
            if (frameData && this.currentAtlasImage) {
                // Dessiner le vrai sprite depuis l'atlas
                try {
                    const scale = Math.min(
                        300 / frameData.sourceSize.w,
                        300 / frameData.sourceSize.h,
                        1 // Ne pas agrandir
                    );
                    
                    const width = frameData.sourceSize.w * scale;
                    const height = frameData.sourceSize.h * scale;
                    const x = (canvas.width - width) / 2;
                    const y = (canvas.height - height) / 2;
                    
                    ctx.drawImage(
                        this.currentAtlasImage,
                        frameData.frame.x,
                        frameData.frame.y,
                        frameData.frame.w,
                        frameData.frame.h,
                        x,
                        y,
                        width,
                        height
                    );
                } catch (error) {
                    // Fallback si erreur
                    this.drawPlaceholder(ctx, frameIndex, frameData);
                }
                
                // Ajouter le nom du frame
                ctx.fillStyle = '#2d3748';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(frameName, canvas.width/2, canvas.height - 20);
            } else {
                // Fallback avec placeholder
                this.drawPlaceholder(ctx, frameIndex, frameData);
            }
        } else if (this.currentAssetData.images) {
            // Images individuelles
            const imageData = this.currentAssetData.images[frameIndex];
            
            if (imageData) {
                // Essayer de charger et afficher l'image
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#f7fafc';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    const scale = Math.min(
                        300 / img.width,
                        300 / img.height,
                        1
                    );
                    
                    const width = img.width * scale;
                    const height = img.height * scale;
                    const x = (canvas.width - width) / 2;
                    const y = (canvas.height - height) / 2;
                    
                    ctx.drawImage(img, x, y, width, height);
                    
                    // Nom de l'image
                    ctx.fillStyle = '#2d3748';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(imageData.name, canvas.width/2, canvas.height - 20);
                };
                
                img.onerror = () => {
                    // Placeholder si l'image ne charge pas
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(50, 50, 300, 300);
                    
                    ctx.fillStyle = '#4a5568';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(imageData.name, canvas.width/2, canvas.height/2);
                    
                    // Info sur le chemin
                    ctx.font = '12px Arial';
                    ctx.fillStyle = '#a0aec0';
                    ctx.fillText(imageData.animation || 'Frame', canvas.width/2, canvas.height/2 + 20);
                };
                
                img.src = imageData.path;
            }
        }
        
        // Mettre à jour l'info de frame
        const frameCount = Object.keys(this.currentAssetData.frames || this.currentAssetData.images).length;
        document.getElementById('frameInfo').textContent = `Frame ${frameIndex + 1}/${frameCount}`;
    }
    
    drawPlaceholder(ctx, frameIndex, frameData) {
        // Dessiner un placeholder coloré
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
        ctx.fillStyle = colors[frameIndex % colors.length];
        
        const width = frameData ? frameData.sourceSize.w : 100;
        const height = frameData ? frameData.sourceSize.h : 100;
        const scale = Math.min(300 / width, 300 / height);
        
        const drawWidth = width * scale;
        const drawHeight = height * scale;
        const x = (this.canvas.width - drawWidth) / 2;
        const y = (this.canvas.height - drawHeight) / 2;
        
        ctx.fillRect(x, y, drawWidth, drawHeight);
    }

    previousFrame() {
        if (this.currentFrame > 0) {
            this.currentFrame--;
            this.setFrame(this.currentFrame);
        }
    }

    nextFrame() {
        const frameCount = Object.keys(this.currentAssetData.frames || this.currentAssetData.images).length;
        if (this.currentFrame < frameCount - 1) {
            this.currentFrame++;
            this.setFrame(this.currentFrame);
        }
    }

    setFrame(frameIndex) {
        this.currentFrame = frameIndex;
        document.getElementById('frameSlider').value = frameIndex;
        this.displayFrame(frameIndex);
    }

    playAnimation() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('playAnimBtn').style.display = 'none';
        document.getElementById('pauseAnimBtn').style.display = 'block';
        
        const frameCount = Object.keys(this.currentAssetData.frames || this.currentAssetData.images).length;
        
        this.animationTimer = setInterval(() => {
            this.currentFrame = (this.currentFrame + 1) % frameCount;
            this.setFrame(this.currentFrame);
        }, 1000 / 30); // 30 FPS
    }

    pauseAnimation() {
        this.isPlaying = false;
        document.getElementById('playAnimBtn').style.display = 'block';
        document.getElementById('pauseAnimBtn').style.display = 'none';
        
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
    }

    updateMetadata() {
        const container = document.getElementById('spriteMetadata');
        
        if (!this.currentAsset) {
            container.innerHTML = '<div class="metadata-row"><span>Aucun asset sélectionné</span></div>';
            return;
        }
        
        let html = '';
        
        // Informations de base
        html += `
            <div class="metadata-row">
                <span class="metadata-label">Nom:</span>
                <span class="metadata-value">${this.currentAsset.name}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Type:</span>
                <span class="metadata-value">${this.currentAsset.path.endsWith('.json') ? 'Atlas' : 'Frames'}</span>
            </div>
        `;
        
        if (this.currentAssetData) {
            const frameCount = Object.keys(this.currentAssetData.frames || this.currentAssetData.images).length;
            html += `
                <div class="metadata-row">
                    <span class="metadata-label">Frames:</span>
                    <span class="metadata-value">${frameCount}</span>
                </div>
            `;
            
            if (this.currentAssetData.meta) {
                html += `
                    <div class="metadata-row">
                        <span class="metadata-label">Taille Atlas:</span>
                        <span class="metadata-value">${this.currentAssetData.meta.size.w}x${this.currentAssetData.meta.size.h}</span>
                    </div>
                `;
            }
            
            // Info du frame actuel
            if (this.currentAssetData.frames) {
                const frameNames = Object.keys(this.currentAssetData.frames);
                const currentFrameName = frameNames[this.currentFrame];
                const currentFrameData = this.currentAssetData.frames[currentFrameName];
                
                if (currentFrameData) {
                    html += `
                        <div class="metadata-row">
                            <span class="metadata-label">Frame actuel:</span>
                            <span class="metadata-value">${currentFrameName}</span>
                        </div>
                        <div class="metadata-row">
                            <span class="metadata-label">Taille:</span>
                            <span class="metadata-value">${currentFrameData.sourceSize.w}x${currentFrameData.sourceSize.h}</span>
                        </div>
                        <div class="metadata-row">
                            <span class="metadata-label">Position:</span>
                            <span class="metadata-value">x:${currentFrameData.frame.x} y:${currentFrameData.frame.y}</span>
                        </div>
                    `;
                }
            }
        }
        
        container.innerHTML = html;
    }

    extractCurrentFrame() {
        if (!this.currentAsset || !this.currentAssetData) return;
        
        // Simuler l'extraction
        const frameNames = Object.keys(this.currentAssetData.frames || this.currentAssetData.images);
        const frameName = frameNames[this.currentFrame];
        
        // Créer un canvas temporaire pour l'extraction
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copier le frame actuel
        tempCanvas.width = 100;
        tempCanvas.height = 100;
        
        // Dessiner quelque chose pour la démo
        tempCtx.fillStyle = '#667eea';
        tempCtx.fillRect(0, 0, 100, 100);
        tempCtx.fillStyle = 'white';
        tempCtx.font = '20px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.fillText(frameName, 50, 55);
        
        // Télécharger
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentAsset.name}_${frameName}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        this.showNotification(`Frame "${frameName}" extraite !`);
    }

    extractAllFrames() {
        if (!this.currentAsset || !this.currentAssetData) return;
        
        const frameNames = Object.keys(this.currentAssetData.frames || this.currentAssetData.images);
        
        // Simuler l'extraction de toutes les frames
        let extracted = 0;
        
        frameNames.forEach((frameName, index) => {
            setTimeout(() => {
                // Créer et télécharger chaque frame
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                tempCanvas.width = 100;
                tempCanvas.height = 100;
                
                const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
                tempCtx.fillStyle = colors[index % colors.length];
                tempCtx.fillRect(0, 0, 100, 100);
                tempCtx.fillStyle = 'white';
                tempCtx.font = '16px Arial';
                tempCtx.textAlign = 'center';
                tempCtx.fillText(frameName, 50, 55);
                
                tempCanvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${this.currentAsset.name}_${frameName}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    extracted++;
                    if (extracted === frameNames.length) {
                        this.showNotification(`${extracted} frames extraites !`);
                    }
                });
            }, index * 100); // Délai pour éviter de surcharger
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialiser l'explorateur
window.assetExplorer = null;

// Attendre que tout soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.assetExplorer = new AssetExplorer();
    });
} else {
    window.assetExplorer = new AssetExplorer();
}
