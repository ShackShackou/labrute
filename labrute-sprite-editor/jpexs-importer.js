// Importateur JPEXS
class JpexsImporter {
    constructor() {
        this.importedFiles = [];
        this.processedAssets = new Map();
        this.symbolMappings = {
            'Symbol460': 'male-brute',
            'Symbol752': 'female-brute'
        };
        
        this.init();
    }

    init() {
        this.setupUploadZone();
        this.setupEventListeners();
    }

    setupUploadZone() {
        const uploadZone = document.getElementById('jpexsUploadZone');
        const fileInput = document.getElementById('jpexsFileInput');

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

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
            this.handleFilesDrop(e.dataTransfer);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFilesSelect(e.target.files);
        });
    }

    setupEventListeners() {
        document.getElementById('processJpexsBtn').addEventListener('click', () => {
            this.processImportedFiles();
        });
    }

    async handleFilesDrop(dataTransfer) {
        const items = dataTransfer.items;
        const files = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    await this.traverseFileTree(entry, files);
                }
            }
        }

        this.addFilesToList(files);
    }

    async traverseFileTree(item, files) {
        if (item.isFile) {
            const file = await new Promise(resolve => item.file(resolve));
            if (file.type.startsWith('image/') || file.name.endsWith('.png')) {
                files.push(file);
            }
        } else if (item.isDirectory) {
            const dirReader = item.createReader();
            const entries = await new Promise(resolve => dirReader.readEntries(resolve));
            
            for (const entry of entries) {
                await this.traverseFileTree(entry, files);
            }
        }
    }

    handleFilesSelect(fileList) {
        const files = Array.from(fileList).filter(file => 
            file.type.startsWith('image/') || file.name.endsWith('.png')
        );
        this.addFilesToList(files);
    }

    addFilesToList(files) {
        files.forEach(file => {
            const fileInfo = {
                file: file,
                name: file.name,
                path: file.webkitRelativePath || file.name,
                size: file.size,
                status: 'pending'
            };
            
            this.importedFiles.push(fileInfo);
        });

        this.updateFileList();
        
        if (this.importedFiles.length > 0) {
            document.getElementById('processJpexsBtn').disabled = false;
        }
    }

    updateFileList() {
        const container = document.getElementById('batchList');
        container.innerHTML = '';

        this.importedFiles.forEach((fileInfo, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'batch-item';
            
            const statusClass = `status-${fileInfo.status}`;
            const statusIcon = fileInfo.status === 'success' ? '✓' : 
                              fileInfo.status === 'error' ? '✗' : '•';
            
            itemDiv.innerHTML = `
                <div class="batch-item-status ${statusClass}">${statusIcon}</div>
                <div class="batch-item-name">${fileInfo.name}</div>
                <div class="batch-item-size">${this.formatFileSize(fileInfo.size)}</div>
            `;
            
            container.appendChild(itemDiv);
        });
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    async processImportedFiles() {
        const btn = document.getElementById('processJpexsBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

        // Analyser la structure des fichiers
        const structure = this.analyzeFileStructure();
        
        // Traiter chaque fichier
        for (let i = 0; i < this.importedFiles.length; i++) {
            const fileInfo = this.importedFiles[i];
            
            try {
                await this.processFile(fileInfo, structure);
                fileInfo.status = 'success';
            } catch (error) {
                console.error('Erreur traitement:', error);
                fileInfo.status = 'error';
            }
            
            this.updateFileList();
        }

        // Afficher les résultats du mapping
        this.displayMappingResults();
        
        btn.innerHTML = '<i class="fas fa-check"></i> Traitement terminé';
    }

    analyzeFileStructure() {
        // Analyser les chemins pour détecter la structure
        const structure = {
            symbols: new Map(),
            animations: new Map(),
            bodyParts: new Map()
        };

        this.importedFiles.forEach(fileInfo => {
            const path = fileInfo.path;
            
            // Détecter les symboles (Symbol460, Symbol752)
            const symbolMatch = path.match(/Symbol(\d+)/);
            if (symbolMatch) {
                const symbolId = `Symbol${symbolMatch[1]}`;
                if (!structure.symbols.has(symbolId)) {
                    structure.symbols.set(symbolId, []);
                }
                structure.symbols.get(symbolId).push(fileInfo);
            }
            
            // Détecter les animations
            const animMatch = path.match(/(idle|run|hit|death|win|block|evade|fist|slash|grab|throw|drink|eat)/);
            if (animMatch) {
                const animName = animMatch[1];
                if (!structure.animations.has(animName)) {
                    structure.animations.set(animName, []);
                }
                structure.animations.get(animName).push(fileInfo);
            }
            
            // Détecter les parties du corps
            const partMatch = path.match(/p(\d+[ab]?)/);
            if (partMatch) {
                const partName = `p${partMatch[1]}`;
                if (!structure.bodyParts.has(partName)) {
                    structure.bodyParts.set(partName, []);
                }
                structure.bodyParts.get(partName).push(fileInfo);
            }
        });

        return structure;
    }

    async processFile(fileInfo, structure) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Analyser et catégoriser l'image
                    const category = this.categorizeImage(fileInfo, structure);
                    
                    const processedAsset = {
                        name: fileInfo.name,
                        path: fileInfo.path,
                        url: e.target.result,
                        width: img.width,
                        height: img.height,
                        category: category.type,
                        symbol: category.symbol,
                        animation: category.animation,
                        bodyPart: category.bodyPart,
                        frameNumber: category.frameNumber
                    };
                    
                    this.processedAssets.set(fileInfo.name, processedAsset);
                    resolve();
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(fileInfo.file);
        });
    }

    categorizeImage(fileInfo, structure) {
        const path = fileInfo.path;
        const category = {
            type: 'unknown',
            symbol: null,
            animation: null,
            bodyPart: null,
            frameNumber: null
        };

        // Identifier le symbole
        structure.symbols.forEach((files, symbolId) => {
            if (files.includes(fileInfo)) {
                category.symbol = symbolId;
                category.type = 'character';
            }
        });

        // Identifier l'animation
        structure.animations.forEach((files, animName) => {
            if (files.includes(fileInfo)) {
                category.animation = animName;
                
                // Extraire le numéro de frame
                const frameMatch = path.match(/(\d{3,5})\.(png|jpg)/);
                if (frameMatch) {
                    category.frameNumber = parseInt(frameMatch[1]);
                }
            }
        });

        // Identifier la partie du corps
        structure.bodyParts.forEach((files, partName) => {
            if (files.includes(fileInfo)) {
                category.bodyPart = partName;
                category.type = 'bodyPart';
            }
        });

        return category;
    }

    displayMappingResults() {
        const container = document.getElementById('jpexsMappingResult');
        container.innerHTML = '<h5>Résultats du Mapping</h5>';

        // Grouper par catégorie
        const grouped = {
            characters: new Map(),
            animations: new Map(),
            bodyParts: new Map()
        };

        this.processedAssets.forEach(asset => {
            if (asset.symbol) {
                if (!grouped.characters.has(asset.symbol)) {
                    grouped.characters.set(asset.symbol, []);
                }
                grouped.characters.get(asset.symbol).push(asset);
            }
            
            if (asset.animation) {
                if (!grouped.animations.has(asset.animation)) {
                    grouped.animations.set(asset.animation, []);
                }
                grouped.animations.get(asset.animation).push(asset);
            }
            
            if (asset.bodyPart) {
                if (!grouped.bodyParts.has(asset.bodyPart)) {
                    grouped.bodyParts.set(asset.bodyPart, []);
                }
                grouped.bodyParts.get(asset.bodyPart).push(asset);
            }
        });

        // Afficher les résultats
        if (grouped.characters.size > 0) {
            const charDiv = document.createElement('div');
            charDiv.innerHTML = '<h6>Personnages détectés:</h6>';
            
            grouped.characters.forEach((assets, symbol) => {
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'mapping-result-item';
                symbolDiv.innerHTML = `
                    <strong>${symbol}</strong> → ${this.symbolMappings[symbol] || 'inconnu'}
                    <span class="badge">${assets.length} frames</span>
                `;
                charDiv.appendChild(symbolDiv);
            });
            
            container.appendChild(charDiv);
        }

        if (grouped.animations.size > 0) {
            const animDiv = document.createElement('div');
            animDiv.innerHTML = '<h6>Animations détectées:</h6>';
            
            grouped.animations.forEach((assets, animation) => {
                const frames = assets.sort((a, b) => a.frameNumber - b.frameNumber);
                const animationDiv = document.createElement('div');
                animationDiv.className = 'mapping-result-item';
                animationDiv.innerHTML = `
                    <strong>${animation}</strong>
                    <span class="badge">${frames.length} frames</span>
                `;
                animDiv.appendChild(animationDiv);
            });
            
            container.appendChild(animDiv);
        }

        // Bouton pour intégrer dans l'éditeur
        const integrateBtn = document.createElement('button');
        integrateBtn.className = 'btn btn-primary';
        integrateBtn.innerHTML = '<i class="fas fa-magic"></i> Intégrer dans l\'éditeur';
        integrateBtn.onclick = () => this.integrateIntoEditor();
        
        container.appendChild(integrateBtn);
    }

    integrateIntoEditor() {
        // Intégrer les assets traités dans l'éditeur principal
        if (window.customSpriteManager) {
            this.processedAssets.forEach(asset => {
                // Créer un sprite data compatible
                const spriteData = {
                    id: `jpexs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: asset.name,
                    url: asset.url,
                    width: asset.width,
                    height: asset.height,
                    metadata: {
                        source: 'jpexs',
                        symbol: asset.symbol,
                        animation: asset.animation,
                        bodyPart: asset.bodyPart,
                        frameNumber: asset.frameNumber
                    }
                };
                
                // Ajouter au gestionnaire de sprites
                window.customSpriteManager.uploadedSprites.set(spriteData.id, spriteData);
                window.customSpriteManager.addSpriteToUI(spriteData);
                
                // Si c'est une partie du corps, mapper automatiquement
                if (asset.bodyPart) {
                    window.customSpriteManager.assignSpriteTopart(spriteData.id, asset.bodyPart);
                }
            });
            
            this.showNotification(`${this.processedAssets.size} assets importés avec succès !`);
            
            // Basculer vers l'onglet éditeur
            document.querySelector('[data-tab="editor"]').click();
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    reset() {
        this.importedFiles = [];
        this.processedAssets.clear();
        this.updateFileList();
        document.getElementById('processJpexsBtn').disabled = true;
        document.getElementById('processJpexsBtn').innerHTML = '<i class="fas fa-cogs"></i> Traiter et Organiser';
        document.getElementById('jpexsMappingResult').innerHTML = '';
    }
}

// Initialiser l'importateur
window.jpexsImporter = null;

// Attendre que tout soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jpexsImporter = new JpexsImporter();
    });
} else {
    window.jpexsImporter = new JpexsImporter();
}
