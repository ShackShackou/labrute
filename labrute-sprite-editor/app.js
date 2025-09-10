// Application principale LaBrute Sprite Editor
class LaBruteSpriteEditor {
    constructor() {
        this.currentGender = 'male';
        this.currentParts = {};
        this.currentColors = {};
        this.pixiApp = null;
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.currentScale = 1;
        this.currentDirection = 1; // 1 = droite, -1 = gauche
        this.bruteSprite = null;
        this.selectedPart = null; // Pour tracker la partie sélectionnée
        
        this.init();
    }

    init() {
        this.initializeData();
        this.setupEventListeners();
        this.generateBodyPartsControls();
        this.generateColorControls();
        this.generatePartsGuide();
        this.generateColorPalettes();
        this.generateAssetsGrid();
        this.updateDisplay();
        this.initializePreview();
    }

    initializeData() {
        const { availableBodyParts } = window.LabruteData;
        
        // Initialiser avec des valeurs par défaut
        availableBodyParts[this.currentGender] && Object.keys(availableBodyParts[this.currentGender]).forEach(part => {
            this.currentParts[part] = 0;
        });

        window.LabruteData.colorOrder.forEach(color => {
            this.currentColors[color] = 0;
        });
    }

    setupEventListeners() {
        // Gestion des onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Gestion du genre
        document.querySelectorAll('input[name="gender"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeGender(e.target.value);
            });
        });

        // Actions rapides
        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.randomizeBrute();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetBrute();
        });

        document.getElementById('copyConfigBtn').addEventListener('click', () => {
            this.copyCurrentConfig();
        });

        // Boutons de contrôle preview
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.zoomPreview(1.2);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.zoomPreview(0.8);
        });

        document.getElementById('flipBtn').addEventListener('click', () => {
            this.flipPreview();
        });

        // Modals
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openModal('helpModal');
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.openExportModal();
        });

        // Fermeture des modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Boutons de copie
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.copyToClipboard(e.target.dataset.target);
            });
        });

        // Filtres assets
        document.getElementById('assetCategory').addEventListener('change', () => {
            this.filterAssets();
        });

        document.getElementById('assetSearch').addEventListener('input', () => {
            this.filterAssets();
        });

        // Fermeture modal sur clic extérieur
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    generateBodyPartsControls() {
        const container = document.getElementById('bodyPartsControls');
        const { availableBodyParts, bodyPartsInfo, bodyPartsOrder, getPartVariantDescription } = window.LabruteData;
        
        container.innerHTML = '';

        bodyPartsOrder.forEach(partKey => {
            const maxValue = availableBodyParts[this.currentGender][partKey] || 0;
            const partInfo = bodyPartsInfo[partKey];
            
            const controlDiv = document.createElement('div');
            controlDiv.className = 'body-part-control';
            
            // Ajouter une classe pour les parties sans effet
            if (partKey === 'p8' || (this.currentGender === 'female' && (partKey === 'p2' || partKey === 'p6'))) {
                controlDiv.classList.add('disabled-part');
            }
            
            // Créer le contenu avec description détaillée
            const currentValue = this.currentParts[partKey] || 0;
            const variantDesc = getPartVariantDescription(partKey, currentValue, this.currentGender);
            
            controlDiv.innerHTML = `
                <div class="part-header ${this.selectedPart === partKey ? 'selected' : ''}" data-part="${partKey}">
                    <div class="part-main-info">
                        <span class="part-name">${partInfo.name} (${partKey})</span>
                        <span class="part-value" id="value-${partKey}">${currentValue}</span>
                    </div>
                    <div class="part-description">${partInfo.description}</div>
                    <div class="part-variant-desc" id="variant-${partKey}">${variantDesc}</div>
                </div>
                ${maxValue > 0 ? `
                    <input type="range" 
                           id="range-${partKey}" 
                           min="0" 
                           max="${maxValue}" 
                           value="${currentValue}"
                           data-part="${partKey}"
                           ${partKey === 'p8' ? 'disabled' : ''}>
                    <div class="part-variants-preview" id="preview-${partKey}">
                        ${this.generateVariantsPreview(partKey, maxValue)}
                    </div>
                ` : '<div class="no-variants">Pas de variantes pour ce genre</div>'}
            `;

            // Rendre la partie cliquable
            const partHeader = controlDiv.querySelector('.part-header');
            partHeader.addEventListener('click', () => {
                this.selectPart(partKey);
            });

            if (maxValue > 0 && partKey !== 'p8') {
                const slider = controlDiv.querySelector('input[type="range"]');
                const valueDisplay = controlDiv.querySelector('.part-value');
                const variantDisplay = controlDiv.querySelector('.part-variant-desc');

                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.currentParts[partKey] = value;
                    valueDisplay.textContent = value;
                    
                    // Mettre à jour la description de la variante
                    const newVariantDesc = getPartVariantDescription(partKey, value, this.currentGender);
                    variantDisplay.textContent = newVariantDesc;
                    
                    // Mettre à jour les previews des variantes
                    this.updateVariantsPreview(partKey, value);
                    
                    this.updateDisplay();
                    this.updateBrutePreview();
                });

                // Rendre les variantes cliquables
                controlDiv.querySelectorAll('.variant-preview').forEach(preview => {
                    preview.addEventListener('click', (e) => {
                        const value = parseInt(e.target.dataset.value);
                        slider.value = value;
                        slider.dispatchEvent(new Event('input'));
                    });
                });
            }

            container.appendChild(controlDiv);
        });
    }

    generateVariantsPreview(partKey, maxValue) {
        const { getPartVariantDescription } = window.LabruteData;
        let html = '<div class="variants-grid">';
        
        for (let i = 0; i <= maxValue; i++) {
            const variantDesc = getPartVariantDescription(partKey, i, this.currentGender);
            const isActive = this.currentParts[partKey] === i;
            
            html += `
                <div class="variant-preview ${isActive ? 'active' : ''}" 
                     data-part="${partKey}" 
                     data-value="${i}"
                     title="${variantDesc}">
                    <div class="variant-number">${i}</div>
                    <div class="variant-mini-desc">${variantDesc.substring(0, 15)}...</div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    updateVariantsPreview(partKey, activeValue) {
        const previewContainer = document.getElementById(`preview-${partKey}`);
        if (!previewContainer) return;
        
        previewContainer.querySelectorAll('.variant-preview').forEach(preview => {
            const value = parseInt(preview.dataset.value);
            if (value === activeValue) {
                preview.classList.add('active');
            } else {
                preview.classList.remove('active');
            }
        });
    }

    selectPart(partKey) {
        // Désélectionner l'ancienne partie
        document.querySelectorAll('.part-header').forEach(header => {
            header.classList.remove('selected');
        });
        
        // Sélectionner la nouvelle partie
        const selectedHeader = document.querySelector(`.part-header[data-part="${partKey}"]`);
        if (selectedHeader) {
            selectedHeader.classList.add('selected');
            this.selectedPart = partKey;
            
            // Mettre en évidence la partie dans la prévisualisation
            this.highlightPartInPreview(partKey);
        }
    }

    generateColorControls() {
        const container = document.getElementById('colorControls');
        const { colorMapping, colorOrder, colors, getColor, colorInfo } = window.LabruteData;
        
        container.innerHTML = '';

        // Grouper les couleurs par catégorie
        const colorGroups = {
            skin: [],
            hair: [],
            clothing: []
        };

        colorOrder.forEach(colorKey => {
            const colorData = colorMapping[colorKey];
            colorGroups[colorData.type].push({ key: colorKey, ...colorData });
        });

        // Créer les sections pour chaque groupe
        Object.entries(colorGroups).forEach(([groupName, colorList]) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'color-group';
            
            const groupTitle = document.createElement('h4');
            groupTitle.className = 'color-group-title';
            groupTitle.innerHTML = `
                <i class="fas fa-${groupName === 'skin' ? 'hand' : groupName === 'hair' ? 'cut' : 'tshirt'}"></i>
                ${groupName === 'skin' ? 'Peau' : groupName === 'hair' ? 'Cheveux' : 'Vêtements'}
            `;
            groupDiv.appendChild(groupTitle);

            colorList.forEach(colorData => {
                const colorType = colorData.type;
                const maxIndex = colors[this.currentGender][colorType]?.length || 1;

                const controlDiv = document.createElement('div');
                controlDiv.className = 'color-control';
                
                controlDiv.innerHTML = `
                    <div class="color-header">
                        <div class="color-preview" 
                             id="preview-${colorData.key}" 
                             style="background-color: ${getColor(this.currentGender, colorType, 0)}">
                        </div>
                        <label for="select-${colorData.key}" class="color-label">
                            ${colorData.name}
                            <span class="color-key">(${colorData.key})</span>
                        </label>
                    </div>
                    <select id="select-${colorData.key}" data-color="${colorData.key}" class="color-select">
                        ${Array.from({length: maxIndex}, (_, i) => 
                            `<option value="${i}">Variante ${i + 1}</option>`
                        ).join('')}
                    </select>
                    <div class="color-palette-mini" id="palette-${colorData.key}">
                        ${this.generateColorPaletteMini(colorType, colorData.key)}
                    </div>
                `;

                const select = controlDiv.querySelector('select');
                const preview = controlDiv.querySelector('.color-preview');

                select.addEventListener('change', (e) => {
                    const value = parseInt(e.target.value);
                    this.currentColors[colorData.key] = value;
                    const newColor = getColor(this.currentGender, colorType, value);
                    preview.style.backgroundColor = newColor;
                    this.updateColorPaletteMini(colorData.key, value);
                    this.updateDisplay();
                    this.updateBrutePreview();
                });

                // Rendre les couleurs de la mini palette cliquables
                controlDiv.addEventListener('click', (e) => {
                    if (e.target.classList.contains('color-mini')) {
                        const value = parseInt(e.target.dataset.index);
                        select.value = value;
                        select.dispatchEvent(new Event('change'));
                    }
                });

                groupDiv.appendChild(controlDiv);
            });

            container.appendChild(groupDiv);
        });
    }

    generateColorPaletteMini(colorType, colorKey) {
        const { colors, getColor } = window.LabruteData;
        const colorArray = colors[this.currentGender][colorType] || [];
        
        let html = '<div class="color-palette-row">';
        colorArray.forEach((_, index) => {
            const color = getColor(this.currentGender, colorType, index);
            const isActive = this.currentColors[colorKey] === index;
            html += `
                <div class="color-mini ${isActive ? 'active' : ''}" 
                     style="background-color: ${color}"
                     data-color="${colorKey}"
                     data-index="${index}"
                     title="${color}">
                </div>
            `;
        });
        html += '</div>';
        
        return html;
    }

    updateColorPaletteMini(colorKey, activeIndex) {
        const paletteContainer = document.getElementById(`palette-${colorKey}`);
        if (!paletteContainer) return;
        
        paletteContainer.querySelectorAll('.color-mini').forEach((mini, index) => {
            if (index === activeIndex) {
                mini.classList.add('active');
            } else {
                mini.classList.remove('active');
            }
        });
    }

    generatePartsGuide() {
        const container = document.getElementById('partsGuide');
        const { bodyPartsInfo, availableBodyParts } = window.LabruteData;
        
        container.innerHTML = '<h3>📖 Guide Complet des Parties de Corps</h3>';

        Object.entries(bodyPartsInfo).forEach(([partKey, info]) => {
            const maleVariants = availableBodyParts.male[partKey] || 0;
            const femaleVariants = availableBodyParts.female[partKey] || 0;

            const partDiv = document.createElement('div');
            partDiv.className = 'part-info-detailed';
            
            let variantsHtml = '';
            
            // Afficher toutes les variantes disponibles
            if (info.variants) {
                variantsHtml = '<div class="variants-list"><h5>Variantes disponibles :</h5><ul>';
                Object.entries(info.variants).forEach(([value, desc]) => {
                    variantsHtml += `<li><strong>${value}</strong> : ${desc}</li>`;
                });
                variantsHtml += '</ul></div>';
            } else if (info.variantsMale || info.variantsFemale) {
                variantsHtml = '<div class="variants-list">';
                
                if (info.variantsMale) {
                    variantsHtml += '<h5>Variantes Hommes :</h5><ul>';
                    Object.entries(info.variantsMale).forEach(([value, desc]) => {
                        variantsHtml += `<li><strong>${value}</strong> : ${desc}</li>`;
                    });
                    variantsHtml += '</ul>';
                }
                
                if (info.variantsFemale) {
                    variantsHtml += '<h5>Variantes Femmes :</h5><ul>';
                    Object.entries(info.variantsFemale).forEach(([value, desc]) => {
                        variantsHtml += `<li><strong>${value}</strong> : ${desc}</li>`;
                    });
                    variantsHtml += '</ul>';
                }
                
                variantsHtml += '</div>';
            }
            
            partDiv.innerHTML = `
                <h4 class="part-guide-title" data-part="${partKey}">
                    <i class="fas fa-puzzle-piece"></i>
                    ${info.name} (${partKey})
                    ${partKey === 'p8' ? '<span class="bug-badge">⚠️ BUG</span>' : ''}
                </h4>
                <div class="part-description">
                    ${info.description}
                </div>
                <div class="part-variations">
                    <div class="variation-badge male-badge">
                        <i class="fas fa-mars"></i> ${maleVariants} variants
                    </div>
                    <div class="variation-badge female-badge">
                        <i class="fas fa-venus"></i> ${femaleVariants} variants
                    </div>
                    <div class="variation-badge category-badge">
                        <i class="fas fa-tag"></i> ${info.category}
                    </div>
                </div>
                ${variantsHtml}
            `;

            // Rendre le titre cliquable pour sélectionner la partie
            const titleElement = partDiv.querySelector('.part-guide-title');
            titleElement.addEventListener('click', () => {
                this.selectPart(partKey);
                // Scroller vers le contrôle correspondant
                const control = document.querySelector(`.part-header[data-part="${partKey}"]`);
                if (control) {
                    control.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            container.appendChild(partDiv);
        });
    }

    generateColorPalettes() {
        const container = document.getElementById('colorPalettes');
        const { colors, colorInfo } = window.LabruteData;
        
        container.innerHTML = '<h3>🎨 Guide Complet des Couleurs</h3>';

        // Afficher la signification de chaque canal de couleur
        const colorGuideDiv = document.createElement('div');
        colorGuideDiv.className = 'color-guide';
        colorGuideDiv.innerHTML = '<h4>Signification des Canaux de Couleur :</h4><div class="color-channels-grid">';
        
        Object.entries(colorInfo).forEach(([key, desc]) => {
            colorGuideDiv.innerHTML += `
                <div class="color-channel-info">
                    <span class="channel-key">${key}</span>
                    <span class="channel-desc">${desc}</span>
                </div>
            `;
        });
        
        colorGuideDiv.innerHTML += '</div>';
        container.appendChild(colorGuideDiv);

        // Palettes par catégorie
        const categories = [
            { key: 'skin', name: 'Couleurs de Peau', icon: 'fas fa-hand' },
            { key: 'hair', name: 'Couleurs de Cheveux', icon: 'fas fa-cut' },
            { key: 'clothing', name: 'Couleurs de Vêtements', icon: 'fas fa-tshirt' }
        ];

        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'color-category';
            
            const maleColors = colors.male[category.key] || [];
            const femaleColors = colors.female[category.key] || [];
            const allColors = [...new Set([...maleColors, ...femaleColors])];

            categoryDiv.innerHTML = `
                <h4>
                    <i class="${category.icon}"></i>
                    ${category.name}
                </h4>
                <div class="color-palette">
                    ${allColors.map((color, index) => {
                        const inMale = maleColors.includes(color);
                        const inFemale = femaleColors.includes(color);
                        const maleIndex = maleColors.indexOf(color);
                        const femaleIndex = femaleColors.indexOf(color);
                        
                        return `
                        <div class="color-swatch" data-color="${color}">
                            <div class="color-circle" 
                                 style="background-color: ${color}"
                                 data-index="${index}">
                            </div>
                            <div class="color-code">${color}</div>
                            <div class="color-indices">
                                ${inMale ? `<span class="male-index">♂${maleIndex}</span>` : ''}
                                ${inFemale ? `<span class="female-index">♀${femaleIndex}</span>` : ''}
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `;

            // Ajout d'événements pour les couleurs
            categoryDiv.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    const color = swatch.dataset.color;
                    navigator.clipboard.writeText(color).then(() => {
                        this.showNotification(`Couleur ${color} copiée !`);
                    });
                });
            });

            container.appendChild(categoryDiv);
        });
    }

    generateAssetsGrid() {
        const container = document.getElementById('assetsGrid');
        const { createDemoSprites } = window.LabruteData;
        
        // Utiliser des sprites de démo qui fonctionnent
        const demoSprites = createDemoSprites();
        
        this.allAssets = [
            ...demoSprites.skills.map(skill => ({
                ...skill,
                category: 'skills',
                categoryName: 'Skills (SVG)',
                path: skill.demoPath
            })),
            ...demoSprites.weapons.map(weapon => ({
                ...weapon,
                category: 'weapons', 
                categoryName: 'Armes (PNG)',
                path: weapon.demoPath
            }))
        ];

        this.renderAssetsGrid(this.allAssets);
    }

    renderAssetsGrid(assets) {
        const container = document.getElementById('assetsGrid');
        
        container.innerHTML = assets.map(asset => `
            <div class="asset-card" data-category="${asset.category}">
                <img src="${asset.path}" 
                     alt="${asset.name}"
                     style="width: 100%; height: 80px; object-fit: contain;">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-id">${asset.id}</div>
            </div>
        `).join('');
    }

    filterAssets() {
        const category = document.getElementById('assetCategory').value;
        const search = document.getElementById('assetSearch').value.toLowerCase();
        
        let filteredAssets = this.allAssets;

        if (category !== 'all') {
            filteredAssets = filteredAssets.filter(asset => asset.category === category);
        }

        if (search) {
            filteredAssets = filteredAssets.filter(asset => 
                asset.name.toLowerCase().includes(search) ||
                asset.id.toLowerCase().includes(search)
            );
        }

        this.renderAssetsGrid(filteredAssets);
    }

    changeGender(newGender) {
        this.currentGender = newGender;
        this.initializeData();
        this.generateBodyPartsControls();
        this.generateColorControls();
        this.updateDisplay();
        this.updateBrutePreview();
    }

    randomizeBrute() {
        const { generateRandomBrute, getPartVariantDescription } = window.LabruteData;
        const randomBrute = generateRandomBrute(this.currentGender);
        
        this.currentParts = randomBrute.parts;
        this.currentColors = randomBrute.colors;
        
        // Mettre à jour les contrôles
        Object.entries(this.currentParts).forEach(([part, value]) => {
            const slider = document.getElementById(`range-${part}`);
            const valueDisplay = document.getElementById(`value-${part}`);
            const variantDisplay = document.getElementById(`variant-${part}`);
            
            if (slider) {
                slider.value = value;
                valueDisplay.textContent = value;
                
                // Mettre à jour la description de variante
                if (variantDisplay) {
                    const variantDesc = getPartVariantDescription(part, value, this.currentGender);
                    variantDisplay.textContent = variantDesc;
                }
                
                // Mettre à jour les previews
                this.updateVariantsPreview(part, value);
            }
        });

        Object.entries(this.currentColors).forEach(([color, value]) => {
            const select = document.getElementById(`select-${color}`);
            const preview = document.getElementById(`preview-${color}`);
            if (select) {
                select.value = value;
                const { colorMapping, getColor } = window.LabruteData;
                const colorType = colorMapping[color].type;
                const newColor = getColor(this.currentGender, colorType, value);
                preview.style.backgroundColor = newColor;
                this.updateColorPaletteMini(color, value);
            }
        });

        this.updateDisplay();
        this.updateBrutePreview();
        this.showNotification('Brute aléatoire générée !');
    }

    resetBrute() {
        const { getPartVariantDescription } = window.LabruteData;
        this.initializeData();
        
        // Reset des contrôles
        document.querySelectorAll('#bodyPartsControls input[type="range"]').forEach(slider => {
            slider.value = 0;
        });

        document.querySelectorAll('#bodyPartsControls .part-value').forEach(value => {
            value.textContent = '0';
        });

        // Reset des descriptions de variantes
        document.querySelectorAll('#bodyPartsControls .part-variant-desc').forEach(variantDesc => {
            const partKey = variantDesc.id.replace('variant-', '');
            const desc = getPartVariantDescription(partKey, 0, this.currentGender);
            variantDesc.textContent = desc;
        });

        // Reset des previews
        window.LabruteData.bodyPartsOrder.forEach(part => {
            this.updateVariantsPreview(part, 0);
        });

        document.querySelectorAll('#colorControls select').forEach(select => {
            select.value = 0;
        });

        document.querySelectorAll('#colorControls .color-preview').forEach(preview => {
            const colorKey = preview.id.replace('preview-', '');
            const { colorMapping, getColor } = window.LabruteData;
            const colorType = colorMapping[colorKey].type;
            preview.style.backgroundColor = getColor(this.currentGender, colorType, 0);
        });

        // Reset des mini palettes
        window.LabruteData.colorOrder.forEach(color => {
            this.updateColorPaletteMini(color, 0);
        });

        this.updateDisplay();
        this.updateBrutePreview();
        this.showNotification('Configuration réinitialisée !');
    }

    updateDisplay() {
        const { generateBodyString, generateColorString } = window.LabruteData;
        
        const bodyString = generateBodyString(this.currentParts);
        const colorString = generateColorString(this.currentColors);
        
        document.getElementById('bodyString').textContent = bodyString;
        document.getElementById('colorString').textContent = colorString;
        document.getElementById('genderDisplay').textContent = this.currentGender;
    }

    // ✅ FONCTION AMÉLIORÉE : Prévisualisation avec parties cliquables
    initializePreview() {
        const container = document.getElementById('pixiContainer');
        
        // Créer l'application PIXI avec de meilleurs paramètres
        this.pixiApp = new PIXI.Application({
            width: 400,
            height: 300,
            backgroundColor: 0xf7fafc,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        container.appendChild(this.pixiApp.view);
        
        // Rendre le canvas interactif
        this.pixiApp.view.style.cursor = 'pointer';
        
        // Charger la vraie prévisualisation
        this.loadBrutePreview();
    }

    loadBrutePreview() {
        this.showLoadingSpinner(true);
        
        setTimeout(() => {
            this.createBruteSprite();
            this.showLoadingSpinner(false);
        }, 500);
    }

    // ✅ FONCTION AMÉLIORÉE : Visualisation détaillée avec labels
    async createBruteSprite() {
        const { colors, getColor, colorMapping, bodyPartsInfo, getPartVariantDescription } = window.LabruteData;
        
        // Si on a BruteDisplay, l'utiliser
        if (window.BruteDisplay && !this.bruteDisplay) {
            this.bruteDisplay = new window.BruteDisplay();
        }
        
        // Effacer le stage actuel
        this.pixiApp.stage.removeChildren();
        
        // Si BruteDisplay est disponible, l'utiliser
        if (this.bruteDisplay) {
            try {
                // Créer les strings pour BruteDisplay
                const bodyString = window.LabruteData.generateBodyString(this.currentParts);
                const colorString = window.LabruteData.generateColorString(this.currentColors);
                
                // Initialiser BruteDisplay
                await this.bruteDisplay.initialize({
                    gender: this.currentGender,
                    parts: bodyString,
                    colors: colorString
                });
                
                // Ajouter le container au stage
                const bruteContainer = this.bruteDisplay.getContainer();
                bruteContainer.x = this.pixiApp.view.width / 2;
                bruteContainer.y = this.pixiApp.view.height / 2;
                this.pixiApp.stage.addChild(bruteContainer);
                
                console.log('✅ BruteDisplay réel utilisé');
                return;
            } catch (error) {
                console.error('❌ Erreur BruteDisplay, fallback:', error);
            }
        }
        
        // Fallback : ancien système
        const bruteContainer = new PIXI.Container();
        bruteContainer.x = this.pixiApp.view.width / 2;
        bruteContainer.y = this.pixiApp.view.height / 2;
        
        // Obtenir les couleurs actuelles
        const skinColor = parseInt(getColor(this.currentGender, 'skin', this.currentColors.col0).replace('#', ''), 16);
        const hairColor = parseInt(getColor(this.currentGender, 'hair', this.currentColors.col1).replace('#', ''), 16);
        const clothingColor = parseInt(getColor(this.currentGender, 'clothing', this.currentColors.col2).replace('#', ''), 16);
        
        // CORPS - Basé sur p2 (taille) et p3 (cheveux en vrai)
        const bodyScale = this.currentGender === 'male' ? (0.8 + (this.currentParts.p2 || 0) * 0.1) : 1;
        const bodySize = 60 * bodyScale;
        
        const body = new PIXI.Graphics();
        body.beginFill(skinColor);
        body.drawEllipse(0, 0, bodySize, bodySize * 1.4);
        body.endFill();
        bruteContainer.addChild(body);
        
        // CEINTURES (p1a et p1b)
        if (this.currentParts.p1a === 0) { // Ceinture normale
            const belt = new PIXI.Graphics();
            belt.beginFill(0x8B4513);
            belt.drawRect(-bodySize * 0.8, 10, bodySize * 1.6, 10);
            belt.endFill();
            bruteContainer.addChild(belt);
        }
        
        if (this.currentParts.p1b === 0) { // Ceinture romaine
            const romanBelt = new PIXI.Graphics();
            romanBelt.beginFill(0xDAA520);
            romanBelt.drawRect(-bodySize * 0.8, 20, bodySize * 1.6, 15);
            romanBelt.endFill();
            bruteContainer.addChild(romanBelt);
        }
        
        // TÊTE
        const headSize = 45;
        const head = new PIXI.Graphics();
        head.beginFill(skinColor);
        head.drawCircle(0, -bodySize * 0.8, headSize);
        head.endFill();
        bruteContainer.addChild(head);
        
        // CHEVEUX (p3)
        if (this.currentParts.p3 < 12) { // Si pas "sans tête"
            const hairStyle = this.currentParts.p3;
            const hair = new PIXI.Graphics();
            hair.beginFill(hairColor);
            
            // Différents styles de cheveux selon la valeur
            switch(hairStyle) {
                case 4: // Chauve
                    // Pas de cheveux
                    break;
                case 3: // Iroquois
                    hair.drawRect(-5, -bodySize * 0.8 - headSize - 10, 10, 30);
                    break;
                case 5: // Afro
                    hair.drawCircle(0, -bodySize * 0.8, headSize + 10);
                    break;
                default:
                    hair.drawEllipse(0, -bodySize * 0.8 - 10, headSize * 0.8, headSize * 0.6);
            }
            
            hair.endFill();
            bruteContainer.addChild(hair);
        }
        
        // BARBE/MÈCHES (p4)
        if (this.currentGender === 'male' && this.currentParts.p4 < 5) {
            const beard = new PIXI.Graphics();
            beard.beginFill(hairColor);
            
            switch(this.currentParts.p4) {
                case 0: // Barbe 3 jours
                    beard.drawEllipse(0, -bodySize * 0.8 + 20, headSize * 0.4, 15);
                    break;
                case 1: // Bouc
                    beard.drawEllipse(0, -bodySize * 0.8 + 25, 10, 20);
                    break;
                case 2: // Barbe complète
                    beard.drawEllipse(0, -bodySize * 0.8 + 20, headSize * 0.6, 25);
                    break;
                case 3: // Moustache
                    beard.drawRect(-20, -bodySize * 0.8 + 10, 40, 5);
                    break;
            }
            
            beard.endFill();
            bruteContainer.addChild(beard);
        }
        
        // VÊTEMENTS PRINCIPAUX (p7)
        if (this.currentParts.p7 < 7) { // Si pas nu
            const clothing = new PIXI.Graphics();
            clothing.beginFill(clothingColor);
            
            switch(this.currentParts.p7) {
                case 0: // Armure légère
                    clothing.drawRect(-bodySize * 0.9, -bodySize * 0.4, bodySize * 1.8, bodySize * 0.8);
                    break;
                case 1: // Tunique
                    clothing.drawEllipse(0, 0, bodySize * 0.9, bodySize * 1.2);
                    break;
                case 2: // Armure lourde
                    clothing.lineStyle(2, 0x333333);
                    clothing.drawRect(-bodySize * 1, -bodySize * 0.5, bodySize * 2, bodySize);
                    break;
                default:
                    clothing.drawEllipse(0, 0, bodySize * 0.8, bodySize * 1.1);
            }
            
            clothing.endFill();
            bruteContainer.addChild(clothing);
        }
        
        // CHEMISE (p5)
        if (this.currentParts.p5 === 1) {
            const shirt = new PIXI.Graphics();
            const shirtColor = parseInt(getColor(this.currentGender, 'clothing', this.currentColors.col4).replace('#', ''), 16);
            shirt.beginFill(shirtColor);
            shirt.drawRect(-bodySize * 0.7, -bodySize * 0.3, bodySize * 1.4, bodySize * 0.6);
            shirt.endFill();
            bruteContainer.addChild(shirt);
        }
        
        // BAS (p6)
        if (this.currentGender === 'male') {
            const bottom = new PIXI.Graphics();
            bottom.beginFill(clothingColor);
            
            if (this.currentParts.p6 === 0) { // Shorts
                bottom.drawRect(-bodySize * 0.6, bodySize * 0.5, bodySize * 1.2, bodySize * 0.4);
            } else { // Pantalons
                bottom.drawRect(-bodySize * 0.6, bodySize * 0.5, bodySize * 1.2, bodySize * 0.8);
            }
            
            bottom.endFill();
            bruteContainer.addChild(bottom);
        }
        
        // YEUX
        const leftEye = new PIXI.Graphics();
        leftEye.beginFill(0x000000);
        leftEye.drawCircle(-headSize * 0.25, -bodySize * 0.8 - 5, 3);
        leftEye.endFill();
        bruteContainer.addChild(leftEye);
        
        const rightEye = new PIXI.Graphics();
        rightEye.beginFill(0x000000);
        rightEye.drawCircle(headSize * 0.25, -bodySize * 0.8 - 5, 3);
        rightEye.endFill();
        bruteContainer.addChild(rightEye);
        
        // INDICATION GENRE ET PARTIES ACTIVES
        const infoContainer = new PIXI.Container();
        infoContainer.y = bodySize + 60;
        
        // Genre
        const genderText = new PIXI.Text(this.currentGender === 'male' ? '♂ Homme' : '♀ Femme', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: this.currentGender === 'male' ? 0x4a90e2 : 0xe74c3c,
            fontWeight: 'bold'
        });
        genderText.anchor.set(0.5);
        infoContainer.addChild(genderText);
        
        // Parties actives
        const activeParts = Object.entries(this.currentParts)
            .filter(([part, value]) => value > 0 && part !== 'p1')
            .map(([part, value]) => {
                const partInfo = bodyPartsInfo[part];
                const variantDesc = getPartVariantDescription(part, value, this.currentGender);
                return `${partInfo.name}: ${variantDesc}`;
            });
        
        if (activeParts.length > 0) {
            const partsText = new PIXI.Text(activeParts.slice(0, 3).join('\n'), {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0x666666,
                align: 'center'
            });
            partsText.anchor.set(0.5, 0);
            partsText.y = 20;
            infoContainer.addChild(partsText);
        }
        
        bruteContainer.addChild(infoContainer);
        
        // Appliquer échelle et direction
        bruteContainer.scale.x = this.currentScale * this.currentDirection;
        bruteContainer.scale.y = this.currentScale;
        
        // Rendre le container interactif
        bruteContainer.interactive = true;
        bruteContainer.on('click', () => {
            this.showNotification('Cliquez sur une partie dans les contrôles pour la modifier !');
        });
        
        this.pixiApp.stage.addChild(bruteContainer);
        this.bruteSprite = bruteContainer;
    }

    highlightPartInPreview(partKey) {
        if (!this.bruteSprite) return;
        
        // Animation de highlight sur la partie sélectionnée
        const highlight = new PIXI.Graphics();
        highlight.lineStyle(3, 0xFFD700, 1);
        highlight.drawCircle(0, 0, 100);
        highlight.alpha = 0;
        
        this.bruteSprite.addChild(highlight);
        
        // Animation
        let alpha = 0;
        let direction = 1;
        const animate = () => {
            alpha += 0.05 * direction;
            if (alpha > 1 || alpha < 0) direction *= -1;
            highlight.alpha = alpha * 0.5;
        };
        
        const ticker = PIXI.Ticker.shared.add(animate);
        
        setTimeout(() => {
            ticker.destroy();
            highlight.destroy();
        }, 2000);
    }

    updateBrutePreview() {
        if (this.pixiApp && !this.loadingSpinner.style.display !== 'none') {
            this.createBruteSprite();
        }
    }

    showLoadingSpinner(show) {
        const overlay = document.querySelector('.canvas-overlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    zoomPreview(factor) {
        this.currentScale *= factor;
        this.currentScale = Math.max(0.5, Math.min(3, this.currentScale)); // Limiter le zoom
        
        if (this.bruteSprite) {
            this.bruteSprite.scale.x = this.currentScale * this.currentDirection;
            this.bruteSprite.scale.y = this.currentScale;
        }
        
        this.showNotification(`Zoom: ${Math.round(this.currentScale * 100)}%`);
    }

    flipPreview() {
        this.currentDirection *= -1;
        if (this.bruteSprite) {
            this.bruteSprite.scale.x = this.currentScale * this.currentDirection;
        }
        
        this.showNotification(`Direction: ${this.currentDirection > 0 ? 'Droite' : 'Gauche'}`);
    }

    switchTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Activer l'onglet sélectionné
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    openExportModal() {
        const { generateBodyString, generateColorString, bodyPartsInfo, getPartVariantDescription } = window.LabruteData;
        
        const bodyString = generateBodyString(this.currentParts);
        const colorString = generateColorString(this.currentColors);
        
        document.getElementById('exportGender').value = this.currentGender;
        document.getElementById('exportBody').value = bodyString;
        document.getElementById('exportColors').value = colorString;
        
        // Générer un résumé détaillé de la configuration
        const partsSummary = Object.entries(this.currentParts)
            .filter(([part, value]) => value > 0 || part === 'p1')
            .map(([part, value]) => {
                const partInfo = bodyPartsInfo[part];
                const variantDesc = getPartVariantDescription(part, value, this.currentGender);
                return `// ${partInfo.name} (${part}): ${variantDesc}`;
            }).join('\n');
        
        const jsCode = `// Configuration Brute LaBrute générée par Sprite Editor
// Genre: ${this.currentGender === 'male' ? 'Homme' : 'Femme'}
// Date: ${new Date().toLocaleString('fr-FR')}

// === CONFIGURATION DES PARTIES ===
${partsSummary}

// === CONFIGURATION FINALE ===
const bruteConfig = {
    gender: '${this.currentGender}',
    body: '${bodyString}',     // String hexadécimale des parties
    colors: '${colorString}'   // String décimale des couleurs
};

// === UTILISATION DANS LABRUTE ===
import BruteDisplay from '@/utils/BruteDisplay';

// Créer l'instance de la brute
const brute = new BruteDisplay(
    bruteConfig.gender,
    bruteConfig.colors,
    bruteConfig.body
);

// Ajouter au conteneur PIXI
app.stage.addChild(brute.container);

// === DÉTAILS TECHNIQUES ===
// Body Parts (hex): ${JSON.stringify(this.currentParts, null, 2).replace(/\n/g, '\n// ')}
// Color Values (decimal): ${JSON.stringify(this.currentColors, null, 2).replace(/\n/g, '\n// ')}
// Body String Breakdown: ${bodyString.split('').map((char, i) => `${window.LabruteData.bodyPartsOrder[i]}=${char}`).join(' ')}
// Color String Breakdown: ${colorString.match(/.{2}/g).map((val, i) => `${window.LabruteData.colorOrder[i]}=${val}`).join(' ')}`;

        document.getElementById('exportCode').value = jsCode;
        
        this.openModal('exportModal');
    }

    copyToClipboard(targetId) {
        const element = document.getElementById(targetId);
        const text = element.value || element.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copié dans le presse-papiers !');
        }).catch(() => {
            // Fallback pour navigateurs plus anciens
            element.select();
            document.execCommand('copy');
            this.showNotification('Copié dans le presse-papiers !');
        });
    }

    copyCurrentConfig() {
        const { generateBodyString, generateColorString, getPartVariantDescription, bodyPartsInfo } = window.LabruteData;
        
        const partsDetail = Object.entries(this.currentParts).map(([part, value]) => {
            const partInfo = bodyPartsInfo[part];
            const variantDesc = getPartVariantDescription(part, value, this.currentGender);
            return {
                part,
                name: partInfo.name,
                value,
                variant: variantDesc
            };
        });
        
        const config = {
            gender: this.currentGender,
            body: generateBodyString(this.currentParts),
            colors: generateColorString(this.currentColors),
            parts: this.currentParts,
            colorValues: this.currentColors,
            partsDetail,
            timestamp: new Date().toISOString()
        };
        
        const configText = JSON.stringify(config, null, 2);
        
        navigator.clipboard.writeText(configText).then(() => {
            this.showNotification('Configuration complète copiée avec détails !');
        });
    }

    showNotification(message, duration = 3000) {
        // Créer une notification améliorée
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new LaBruteSpriteEditor();
});

