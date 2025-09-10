// Gestionnaire de Sprites Personnalisés
class CustomSpriteManager {
    constructor() {
        this.uploadedSprites = new Map(); // id -> sprite data
        this.customMappings = {}; // bodyPart -> spriteId
        this.currentSpriteId = 0;
        this.pixiApp = null;
        this.customTextures = new Map();
        
        this.init();
    }

    init() {
        this.setupUploadZone();
        this.generateMappingSlots();
        this.initializePreview();
    }

    setupUploadZone() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        // Click pour ouvrir le sélecteur de fichiers
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Gestion du drag & drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Gestion de la sélection de fichiers
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                this.processImageFile(file);
            }
        });
    }

    processImageFile(file) {
        const reader = new FileReader();
        const spriteId = `custom_${this.currentSpriteId++}`;

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Stocker les données du sprite
                const spriteData = {
                    id: spriteId,
                    name: file.name,
                    url: e.target.result,
                    width: img.width,
                    height: img.height,
                    file: file,
                    image: img
                };

                this.uploadedSprites.set(spriteId, spriteData);
                this.addSpriteToUI(spriteData);
                
                // Créer une texture PIXI si l'app est prête
                if (this.pixiApp) {
                    this.createPixiTexture(spriteData);
                }
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    addSpriteToUI(spriteData) {
        const container = document.getElementById('uploadedSprites');
        
        const spriteSlot = document.createElement('div');
        spriteSlot.className = 'sprite-slot';
        spriteSlot.dataset.spriteId = spriteData.id;
        
        spriteSlot.innerHTML = `
            <div class="sprite-preview">
                <img src="${spriteData.url}" alt="${spriteData.name}">
            </div>
            <div class="sprite-controls">
                <div class="sprite-name">${spriteData.name}</div>
                <div class="sprite-info">${spriteData.width}x${spriteData.height}px</div>
                <div class="sprite-actions">
                    <button class="btn btn-sm" onclick="customSpriteManager.editSprite('${spriteData.id}')" title="Éditer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm" onclick="customSpriteManager.duplicateSprite('${spriteData.id}')" title="Dupliquer">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customSpriteManager.removeSprite('${spriteData.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Rendre le sprite draggable
        this.makeDraggable(spriteSlot, spriteData);
        
        container.appendChild(spriteSlot);
    }

    makeDraggable(element, spriteData) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('spriteId', spriteData.id);
            e.dataTransfer.effectAllowed = 'copy';
            element.style.opacity = '0.5';
        });

        element.addEventListener('dragend', () => {
            element.style.opacity = '1';
        });
    }

    generateMappingSlots() {
        const container = document.getElementById('mappingGrid');
        
        // Vérifier que LabruteData est disponible
        if (!window.LabruteData) {
            console.warn('LabruteData not available yet, retrying...');
            setTimeout(() => this.generateMappingSlots(), 100);
            return;
        }
        
        const { bodyPartsOrder, bodyPartsInfo, availableBodyParts } = window.LabruteData;
        
        container.innerHTML = '';

        bodyPartsOrder.forEach(partKey => {
            const partInfo = bodyPartsInfo[partKey];
            
            const slot = document.createElement('div');
            slot.className = 'mapping-slot';
            slot.dataset.part = partKey;
            
            slot.innerHTML = `
                <div class="part-label">${partInfo.name}</div>
                <div class="part-key">(${partKey})</div>
                <div class="drop-zone" data-part="${partKey}">
                    <i class="fas fa-plus-circle" style="font-size: 2rem; color: #cbd5e0;"></i>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #718096;">Glisser ici</p>
                </div>
                <button class="remove-mapping" onclick="customSpriteManager.removeMapping('${partKey}')" title="Retirer le mapping">
                    <i class="fas fa-times"></i>
                </button>
            `;

            this.setupDropZone(slot, partKey);
            container.appendChild(slot);
        });
    }

    setupDropZone(slot, partKey) {
        const dropZone = slot.querySelector('.drop-zone');

        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        });

        slot.addEventListener('dragleave', () => {
            slot.style.backgroundColor = '';
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.style.backgroundColor = '';
            
            const spriteId = e.dataTransfer.getData('spriteId');
            if (spriteId) {
                this.assignSpriteTopart(spriteId, partKey);
            }
        });
    }

    assignSpriteTopart(spriteId, partKey) {
        const spriteData = this.uploadedSprites.get(spriteId);
        if (!spriteData) return;

        // Mettre à jour le mapping
        this.customMappings[partKey] = spriteId;

        // Mettre à jour l'UI
        const slot = document.querySelector(`.mapping-slot[data-part="${partKey}"]`);
        const dropZone = slot.querySelector('.drop-zone');
        
        dropZone.innerHTML = `
            <img src="${spriteData.url}" alt="${spriteData.name}">
            <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem;">${spriteData.name}</p>
        `;
        
        slot.classList.add('filled');

        // Mettre à jour la prévisualisation
        this.updatePreview();
    }

    removeMapping(partKey) {
        delete this.customMappings[partKey];
        
        const slot = document.querySelector(`.mapping-slot[data-part="${partKey}"]`);
        const dropZone = slot.querySelector('.drop-zone');
        
        dropZone.innerHTML = `
            <i class="fas fa-plus-circle" style="font-size: 2rem; color: #cbd5e0;"></i>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #718096;">Glisser ici</p>
        `;
        
        slot.classList.remove('filled');
        
        this.updatePreview();
    }

    removeSprite(spriteId) {
        // Retirer des mappings
        Object.keys(this.customMappings).forEach(part => {
            if (this.customMappings[part] === spriteId) {
                this.removeMapping(part);
            }
        });

        // Retirer de la liste
        this.uploadedSprites.delete(spriteId);
        
        // Retirer de l'UI
        const element = document.querySelector(`.sprite-slot[data-sprite-id="${spriteId}"]`);
        if (element) {
            element.remove();
        }

        // Retirer la texture PIXI
        if (this.customTextures.has(spriteId)) {
            const texture = this.customTextures.get(spriteId);
            texture.destroy(true);
            this.customTextures.delete(spriteId);
        }
    }

    editSprite(spriteId) {
        const spriteData = this.uploadedSprites.get(spriteId);
        if (!spriteData) return;

        // Ouvrir un éditeur simple (pour l'instant, juste renommer)
        const newName = prompt('Nouveau nom pour le sprite:', spriteData.name);
        if (newName && newName !== spriteData.name) {
            spriteData.name = newName;
            
            // Mettre à jour l'UI
            const element = document.querySelector(`.sprite-slot[data-sprite-id="${spriteId}"] .sprite-name`);
            if (element) {
                element.textContent = newName;
            }
        }
    }

    duplicateSprite(spriteId) {
        const originalSprite = this.uploadedSprites.get(spriteId);
        if (!originalSprite) return;

        const newSpriteId = `custom_${this.currentSpriteId++}`;
        const newSprite = {
            ...originalSprite,
            id: newSpriteId,
            name: `${originalSprite.name} (copie)`
        };

        this.uploadedSprites.set(newSpriteId, newSprite);
        this.addSpriteToUI(newSprite);
        
        if (this.pixiApp) {
            this.createPixiTexture(newSprite);
        }
    }

    // Prévisualisation avec PIXI.js
    async initializePreview() {
        const container = document.getElementById('customPreviewContainer');
        
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
            
            // Créer les textures pour les sprites déjà uploadés
            this.uploadedSprites.forEach(spriteData => {
                this.createPixiTexture(spriteData);
            });

            this.updatePreview();
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
                
                container.appendChild(this.pixiApp.view || this.pixiApp.canvas);
                
                // Créer les textures pour les sprites déjà uploadés
                this.uploadedSprites.forEach(spriteData => {
                    this.createPixiTexture(spriteData);
                });

                this.updatePreview();
            } catch (fallbackError) {
                console.error('Erreur fallback PIXI:', fallbackError);
            }
        }
    }

    createPixiTexture(spriteData) {
        const baseTexture = PIXI.BaseTexture.from(spriteData.url);
        const texture = new PIXI.Texture(baseTexture);
        this.customTextures.set(spriteData.id, texture);
    }

    updatePreview() {
        if (!this.pixiApp) return;

        // Effacer le stage
        this.pixiApp.stage.removeChildren();

        // Créer un container pour la brute
        const bruteContainer = new PIXI.Container();
        const canvas = this.pixiApp.canvas || this.pixiApp.view;
        bruteContainer.x = canvas.width / 2;
        bruteContainer.y = canvas.height / 2;

        // Créer la brute avec les sprites custom
        this.createCustomBrute(bruteContainer);

        this.pixiApp.stage.addChild(bruteContainer);
    }

    createCustomBrute(container) {
        // Vérifier que LabruteData est disponible
        if (!window.LabruteData) {
            return;
        }
        
        const { bodyPartsOrder } = window.LabruteData;
        
        // Parcourir les parties dans l'ordre
        bodyPartsOrder.forEach(partKey => {
            const spriteId = this.customMappings[partKey];
            
            if (spriteId && this.customTextures.has(spriteId)) {
                const texture = this.customTextures.get(spriteId);
                const sprite = new PIXI.Sprite(texture);
                
                // Centrer le sprite
                sprite.anchor.set(0.5);
                
                // Ajuster l'échelle si nécessaire
                const maxSize = 100;
                const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
                sprite.scale.set(scale);
                
                // Positionner selon la partie du corps
                this.positionBodyPart(sprite, partKey);
                
                container.addChild(sprite);
            } else {
                // Utiliser un placeholder si pas de sprite custom
                this.createPlaceholder(container, partKey);
            }
        });
    }

    positionBodyPart(sprite, partKey) {
        // Positions approximatives pour chaque partie
        const positions = {
            p1: { x: 0, y: 0 },      // Centre
            p1a: { x: 0, y: 20 },    // Ceinture
            p1b: { x: 0, y: 30 },    // Ceinture basse
            p2: { x: 0, y: 0 },      // Corps
            p3: { x: 0, y: -60 },    // Tête/Cheveux
            p4: { x: 0, y: -40 },    // Barbe/Accessoires tête
            p5: { x: 0, y: 10 },     // Torse
            p6: { x: 0, y: 40 },     // Jambes
            p7: { x: 0, y: 0 },      // Vêtements principaux
            p7b: { x: 0, y: -10 },   // Vêtements secondaires
            p8: { x: 0, y: 50 }      // Pieds
        };

        const pos = positions[partKey] || { x: 0, y: 0 };
        sprite.x = pos.x;
        sprite.y = pos.y;
    }

    createPlaceholder(container, partKey) {
        // Vérifier que LabruteData est disponible
        if (!window.LabruteData) {
            return;
        }
        
        const { bodyPartsInfo } = window.LabruteData;
        const partInfo = bodyPartsInfo[partKey];
        
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, 0xcccccc, 1);
        graphics.beginFill(0xf0f0f0, 0.5);
        
        // Dessiner une forme simple selon la partie
        const shapes = {
            p3: () => graphics.drawCircle(0, -60, 30),      // Tête
            p2: () => graphics.drawEllipse(0, 0, 40, 60),   // Corps
            p7: () => graphics.drawRect(-35, -30, 70, 60),  // Vêtements
            default: () => graphics.drawRect(-20, -20, 40, 40)
        };

        const drawShape = shapes[partKey] || shapes.default;
        drawShape();
        
        graphics.endFill();
        
        // Ajouter un label
        const text = new PIXI.Text(partKey, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x666666
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        container.addChild(graphics);
    }

    // Export des sprites custom
    exportCustomSprites(format = 'png') {
        const exportData = {
            sprites: Array.from(this.uploadedSprites.values()),
            mappings: this.customMappings,
            timestamp: new Date().toISOString()
        };

        switch (format) {
            case 'json':
                this.exportAsJSON(exportData);
                break;
            case 'spritesheet':
                this.exportAsSpriteSheet();
                break;
            case 'frames':
                this.exportAsFrames();
                break;
            case 'pack':
                this.exportAsCompletePack();
                break;
        }
    }

    exportAsJSON(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'labrute-custom-sprites.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    async exportAsSpriteSheet() {
        // Créer un canvas pour la sprite sheet
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculer la taille nécessaire
        const sprites = Array.from(this.uploadedSprites.values());
        const cols = Math.ceil(Math.sqrt(sprites.length));
        const cellSize = 128; // Taille de chaque cellule
        
        canvas.width = cols * cellSize;
        canvas.height = Math.ceil(sprites.length / cols) * cellSize;
        
        // Dessiner chaque sprite
        sprites.forEach((sprite, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * cellSize;
            const y = row * cellSize;
            
            // Centrer le sprite dans la cellule
            const scale = Math.min(cellSize / sprite.width, cellSize / sprite.height) * 0.9;
            const drawWidth = sprite.width * scale;
            const drawHeight = sprite.height * scale;
            const drawX = x + (cellSize - drawWidth) / 2;
            const drawY = y + (cellSize - drawHeight) / 2;
            
            ctx.drawImage(sprite.image, drawX, drawY, drawWidth, drawHeight);
        });
        
        // Exporter
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'labrute-spritesheet.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    async exportAsFrames() {
        // Créer un zip avec toutes les frames
        const sprites = Array.from(this.uploadedSprites.values());
        
        // Pour chaque sprite, créer un fichier
        sprites.forEach(sprite => {
            const a = document.createElement('a');
            a.href = sprite.url;
            a.download = `${sprite.name}`;
            a.click();
        });
    }

    exportAsCompletePack() {
        // Exporter tout : config JSON + images + mappings
        this.exportAsJSON({
            sprites: Array.from(this.uploadedSprites.values()).map(s => ({
                id: s.id,
                name: s.name,
                width: s.width,
                height: s.height
            })),
            mappings: this.customMappings,
            bodyParts: window.LabruteData ? window.LabruteData.bodyPartsInfo : {},
            version: '2.0.0'
        });
        
        // Puis exporter la sprite sheet
        setTimeout(() => {
            this.exportAsSpriteSheet();
        }, 500);
    }

    // Sauvegarder/Charger un projet
    saveProject() {
        const projectData = {
            version: '2.0.0',
            sprites: Array.from(this.uploadedSprites.entries()),
            mappings: this.customMappings,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('labrute-custom-project', JSON.stringify(projectData));
        this.showNotification('Projet sauvegardé !');
    }

    loadProject() {
        const saved = localStorage.getItem('labrute-custom-project');
        if (!saved) {
            this.showNotification('Aucun projet sauvegardé trouvé', 'error');
            return;
        }

        try {
            const projectData = JSON.parse(saved);
            
            // Réinitialiser
            this.uploadedSprites.clear();
            this.customMappings = {};
            this.customTextures.clear();
            document.getElementById('uploadedSprites').innerHTML = '';
            
            // Recharger les sprites
            projectData.sprites.forEach(([id, spriteData]) => {
                this.uploadedSprites.set(id, spriteData);
                this.addSpriteToUI(spriteData);
                if (this.pixiApp) {
                    this.createPixiTexture(spriteData);
                }
            });
            
            // Recharger les mappings
            this.customMappings = projectData.mappings;
            Object.entries(this.customMappings).forEach(([partKey, spriteId]) => {
                const spriteData = this.uploadedSprites.get(spriteId);
                if (spriteData) {
                    const slot = document.querySelector(`.mapping-slot[data-part="${partKey}"]`);
                    const dropZone = slot.querySelector('.drop-zone');
                    dropZone.innerHTML = `
                        <img src="${spriteData.url}" alt="${spriteData.name}">
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem;">${spriteData.name}</p>
                    `;
                    slot.classList.add('filled');
                }
            });
            
            this.updatePreview();
            this.showNotification('Projet chargé avec succès !');
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            this.showNotification('Erreur lors du chargement du projet', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#e53e3e'};
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

// Initialiser le gestionnaire
window.customSpriteManager = null;

// Attendre que tout soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.customSpriteManager = new CustomSpriteManager();
    });
} else {
    window.customSpriteManager = new CustomSpriteManager();
}
