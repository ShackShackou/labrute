// Module de rendu des brutes utilisant le parser du jeu
class BruteRendererWithParser {
    constructor() {
        this.bodyParts = ['p1', 'p1a', 'p1b', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p7b', 'p8'];
        this.colorParts = ['col0', 'col0a', 'col0c', 'col1', 'col1a', 'col1b', 'col1c', 'col1d', 
                          'col2', 'col2a', 'col2b', 'col3', 'col3b', 'col4', 'col4a', 'col4b'];
        
        // Couleurs par défaut du jeu (extraites du code source)
        this.colors = {
            male: {
                skin: ['#996600', '#cc9900', '#ffcc00', '#cc9966', '#ffcc99', '#ffcccc', '#ff9999', '#ff9966'],
                hair: ['#000000', '#330000', '#660000', '#990000', '#663300', '#996633', '#cc9966', '#ffcc99', '#cccccc', '#999999', '#666666', '#333333'],
                clothing: ['#660000', '#990000', '#cc0000', '#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc', '#663300', '#996633', '#cc9966', '#ffcc99', '#996600', '#cc9900', '#ffcc00', '#ffff00', '#006600', '#009900', '#00cc00', '#00ff00', '#000066', '#000099', '#0000cc', '#0000ff', '#660066', '#990099', '#cc00cc', '#ff00ff', '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']
            },
            female: {
                skin: ['#996600', '#cc9900', '#ffcc00', '#cc9966', '#ffcc99', '#ffcccc', '#ff9999', '#ff9966'],
                hair: ['#000000', '#330000', '#660000', '#990000', '#663300', '#996633', '#cc9966', '#ffcc99', '#cccccc', '#999999', '#666666', '#333333'],
                clothing: ['#660000', '#990000', '#cc0000', '#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc', '#663300', '#996633', '#cc9966', '#ffcc99', '#996600', '#cc9900', '#ffcc00', '#ffff00', '#006600', '#009900', '#00cc00', '#00ff00', '#000066', '#000099', '#0000cc', '#0000ff', '#660066', '#990099', '#cc00cc', '#ff00ff', '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff']
            },
            special: {
                // Couleurs spéciales (99-0)
                99: '#ff0000', 98: '#00ff00', 97: '#0000ff', 96: '#ffff00', 95: '#ff00ff', 94: '#00ffff',
                93: '#ffffff', 92: '#000000', 91: '#666666', 90: '#999999'
            }
        };
    }

    // Parser le body string (comme dans parsers.ts)
    readBodyString(bodyString) {
        return {
            p1: parseInt(bodyString[0] || '0', 16),
            p1a: parseInt(bodyString[1] || '0', 16),
            p1b: parseInt(bodyString[2] || '0', 16),
            p2: parseInt(bodyString[3] || '0', 16),
            p3: parseInt(bodyString[4] || '0', 16),
            p4: parseInt(bodyString[5] || '0', 16),
            p5: parseInt(bodyString[6] || '0', 16),
            p6: parseInt(bodyString[7] || '0', 16),
            p7: parseInt(bodyString[8] || '0', 16),
            p7b: parseInt(bodyString[9] || '0', 16),
            p8: parseInt(bodyString[10] || '0', 16)
        };
    }

    // Générer un body string
    generateBodyString(body) {
        return [
            body.p1.toString(16),
            body.p1a.toString(16),
            body.p1b.toString(16),
            body.p2.toString(16),
            body.p3.toString(16),
            body.p4.toString(16),
            body.p5.toString(16),
            body.p6.toString(16),
            body.p7.toString(16),
            body.p7b.toString(16),
            body.p8.toString(16)
        ].join('');
    }

    // Obtenir une couleur
    getColor(gender, part, colorIndex) {
        const skinParts = ['col0', 'col0a', 'col0c'];
        const hairParts = ['col1', 'col1a', 'col1b', 'col1c', 'col1d'];
        const clothingParts = ['col2', 'col2a', 'col2b', 'col3', 'col3b', 'col4', 'col4a', 'col4b'];
        
        let colorArray = [];
        
        if (skinParts.includes(part)) colorArray = this.colors[gender].skin;
        else if (hairParts.includes(part)) colorArray = this.colors[gender].hair;
        else if (clothingParts.includes(part)) colorArray = this.colors[gender].clothing;
        
        const normalColor = colorArray[colorIndex];
        if (normalColor) return normalColor;
        
        return this.colors.special[99 - colorIndex] || '#ffffff';
    }

    // Parser le color string
    readColorString(gender, colorsString) {
        const result = {};
        const parts = ['col0', 'col0a', 'col0c', 'col1', 'col1a', 'col1b', 'col1c', 'col1d',
                      'col2', 'col2a', 'col2b', 'col3', 'col3b', 'col4', 'col4a', 'col4b'];
        
        parts.forEach((part, index) => {
            const colorIndex = parseInt(colorsString.slice(index * 2, index * 2 + 2) || '0');
            result[part] = this.getColor(gender, part, colorIndex);
        });
        
        return result;
    }

    // Générer un color string
    generateColorString(colorObject) {
        return Object.values(colorObject).map(val => 
            val.toString().padStart(2, '0')
        ).join('');
    }

    // Créer une brute aléatoire
    createRandomBrute(gender = 'male') {
        const body = {};
        const colors = {};
        
        // Générer des parties du corps aléatoires
        this.bodyParts.forEach(part => {
            body[part] = Math.floor(Math.random() * 8); // 0-7 pour chaque partie
        });
        
        // Générer des couleurs aléatoires
        this.colorParts.forEach(part => {
            const isSkin = ['col0', 'col0a', 'col0c'].includes(part);
            const isHair = ['col1', 'col1a', 'col1b', 'col1c', 'col1d'].includes(part);
            
            if (isSkin) {
                colors[part] = Math.floor(Math.random() * this.colors[gender].skin.length);
            } else if (isHair) {
                colors[part] = Math.floor(Math.random() * this.colors[gender].hair.length);
            } else {
                colors[part] = Math.floor(Math.random() * this.colors[gender].clothing.length);
            }
        });
        
        return {
            gender,
            body: this.generateBodyString(body),
            colors: this.generateColorString(colors)
        };
    }

    // Dessiner une brute sur un canvas
    drawBrute(ctx, bruteData, x, y, scale = 1) {
        const body = this.readBodyString(bruteData.body);
        const colors = this.readColorString(bruteData.gender, bruteData.colors);
        
        // Position de base
        const baseX = x;
        const baseY = y;
        
        // Dessiner chaque partie du corps
        this.drawBody(ctx, body, colors, baseX, baseY, scale, bruteData.gender);
    }

    drawBody(ctx, body, colors, x, y, scale, gender) {
        // Dimensions de base d'une brute
        const baseWidth = 60 * scale;
        const baseHeight = 80 * scale;
        
        // Dessiner le corps principal (torse)
        ctx.fillStyle = colors.col0 || '#ffcc99';
        ctx.fillRect(x - baseWidth/2, y - baseHeight/2, baseWidth, baseHeight * 0.5);
        
        // Dessiner la tête
        const headSize = baseWidth * 0.6;
        ctx.fillStyle = colors.col0 || '#ffcc99';
        ctx.beginPath();
        ctx.arc(x, y - baseHeight/2 - headSize/2, headSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dessiner les cheveux (selon p1)
        if (body.p1 > 0) {
            ctx.fillStyle = colors.col1 || '#663300';
            ctx.beginPath();
            ctx.arc(x, y - baseHeight/2 - headSize/2 - 5*scale, headSize/2 + 5*scale, Math.PI, 0, false);
            ctx.fill();
        }
        
        // Dessiner les bras
        ctx.fillStyle = colors.col0a || colors.col0 || '#ffcc99';
        // Bras gauche
        ctx.fillRect(x - baseWidth/2 - 10*scale, y - baseHeight/3, 10*scale, baseHeight * 0.4);
        // Bras droit
        ctx.fillRect(x + baseWidth/2, y - baseHeight/3, 10*scale, baseHeight * 0.4);
        
        // Dessiner les jambes
        ctx.fillStyle = colors.col3 || '#000066';
        // Jambe gauche
        ctx.fillRect(x - baseWidth/4, y, baseWidth/3, baseHeight * 0.5);
        // Jambe droite
        ctx.fillRect(x + baseWidth/4 - baseWidth/3, y, baseWidth/3, baseHeight * 0.5);
        
        // Dessiner les vêtements (t-shirt)
        if (body.p4 > 0) {
            ctx.fillStyle = colors.col2 || '#cc0000';
            ctx.fillRect(x - baseWidth/2, y - baseHeight/2, baseWidth, baseHeight * 0.4);
        }
        
        // Dessiner les accessoires selon les parties du corps
        this.drawAccessories(ctx, body, colors, x, y, scale, gender);
    }

    drawAccessories(ctx, body, colors, x, y, scale, gender) {
        const baseWidth = 60 * scale;
        const baseHeight = 80 * scale;
        
        // Dessiner des accessoires selon les valeurs des parties
        
        // Casque/Chapeau (p2)
        if (body.p2 > 3) {
            ctx.fillStyle = colors.col4 || '#666666';
            ctx.fillRect(x - baseWidth/3, y - baseHeight/2 - 30*scale, baseWidth*0.66, 10*scale);
        }
        
        // Armure (p5)
        if (body.p5 > 3) {
            ctx.strokeStyle = colors.col4a || '#999999';
            ctx.lineWidth = 3 * scale;
            ctx.strokeRect(x - baseWidth/2 + 5*scale, y - baseHeight/2 + 5*scale, baseWidth - 10*scale, baseHeight * 0.35);
        }
        
        // Bottes (p7)
        if (body.p7 > 3) {
            ctx.fillStyle = colors.col4b || '#333333';
            ctx.fillRect(x - baseWidth/4 - 2*scale, y + baseHeight * 0.4, baseWidth/3 + 4*scale, baseHeight * 0.1);
            ctx.fillRect(x + baseWidth/4 - baseWidth/3 - 2*scale, y + baseHeight * 0.4, baseWidth/3 + 4*scale, baseHeight * 0.1);
        }
    }

    // Créer une prévisualisation de brute
    createBrutePreview(bruteData, width = 200, height = 250) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Fond
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Dessiner la brute
        this.drawBrute(ctx, bruteData, width/2, height/2, 1.5);
        
        return canvas;
    }

    // Analyser une brute existante
    analyzeBrute(bodyString, colorsString, gender = 'male') {
        const body = this.readBodyString(bodyString);
        const colors = this.readColorString(gender, colorsString);
        
        const analysis = {
            gender,
            bodyParts: body,
            colors: colors,
            features: []
        };
        
        // Analyser les caractéristiques
        if (body.p1 > 0) analysis.features.push('Cheveux');
        if (body.p2 > 3) analysis.features.push('Casque/Chapeau');
        if (body.p4 > 0) analysis.features.push('T-shirt');
        if (body.p5 > 3) analysis.features.push('Armure');
        if (body.p7 > 3) analysis.features.push('Bottes');
        
        return analysis;
    }
}

// Export pour utilisation
window.BruteRendererWithParser = BruteRendererWithParser;