// Ajouter les animations CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

/* Styles pour les parties cliquables */
.part-header {
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.part-header:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateX(5px);
}

.part-header.selected {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-left: 4px solid #667eea;
}

.part-main-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
}

.part-variant-desc {
    color: #667eea;
    font-size: 0.9rem;
    margin-top: 0.25rem;
    font-style: italic;
}

.variants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.variant-preview {
    cursor: pointer;
    padding: 0.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s ease;
    background: white;
}

.variant-preview:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.variant-preview.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: #667eea;
}

.variant-number {
    font-weight: bold;
    font-size: 1.2rem;
}

.variant-mini-desc {
    font-size: 0.7rem;
    margin-top: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.color-group {
    margin-bottom: 2rem;
}

.color-group-title {
    color: #4a5568;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e2e8f0;
}

.color-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.color-label {
    flex: 1;
    font-weight: 500;
}

.color-key {
    color: #718096;
    font-size: 0.85rem;
    font-weight: normal;
}

.color-palette-mini {
    margin-top: 0.5rem;
}

.color-palette-row {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.color-mini {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
}

.color-mini:hover {
    transform: scale(1.2);
    border-color: #4a5568;
}

.color-mini.active {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.part-info-detailed {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    border-left: 4px solid #667eea;
}

.part-guide-title {
    cursor: pointer;
    color: #2d3748;
    margin-bottom: 0.75rem;
    transition: color 0.2s ease;
}

.part-guide-title:hover {
    color: #667eea;
}

.bug-badge {
    background: #fed7d7;
    color: #c53030;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.variants-list {
    margin-top: 1rem;
    background: white;
    padding: 1rem;
    border-radius: 8px;
}

.variants-list h5 {
    color: #4a5568;
    margin-bottom: 0.5rem;
}

.variants-list ul {
    list-style: none;
    padding: 0;
}

.variants-list li {
    padding: 0.25rem 0;
    color: #718096;
}

.color-guide {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.color-channels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
}

.color-channel-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: white;
    border-radius: 6px;
}

.channel-key {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    font-weight: 600;
}

.channel-desc {
    color: #4a5568;
    font-size: 0.9rem;
}

.color-indices {
    display: flex;
    gap: 0.25rem;
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

.male-index {
    background: #4299e1;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
}

.female-index {
    background: #ed64a6;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
}

.disabled-part {
    opacity: 0.7;
}

.disabled-part .part-header {
    cursor: not-allowed;
}

.no-variants {
    color: #a0aec0;
    font-style: italic;
    padding: 1rem;
    text-align: center;
}

.asset-id {
    font-size: 0.75rem;
    color: #718096;
    margin-top: 0.25rem;
}

.notification {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`;
document.head.appendChild(style); 