// Gestionnaire de Sprites Personnalisés (Version Simple)
class CustomSpriteManager {
    constructor() {
        this.uploadedSprites = new Map(); // id -> sprite data
        this.customMappings = {}; // bodyPart -> spriteId
        this.currentSpriteId = 0;
        this.simplePreview = null;
        
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
                this.updatePreview();
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
        this.updatePreview();
    }

    // Prévisualisation simple
    initializePreview() {
        // Utiliser SimplePreview au lieu de PIXI
        if (window.SimplePreview) {
            this.simplePreview = new window.SimplePreview('customPreviewContainer');
            this.updatePreview();
        } else {
            console.warn('SimplePreview not loaded, preview disabled');
        }
    }

    updatePreview() {
        if (this.simplePreview) {
            this.simplePreview.updatePreview(this.customMappings, this.uploadedSprites);
        }
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
            document.getElementById('uploadedSprites').innerHTML = '';
            
            // Recharger les sprites
            projectData.sprites.forEach(([id, spriteData]) => {
                this.uploadedSprites.set(id, spriteData);
                this.addSpriteToUI(spriteData);
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
