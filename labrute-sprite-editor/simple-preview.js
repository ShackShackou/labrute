// Prévisualisation simple sans PIXI.js
class SimplePreview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.sprites = new Map();
        this.mappings = {};
        
        // Utiliser le renderer avec parser si disponible
        this.bruteRenderer = window.BruteRendererWithParser ? new window.BruteRendererWithParser() : null;
        this.currentBruteData = null;
        
        this.init();
    }
    
    init() {
        // Créer un canvas simple
        this.canvas = document.createElement('canvas');
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.canvas.style.border = '1px solid #e2e8f0';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.backgroundColor = '#f7fafc';
        
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        // Dessiner un message initial
        this.drawPlaceholder();
    }
    
    drawPlaceholder() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Si on a le renderer avec parser, afficher une brute aléatoire
        if (this.bruteRenderer) {
            this.currentBruteData = this.bruteRenderer.createRandomBrute('male');
            this.bruteRenderer.drawBrute(this.ctx, this.currentBruteData, this.canvas.width / 2, this.canvas.height / 2, 2);
            
            this.ctx.fillStyle = '#667eea';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Brute générée avec le parser', this.canvas.width / 2, this.canvas.height - 30);
        } else {
            this.ctx.fillStyle = '#718096';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Glissez des sprites pour commencer', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    updatePreview(mappings, sprites) {
        this.mappings = mappings;
        this.sprites = sprites;
        this.render();
    }
    
    render() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Centre du canvas
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Si on a le renderer avec parser et des données de brute, l'utiliser
        if (this.bruteRenderer && this.currentBruteData) {
            // Dessiner la brute de base avec le parser
            this.bruteRenderer.drawBrute(this.ctx, this.currentBruteData, centerX, centerY, 2);
            
            // Superposer les sprites custom s'il y en a
            if (Object.keys(this.mappings).length > 0) {
                this.renderCustomSprites(centerX, centerY);
            }
            
            return;
        }
        
        // Positions des parties du corps
        const positions = {
            p3: { x: 0, y: -60 },    // Tête
            p4: { x: 0, y: -40 },    // Barbe/Accessoires
            p7: { x: 0, y: 0 },      // Vêtements principaux
            p2: { x: 0, y: 0 },      // Corps
            p5: { x: 0, y: 10 },     // Torse
            p1: { x: 0, y: 0 },      // Base
            p1a: { x: 0, y: 20 },    // Ceinture
            p1b: { x: 0, y: 30 },    // Ceinture basse
            p6: { x: 0, y: 40 },     // Jambes
            p7b: { x: 0, y: -10 },   // Vêtements secondaires
            p8: { x: 0, y: 50 }      // Pieds
        };
        
        // Si pas de renderer avec parser, utiliser l'ancien système
        this.renderCustomSprites(centerX, centerY);
    }
    
    renderCustomSprites(centerX, centerY) {
        // Ordre de rendu (du fond vers l'avant)
        const renderOrder = ['p8', 'p6', 'p1b', 'p1a', 'p1', 'p2', 'p5', 'p7', 'p7b', 'p4', 'p3'];
        
        // Positions des parties du corps
        const positions = {
            p3: { x: 0, y: -60 },    // Tête
            p4: { x: 0, y: -40 },    // Barbe/Accessoires
            p7: { x: 0, y: 0 },      // Vêtements principaux
            p2: { x: 0, y: 0 },      // Corps
            p5: { x: 0, y: 10 },     // Torse
            p1: { x: 0, y: 0 },      // Base
            p1a: { x: 0, y: 20 },    // Ceinture
            p1b: { x: 0, y: 30 },    // Ceinture basse
            p6: { x: 0, y: 40 },     // Jambes
            p7b: { x: 0, y: -10 },   // Vêtements secondaires
            p8: { x: 0, y: 50 }      // Pieds
        };
        
        // Dessiner chaque partie
        renderOrder.forEach(partKey => {
            const spriteId = this.mappings[partKey];
            if (spriteId && this.sprites.has(spriteId)) {
                const sprite = this.sprites.get(spriteId);
                const pos = positions[partKey] || { x: 0, y: 0 };
                
                if (sprite.image && sprite.image.complete) {
                    // Calculer l'échelle
                    const maxSize = 80;
                    const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
                    const width = sprite.width * scale;
                    const height = sprite.height * scale;
                    
                    // Dessiner l'image
                    this.ctx.drawImage(
                        sprite.image,
                        centerX + pos.x - width / 2,
                        centerY + pos.y - height / 2,
                        width,
                        height
                    );
                } else {
                    // Dessiner un placeholder
                    this.drawPartPlaceholder(centerX + pos.x, centerY + pos.y, partKey);
                }
            } else {
                // Dessiner un placeholder pour cette partie
                this.drawPartPlaceholder(centerX + positions[partKey].x, centerY + positions[partKey].y, partKey);
            }
        });
    }
    
    drawPartPlaceholder(x, y, partKey) {
        this.ctx.save();
        
        this.ctx.strokeStyle = '#cbd5e0';
        this.ctx.fillStyle = 'rgba(203, 213, 224, 0.2)';
        this.ctx.lineWidth = 2;
        
        // Dessiner différentes formes selon la partie
        switch(partKey) {
            case 'p3': // Tête
                this.ctx.beginPath();
                this.ctx.arc(x, y, 25, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;
            case 'p2': // Corps
            case 'p7': // Vêtements
                this.ctx.fillRect(x - 30, y - 30, 60, 60);
                this.ctx.strokeRect(x - 30, y - 30, 60, 60);
                break;
            default:
                this.ctx.fillRect(x - 20, y - 20, 40, 40);
                this.ctx.strokeRect(x - 20, y - 20, 40, 40);
        }
        
        // Ajouter le label
        this.ctx.fillStyle = '#718096';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(partKey, x, y);
        
        this.ctx.restore();
    }
}

// Export global
window.SimplePreview = SimplePreview;
