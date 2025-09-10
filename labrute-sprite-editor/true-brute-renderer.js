/**
 * 🎮 True Brute Renderer - Utilise le VRAI moteur de rendu du jeu
 * Ce fichier charge et affiche les vrais sprites de LaBrute
 */

// Import du vrai BruteDisplay depuis le client
import BruteDisplay from '../client/src/utils/BruteDisplay.js';

class TrueBruteRenderer {
    constructor() {
        this.container = null;
        this.bruteDisplay = null;
        this.currentGender = 'male';
        this.currentColors = '';
        this.currentParts = '';
        this.pixiApp = null;
    }

    /**
     * Initialise le renderer avec PIXI
     */
    async initialize(containerId) {
        console.log('🎮 Initialisation du True Brute Renderer...');

        // Créer l'application PIXI
        this.pixiApp = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0xf7fafc,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        // Ajouter au container
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(this.pixiApp.view);
        }

        // Charger les assets nécessaires
        await this.loadAssets();

        console.log('✅ True Brute Renderer initialisé');
    }

    /**
     * Charge les assets du jeu
     */
    async loadAssets() {
        console.log('📦 Chargement des assets...');

        // Le BruteDisplay charge automatiquement les SVGs depuis labrute-static-fla-parser
        // Mais on doit s'assurer que les chemins sont corrects

        // Pour l'instant, on va utiliser le système existant
        console.log('✅ Assets prêts');
    }

    /**
     * Affiche une brute avec les vrais sprites
     */
    async displayBrute(gender, colors, parts) {
        console.log('🎨 Affichage de la brute:', { gender, colors, parts });

        // Nettoyer l'affichage précédent
        if (this.bruteDisplay) {
            this.bruteDisplay.destroy();
            this.pixiApp.stage.removeChildren();
        }

        try {
            // Créer une nouvelle instance de BruteDisplay
            this.bruteDisplay = new BruteDisplay(
                gender,
                colors,
                parts,
                'left', // direction
                2 // scale
            );

            // Attendre que tout soit chargé
            await new Promise((resolve) => {
                this.bruteDisplay.onLoad(() => {
                    console.log('✅ Brute chargée');
                    resolve();
                });
            });

            // Positionner au centre
            this.bruteDisplay.container.x = this.pixiApp.view.width / 2;
            this.bruteDisplay.container.y = this.pixiApp.view.height / 2 + 100;

            // Ajouter au stage
            this.pixiApp.stage.addChild(this.bruteDisplay.container);

            // Sauvegarder les paramètres actuels
            this.currentGender = gender;
            this.currentColors = colors;
            this.currentParts = parts;

        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage de la brute:', error);
        }
    }

    /**
     * Met à jour la brute
     */
    async updateBrute(params) {
        const gender = params.gender || this.currentGender;
        const colors = params.colors || this.currentColors;
        const parts = params.parts || this.currentParts;

        await this.displayBrute(gender, colors, parts);
    }

    /**
     * Change la direction de la brute
     */
    flipDirection() {
        if (this.bruteDisplay) {
            this.bruteDisplay.container.scale.x *= -1;
        }
    }

    /**
     * Exporte la brute en image
     */
    async exportAsImage() {
        if (!this.pixiApp) return null;

        const renderTexture = PIXI.RenderTexture.create({
            width: this.pixiApp.view.width,
            height: this.pixiApp.view.height
        });

        this.pixiApp.renderer.render(this.pixiApp.stage, renderTexture);
        
        const canvas = this.pixiApp.renderer.extract.canvas(renderTexture);
        renderTexture.destroy();

        return canvas.toDataURL('image/png');
    }

    /**
     * Détruit le renderer
     */
    destroy() {
        if (this.bruteDisplay) {
            this.bruteDisplay.destroy();
        }
        if (this.pixiApp) {
            this.pixiApp.destroy(true);
        }
    }
}

// Export global
window.TrueBruteRenderer = TrueBruteRenderer;
