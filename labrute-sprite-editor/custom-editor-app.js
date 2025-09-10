// Application principale - LaBrute Custom Sprite Editor
class CustomEditorApp {
    constructor() {
        this.currentTab = 'editor';
        this.showingOriginal = false;
        this.managers = {};
        
        this.init();
    }

    init() {
        // Initialiser tous les gestionnaires (déjà fait dans leurs fichiers respectifs)
        this.managers = {
            sprites: window.customSpriteManager,
            assets: window.assetExplorer,
            animation: window.animationEditor,
            jpexs: window.jpexsImporter
        };

        this.setupEventListeners();
        this.setupStyles();
        this.checkForExistingData();
    }

    setupEventListeners() {
        // Gestion des onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Boutons principaux
        document.getElementById('saveProjectBtn').addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('loadProjectBtn').addEventListener('click', () => {
            this.loadProject();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.openExportModal();
        });

        // Contrôles de prévisualisation
        document.getElementById('toggleOriginalBtn').addEventListener('click', () => {
            this.toggleOriginalView();
        });

        document.getElementById('resetCustomBtn').addEventListener('click', () => {
            this.resetCustomSprites();
        });

        // Modal d'export
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const exportType = e.currentTarget.dataset.export;
                this.handleExport(exportType);
            });
        });

        // Fermeture des modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Paramètres d'export
        document.getElementById('exportScale').addEventListener('input', (e) => {
            document.getElementById('scaleValue').textContent = e.target.value + 'x';
        });

        document.getElementById('exportQuality').addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = Math.round(e.target.value * 100) + '%';
        });

        document.getElementById('confirmExportBtn').addEventListener('click', () => {
            this.executeExport();
        });

        document.getElementById('cancelExportBtn').addEventListener('click', () => {
            document.getElementById('exportModal').style.display = 'none';
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S pour sauvegarder
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
            
            // Ctrl/Cmd + O pour ouvrir
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.loadProject();
            }
            
            // Ctrl/Cmd + E pour exporter
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.openExportModal();
            }
            
            // Espace pour play/pause animation
            if (e.key === ' ' && this.currentTab === 'animator') {
                e.preventDefault();
                this.managers.animation.togglePreview();
            }
        });
    }

    setupStyles() {
        // Ajouter des styles supplémentaires
        const style = document.createElement('style');
        style.textContent = `
            /* Animations */
            @keyframes slideUp {
                from { transform: translate(-50%, 100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
            
            @keyframes slideDown {
                from { transform: translate(-50%, 0); opacity: 1; }
                to { transform: translate(-50%, 100%); opacity: 0; }
            }
            
            /* Layout responsive */
            .editor-layout {
                display: grid;
                grid-template-columns: 350px 1fr;
                gap: 1rem;
                height: calc(100vh - 200px);
            }
            
            .editor-sidebar {
                overflow-y: auto;
                padding-right: 0.5rem;
            }
            
            .editor-main {
                display: flex;
                flex-direction: column;
            }
            
            /* Améliorations visuelles */
            .mapping-result-item {
                padding: 0.5rem;
                background: #f8fafc;
                border-radius: 6px;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .badge {
                background: #667eea;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
            }
            
            .alert {
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                display: flex;
                align-items: start;
                gap: 0.75rem;
            }
            
            .alert-info {
                background: #e6f3ff;
                color: #0066cc;
                border: 1px solid #b3d9ff;
            }
            
            .jpexs-layout {
                padding: 1rem;
            }
            
            .animator-layout {
                display: grid;
                grid-template-columns: 300px 1fr;
                gap: 1rem;
                height: calc(100vh - 200px);
            }
            
            .animator-sidebar {
                overflow-y: auto;
            }
            
            .animator-main {
                display: flex;
                flex-direction: column;
            }
            
            .animation-properties {
                background: #f8fafc;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
            }
            
            .animation-controls {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 1rem;
            }
            
            /* États de chargement */
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                display: none;
            }
            
            .loading-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
            }
            
            .loading-spinner {
                font-size: 3rem;
                color: #667eea;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* Tooltips */
            [title] {
                position: relative;
            }
            
            [title]:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #2d3748;
                color: white;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                font-size: 0.85rem;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
                margin-bottom: 0.5rem;
            }
            
            [title]:hover::before {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 6px solid transparent;
                border-top-color: #2d3748;
                margin-bottom: -0.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Mettre à jour les panneaux
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName);
        });
        
        // Actions spécifiques par onglet
        switch (tabName) {
            case 'editor':
                this.managers.sprites.updatePreview();
                break;
            case 'explorer':
                // L'explorateur est déjà initialisé
                break;
            case 'animator':
                // Synchroniser avec les sprites custom si disponibles
                const customSprites = {};
                this.managers.sprites.customMappings && Object.entries(this.managers.sprites.customMappings).forEach(([part, spriteId]) => {
                    const sprite = this.managers.sprites.uploadedSprites.get(spriteId);
                    if (sprite && this.managers.sprites.customTextures.has(spriteId)) {
                        customSprites[part] = {
                            texture: this.managers.sprites.customTextures.get(spriteId)
                        };
                    }
                });
                if (Object.keys(customSprites).length > 0) {
                    this.managers.animation.setCustomSprites(customSprites);
                }
                break;
            case 'jpexs':
                // Réinitialiser si nécessaire
                break;
        }
    }

    toggleOriginalView() {
        this.showingOriginal = !this.showingOriginal;
        const btn = document.getElementById('toggleOriginalBtn');
        
        if (this.showingOriginal) {
            btn.innerHTML = '<i class="fas fa-exchange-alt"></i> Custom';
            // Afficher les sprites originaux
            this.showOriginalSprites();
        } else {
            btn.innerHTML = '<i class="fas fa-exchange-alt"></i> Original';
            // Afficher les sprites custom
            this.managers.sprites.updatePreview();
        }
    }

    showOriginalSprites() {
        // Créer une prévisualisation avec les sprites originaux du jeu
        const container = this.managers.sprites.pixiApp.stage;
        container.removeChildren();
        
        const bruteContainer = new PIXI.Container();
        const _canvas = this.managers.sprites.pixiApp.canvas || this.managers.sprites.pixiApp.view;
        bruteContainer.x = _canvas.width / 2;
        bruteContainer.y = _canvas.height / 2;
        
        // Utiliser les données de LabruteData pour créer une brute originale
        const bodyString = window.LabruteData.generateBodyString(this.managers.sprites.currentParts || {});
        const colorString = window.LabruteData.generateColorString(this.managers.sprites.currentColors || {});
        
        // Afficher un message
        const text = new PIXI.Text('Sprites Originaux\n(Non implémenté - Utiliser BruteDisplay)', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x666666,
            align: 'center'
        });
        text.anchor.set(0.5);
        bruteContainer.addChild(text);
        
        container.addChild(bruteContainer);
    }

    resetCustomSprites() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les sprites custom ?')) {
            // Réinitialiser les mappings
            this.managers.sprites.customMappings = {};
            
            // Réinitialiser l'UI
            document.querySelectorAll('.mapping-slot').forEach(slot => {
                slot.classList.remove('filled');
                const dropZone = slot.querySelector('.drop-zone');
                const partKey = slot.dataset.part;
                dropZone.innerHTML = `
                    <i class="fas fa-plus-circle" style="font-size: 2rem; color: #cbd5e0;"></i>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #718096;">Glisser ici</p>
                `;
            });
            
            // Mettre à jour la prévisualisation
            this.managers.sprites.updatePreview();
            
            this.showNotification('Sprites custom réinitialisés');
        }
    }

    saveProject() {
        const projectData = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            customSprites: {
                sprites: Array.from(this.managers.sprites.uploadedSprites.entries()),
                mappings: this.managers.sprites.customMappings
            },
            animations: this.managers.animation.exportAnimation(),
            metadata: {
                lastTab: this.currentTab,
                exportSettings: {
                    format: document.getElementById('exportFormat').value,
                    scale: document.getElementById('exportScale').value,
                    quality: document.getElementById('exportQuality').value
                }
            }
        };
        
        // Sauvegarder dans localStorage
        localStorage.setItem('labrute-custom-editor-project', JSON.stringify(projectData));
        
        // Aussi proposer de télécharger
        const json = JSON.stringify(projectData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `labrute-project-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.showNotification('Projet sauvegardé !');
    }

    loadProject() {
        // Créer un input file temporaire
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const projectData = JSON.parse(e.target.result);
                        this.importProject(projectData);
                    } catch (error) {
                        console.error('Erreur lors du chargement:', error);
                        this.showNotification('Erreur lors du chargement du projet', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    importProject(projectData) {
        // Afficher un loader
        this.showLoader('Chargement du projet...');
        
        setTimeout(() => {
            try {
                // Charger les sprites custom
                if (projectData.customSprites) {
                    this.managers.sprites.uploadedSprites.clear();
                    this.managers.sprites.customMappings = {};
                    
                    projectData.customSprites.sprites.forEach(([id, spriteData]) => {
                        this.managers.sprites.uploadedSprites.set(id, spriteData);
                        this.managers.sprites.addSpriteToUI(spriteData);
                        if (this.managers.sprites.pixiApp) {
                            this.managers.sprites.createPixiTexture(spriteData);
                        }
                    });
                    
                    // Restaurer les mappings
                    Object.entries(projectData.customSprites.mappings).forEach(([part, spriteId]) => {
                        this.managers.sprites.assignSpriteTopart(spriteId, part);
                    });
                }
                
                // Charger les animations
                if (projectData.animations) {
                    this.managers.animation.importAnimation(projectData.animations);
                }
                
                // Restaurer les paramètres
                if (projectData.metadata) {
                    if (projectData.metadata.exportSettings) {
                        document.getElementById('exportFormat').value = projectData.metadata.exportSettings.format;
                        document.getElementById('exportScale').value = projectData.metadata.exportSettings.scale;
                        document.getElementById('exportQuality').value = projectData.metadata.exportSettings.quality;
                    }
                    
                    // Restaurer l'onglet actif
                    if (projectData.metadata.lastTab) {
                        this.switchTab(projectData.metadata.lastTab);
                    }
                }
                
                this.hideLoader();
                this.showNotification('Projet chargé avec succès !');
            } catch (error) {
                console.error('Erreur import:', error);
                this.hideLoader();
                this.showNotification('Erreur lors de l\'import du projet', 'error');
            }
        }, 500);
    }

    openExportModal() {
        document.getElementById('exportModal').style.display = 'block';
        this.updateExportPreview();
    }

    updateExportPreview() {
        const container = document.getElementById('exportPreview');
        container.innerHTML = '<h4>Aperçu de l\'export</h4>';
        
        // Créer un aperçu miniature
        const previewDiv = document.createElement('div');
        previewDiv.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 1rem;
            max-height: 300px;
            overflow-y: auto;
        `;
        
        // Afficher les sprites mappés
        Object.entries(this.managers.sprites.customMappings).forEach(([part, spriteId]) => {
            const sprite = this.managers.sprites.uploadedSprites.get(spriteId);
            if (sprite) {
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = `
                    text-align: center;
                    padding: 0.5rem;
                    background: #f8fafc;
                    border-radius: 8px;
                `;
                itemDiv.innerHTML = `
                    <img src="${sprite.url}" style="width: 60px; height: 60px; object-fit: contain;">
                    <div style="font-size: 0.75rem; margin-top: 0.25rem;">${part}</div>
                `;
                previewDiv.appendChild(itemDiv);
            }
        });
        
        if (previewDiv.children.length === 0) {
            previewDiv.innerHTML = '<p style="color: #718096;">Aucun sprite custom mappé</p>';
        }
        
        container.appendChild(previewDiv);
    }

    handleExport(exportType) {
        this.currentExportType = exportType;
        
        switch (exportType) {
            case 'spritesheet':
                this.managers.sprites.exportAsSpriteSheet();
                break;
            case 'frames':
                this.managers.sprites.exportAsFrames();
                break;
            case 'config':
                this.managers.sprites.exportAsJSON({
                    sprites: Array.from(this.managers.sprites.uploadedSprites.values()),
                    mappings: this.managers.sprites.customMappings,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'pack':
                this.managers.sprites.exportAsCompletePack();
                break;
        }
        
        document.getElementById('exportModal').style.display = 'none';
    }

    executeExport() {
        const format = document.getElementById('exportFormat').value;
        const scale = parseFloat(document.getElementById('exportScale').value);
        const quality = parseFloat(document.getElementById('exportQuality').value);
        
        // Implémenter l'export avec les paramètres
        this.showLoader('Export en cours...');
        
        setTimeout(() => {
            // Simuler l'export
            this.hideLoader();
            this.showNotification('Export terminé !');
            document.getElementById('exportModal').style.display = 'none';
        }, 1000);
    }

    checkForExistingData() {
        // Vérifier s'il y a un projet sauvegardé
        const saved = localStorage.getItem('labrute-custom-editor-project');
        if (saved) {
            try {
                const projectData = JSON.parse(saved);
                const date = new Date(projectData.timestamp).toLocaleString();
                
                if (confirm(`Un projet sauvegardé a été trouvé (${date}). Voulez-vous le charger ?`)) {
                    this.importProject(projectData);
                }
            } catch (error) {
                console.error('Erreur lecture sauvegarde:', error);
            }
        }
    }

    showLoader(message = 'Chargement...') {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <i class="fas fa-spinner loading-spinner"></i>
                    <p class="loading-message" style="margin-top: 1rem;">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.querySelector('.loading-message').textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoader() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#e53e3e'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialiser l'application quand tout est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que tous les modules soient chargés
    setTimeout(() => {
        window.customEditorApp = new CustomEditorApp();
        console.log('✨ LaBrute Custom Sprite Editor v2.0.0 - Prêt !');
    }, 100);
});
