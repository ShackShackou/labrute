import Phaser from 'phaser';
import { LaBruteAdapter } from '../engine/LaBruteAdapter.js';

/**
 * Scène de combat intégrée avec LaBrute
 * Utilise les vraies données de combat LaBrute avec ton moteur Phaser+Spine
 */
export class LaBruteFightScene extends Phaser.Scene {
  constructor() { 
    super({ key: 'LaBruteFight' }); 
    this.laBruteAdapter = new LaBruteAdapter();
    this.currentAction = null;
    this.isPlaying = true;
    this.fightSpeed = 1;
    // Nouveaux états pour fiabiliser la boucle
    this.fightLoaded = false;
    this.isProcessingStep = false;
    this.stepTimer = null;
  }

  preload() {
    // Charger les assets Spine
    this.load.spineJson('spineboy-data', 'assets/spine/spineboy-pro.json');
    this.load.spineAtlas('spineboy-atlas', 'assets/spine/spineboy.atlas');
    
    // Charger le background LaBrute
    // this.load.image('labrute-bg', 'assets/backgrounds/arena.jpg');
  }

  create() {
    console.log('🎮 LaBruteFightScene: Création de la scène');
    
    // Configuration de la caméra
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0, 0, 1024, 768);

    // Background LaBrute
    if (this.textures.exists('labrute-bg')) {
      const bg = this.add.image(512, 384, 'labrute-bg');
      bg.setDepth(-10);
    }

    // Zone de combat
    this.setupCombatZone();

    // UI de base
    this.createUI();

    // Écouter les messages de LaBrute
    this.setupMessageListener();

    // État initial
    this.fighters = [];
    this.combatActive = false;
    
    console.log('✅ LaBruteFightScene prête');
  }

  /**
   * Configure la zone de combat
   */
  setupCombatZone() {
    this.combatZone = {
      leftMinX: 200,
      leftMaxX: 400,
      rightMinX: 624,
      rightMaxX: 824,
      minY: 200,
      maxY: 568
    };
  }

  /**
   * Crée l'interface utilisateur
   */
  createUI() {
    // Contrôles de combat
    this.createCombatControls();
    
    // Informations de combat
    this.createCombatInfo();
    
    // Logs de combat
    this.createCombatLogs();
  }

  /**
   * Crée les contrôles de combat (comme LaBrute officiel)
   */
  createCombatControls() {
    const controlsBg = this.add.rectangle(100, 700, 300, 60, 0xffffff, 0.3);
    controlsBg.setDepth(100);

    // Bouton Play/Pause
    this.playButton = this.add.text(50, 680, '▶️', { fontSize: '24px' });
    this.playButton.setInteractive();
    this.playButton.on('pointerdown', () => this.togglePlay());

    // Bouton Vitesse
    this.speedButton = this.add.text(100, 680, 'x1', { fontSize: '24px' });
    this.speedButton.setInteractive();
    this.speedButton.on('pointerdown', () => this.toggleSpeed());

    // Bouton Son
    this.soundButton = this.add.text(150, 680, '🔊', { fontSize: '24px' });
    this.soundButton.setInteractive();
    this.soundButton.on('pointerdown', () => this.toggleSound());

    // Bouton Musique
    this.musicButton = this.add.text(200, 680, '🎵', { fontSize: '24px' });
    this.musicButton.setInteractive();
    this.musicButton.on('pointerdown', () => this.toggleMusic());
  }

  /**
   * Crée l'affichage des informations de combat
   */
  createCombatInfo() {
    this.combatInfo = this.add.text(800, 50, 'Combat LaBrute', { 
      fontSize: '18px', 
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.combatInfo.setDepth(100);
  }

  /**
   * Crée l'affichage des logs de combat
   */
  createCombatLogs() {
    this.combatLogs = this.add.text(50, 50, '', { 
      fontSize: '14px', 
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      wordWrap: { width: 300 }
    });
    this.combatLogs.setDepth(100);
  }

  /**
   * Configure l'écouteur de messages depuis LaBrute
   */
  setupMessageListener() {
    // Écouter les messages postMessage depuis LaBrute
    window.addEventListener('message', (event) => {
      console.log('LaBruteFightScene: Message reçu:', event.data);
      
      // Accepter les messages quelle que soit l'origine
      const payload = event && event.data && typeof event.data === 'object' ? event.data : null;
      if (!payload || !payload.type) return;

      const { type, data } = payload;
      
      switch (type) {
        case 'LOAD_FIGHT_STEPS':
          console.log('📥 Reçu données de combat LaBrute:', data);
          // Si les données sont dans payload.data (structure de FightView)
          if (payload.data && typeof payload.data === 'object') {
            this.loadLaBruteFight(payload.data);
          } 
          // Si les données sont directement dans data (structure d'embed.html)
          else if (data && typeof data === 'object') {
            this.loadLaBruteFight(data);
          }
          break;
        case 'PLAY_FIGHT':
          console.log('▶️ Démarrage du combat');
          this.startFight();
          break;
        case 'PAUSE_FIGHT':
          console.log('⏸️ Pause du combat');
          this.pauseFight();
          break;
        case 'SET_SPEED':
          console.log(`⚡ Vitesse: x${data?.speed || 1}`);
          this.setFightSpeed(data?.speed || 1);
          break;
      }
    });

    // Envoyer un message READY à LaBrute
    console.log('Envoi du message READY au parent');
    window.parent.postMessage({ type: 'READY' }, '*');
    
    // Aussi envoyer à la fenêtre courante (pour embed.html)
    window.postMessage({ type: 'READY' }, '*');
  }

  /**
   * Charge les données de combat LaBrute
   * @param {Object} fightData - Données de combat depuis LaBrute
   */
  loadLaBruteFight(fightData) {
    console.log('🔗 Chargement combat LaBrute:', fightData);
    
    // Reset boucle si nécessaire
    if (this.stepTimer) { try { this.stepTimer.remove(false); } catch (e) {} }
    this.isProcessingStep = false;
    this.isPlaying = false;
    this.combatActive = false;

    // Détruire d'anciens fighters
    if (this.fighters && this.fighters.length) {
      this.fighters.forEach(f => {
        try { f.sprite.destroy(); } catch(e) {}
        try { f.shadow?.destroy(); } catch(e) {}
        if (f.ui) {
          try { f.ui.healthBar.destroy(); } catch(e) {}
          try { f.ui.healthBarBg.destroy(); } catch(e) {}
          try { f.ui.statsText.destroy(); } catch(e) {}
        }
      });
    }

    // Charger les données dans l'adaptateur
    this.laBruteAdapter.loadLaBruteFight(fightData);
    
    // Créer les combattants
    this.createFighters();
    
    // Mettre à jour l'UI
    this.updateCombatInfo();
    
    this.fightLoaded = true;
    this.appendCombatLog('📥 Données de combat chargées');
    
    // Démarrer automatiquement le combat après un court délai
    this.time.delayedCall(1500, () => {
      console.log('⏱️ Démarrage automatique après délai');
      this.startFight();
    });
  }

  /**
   * Crée les combattants basés sur les données LaBrute
   */
  createFighters() {
    const transformedFighters = this.laBruteAdapter.getTransformedFighters();
    
    if (!transformedFighters) {
      console.error('❌ Impossible de créer les combattants');
      return;
    }

    console.log('Création des combattants avec données:', transformedFighters);
    this.fighters = [];
    
    // Force la position: Premier combattant à gauche, deuxième à droite
    const positions = [
      { 
        x: (this.combatZone.leftMinX + this.combatZone.leftMaxX) / 2,
        y: (this.combatZone.minY + this.combatZone.maxY) / 2 - 30,
        side: 'left'
      },
      {
        x: (this.combatZone.rightMinX + this.combatZone.rightMaxX) / 2,
        y: (this.combatZone.minY + this.combatZone.maxY) / 2 + 30,
        side: 'right'
      }
    ];
    
    transformedFighters.forEach((fighterData, index) => {
      // Forcer les positions pour chaque fighter
      const pos = positions[Math.min(index, 1)]; // 0 ou 1
      const baseX = pos.x;
      const baseY = pos.y;
      
      // Force le side aussi
      fighterData.side = pos.side;
      
      console.log(`Fighter ${index} - ID: ${fighterData.id}, Name: ${fighterData.name}, Position: ${pos.side}, X: ${baseX}, Y: ${baseY}`);
      
      const sprite = this.add.spine(baseX, baseY, 'spineboy-data', 'spineboy-atlas');
      const scale = (fighterData.baseScale || 0.3) * this.getFighterScale(baseY);
      
      // Direction: gauche regarde à droite, droite regarde à gauche
      sprite.setScale(pos.side === 'left' ? scale : -scale, scale);
      
      this.setSpineAnim(sprite, 'idle', true);
      
      const shadow = this.add.ellipse(
        baseX, 
        baseY + this.getShadowOffset(baseY), 
        100 * this.getFighterScale(baseY), 
        25 * this.getFighterScale(baseY), 
        0x000000, 
        0.35
      );
      
      const fighter = {
        ...fighterData,
        sprite,
        shadow,
        baseX,
        baseY,
        currentX: baseX,
        currentY: baseY
      };
      
      this.fighters.push(fighter);
      this.displayFighterStats(fighter, index);
    });

    // Ordre d'affichage (Z)
    this.fighters.forEach((f, i) => { f.sprite.setDepth(10 + i); f.shadow.setDepth(5 + i); });

    console.log(`✅ ${this.fighters.length} combattants créés`);
  }

  /**
   * Affiche les stats d'un combattant
   */
  displayFighterStats(fighter, index) {
    const x = index === 0 ? 50 : 800;
    const y = 100;
    
    // Barre de vie
    const healthBar = this.add.rectangle(x, y, 150, 20, 0x00ff00);
    const healthBarBg = this.add.rectangle(x, y, 150, 20, 0x333333);
    healthBarBg.setDepth(90);
    healthBar.setDepth(91);
    
    // Texte des stats
    const statsText = this.add.text(x, y + 30, 
      `${fighter.stats.name}\nHP: ${fighter.stats.health}/${fighter.stats.maxHealth}\nForce: ${fighter.stats.strength}`, 
      { fontSize: '14px', fill: '#ffffff' }
    );
    statsText.setDepth(100);
    
    fighter.ui = { healthBar, healthBarBg, statsText };
  }

  /**
   * Démarre le combat
   */
  startFight() {
    console.log('🚀 LaBruteFightScene.startFight() appelé');
    
    if (!this.fightLoaded) {
      this.appendCombatLog('⏳ Veuillez charger un combat avant de démarrer');
      console.log('❌ Combat non chargé, impossible de démarrer');
      return;
    }
    
    if (this.isPlaying) {
      console.log('ℹ️ Combat déjà en cours, ignoré');
      return;
    }

    this.combatActive = true;
    this.isPlaying = true;
    console.log('✅ Combat démarré, isPlaying=true, combatActive=true');

    // Démarrer la boucle si rien en cours
    if (!this.isProcessingStep) {
      console.log('▶️ Exécution de la première étape');
      this.executeNextStep();
    } else {
      console.log('⏳ Une étape est déjà en cours de traitement');
    }
  }

  /**
   * Met en pause le combat
   */
  pauseFight() {
    this.isPlaying = false;
    if (this.stepTimer) { try { this.stepTimer.remove(false); } catch (e) {} }
    this.appendCombatLog('⏸️ Combat en pause');
  }

  /**
   * Change la vitesse du combat
   */
  setFightSpeed(speed) {
    this.fightSpeed = speed;
    this.appendCombatLog(`⚡ Vitesse: x${speed}`);
  }

  // Helper vitesse
  getDelay(ms) {
    const factor = this.fightSpeed && this.fightSpeed > 0 ? this.fightSpeed : 1;
    return Math.max(50, Math.round(ms / factor));
  }

  async executeNextStep() {
    console.log('⏭️ executeNextStep appelé');
    
    // Vérification des prérequis
    if (!this.combatActive || !this.isPlaying) {
      console.log('❌ Combat inactif ou en pause', {combatActive: this.combatActive, isPlaying: this.isPlaying});
      return;
    }
    
    if (this.isProcessingStep) {
      console.log('⏱️ Une étape est déjà en cours de traitement, attente...');
      return;
    }

    // Récupération de l'action suivante
    console.log('🔍 Récupération de l\'action suivante...');
    const action = this.laBruteAdapter.getNextStep();

    if (!action) {
      console.log('🏁 Plus d\'actions à exécuter, fin du combat');
      this.endCombat();
      return;
    }

    console.log('✅ Action récupérée:', action);
    this.isProcessingStep = true;
    this.updateCombatInfo(); // Mise à jour de l'UI avec la progression
    
    try {
      console.log('⚙️ Exécution de l\'action', action.actionType);
      await this.executeAction(action);
      console.log('✅ Action terminée');
    } catch (e) {
      console.error('❌ Erreur lors de l\'exécution de l\'action:', e);
    } finally {
      this.isProcessingStep = false;
    }

    // Si le combat est toujours en cours, passer à l'étape suivante
    if (this.isPlaying) {
      console.log('▶️ Passage à l\'étape suivante');
      // Enchaîner immédiatement la prochaine étape
      this.executeNextStep();
    } else {
      console.log('⏸️ Combat en pause, pas d\'étape suivante');
    }
  }

  // Exécute une action et résout quand les tweens/anim sont terminés
  executeAction(action) {
    console.log(`🎬 Exécution action: ${action.actionType}`, action);
    this.appendCombatLog(`${action.actionType} - ${action.fighterId || action.attacker || action.fighter || '?'}`);
    
    switch (action.actionType) {
      case 'move':
        return this.executeMove(action);
      case 'moveBack':
        return this.executeMoveBack(action);
      case 'attack':
        return this.executeAttack(action);
      case 'block':
        return this.executeBlock(action);
      case 'evade':
        return this.executeEvade(action);
      case 'death':
        return this.executeDeath(action);
      case 'end':
        return this.executeEnd(action);
      default:
        console.warn(`⚠️ Action non implémentée: ${action.actionType}`, action);
        this.appendCombatLog(`⚠️ Action non implémentée: ${action.actionType}`);
        return new Promise((resolve) => this.time.delayedCall(this.getDelay(150), resolve));
    }
  }

  executeMove(action) {
    const fighter = this.fighters.find(f => f.id === action.fighterId);
    if (!fighter) return new Promise((resolve) => this.time.delayedCall(this.getDelay(50), resolve));

    // Stop previous tweens to avoid overlap/lag
    this.tweens.killTweensOf([fighter.sprite, fighter.shadow]);

    this.playRun(fighter.sprite);

    // Si Move cible un adversaire en mêlée, on tend vers lui; sinon, avance fixe
    let destX = fighter.currentX + 50;
    if (action.targetId) {
      const target = this.fighters.find(f => f.id === action.targetId);
      if (target) {
        destX = target.currentX + (fighter.side === 'left' ? -40 : 40);
      }
    }
    destX = this.clampXForFighter(fighter, destX);

    const duration = this.computeDurationForDistance(destX - fighter.currentX, 1100);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: [fighter.sprite, fighter.shadow],
        x: destX,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this.setSpineAnim(fighter.sprite, 'idle', true);
          fighter.currentX = fighter.sprite.x;
          resolve();
        }
      });
    });
  }

  executeMoveBack(action) {
    const fighter = this.fighters.find(f => f.id === action.fighterId || f.id === action.fighter);
    if (!fighter) return new Promise((resolve) => this.time.delayedCall(this.getDelay(50), resolve));

    // Stop previous tweens to avoid overlap/lag
    this.tweens.killTweensOf([fighter.sprite, fighter.shadow]);

    this.playRun(fighter.sprite);

    const destX = this.clampXForFighter(fighter, fighter.baseX);
    const duration = this.computeDurationForDistance(destX - fighter.currentX, 1100);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: [fighter.sprite, fighter.shadow],
        x: destX,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this.setSpineAnim(fighter.sprite, 'idle', true);
          fighter.currentX = fighter.sprite.x;
          resolve();
        }
      });
    });
  }

  executeAttack(action) {
    const attacker = this.fighters.find(f => f.id === action.attacker);
    const target = this.fighters.find(f => f.id === action.target);
    if (!attacker || !target) return new Promise((resolve) => this.time.delayedCall(this.getDelay(50), resolve));

    return new Promise((resolve) => {
      // Approche rapide
      this.tweens.killTweensOf([attacker.sprite, attacker.shadow]);
      this.playRun(attacker.sprite);
      const approachX = target.currentX + (attacker.side === 'left' ? 30 : -30);
      const duration = this.computeDurationForDistance(approachX - attacker.currentX, 1100);
      this.tweens.add({
        targets: [attacker.sprite, attacker.shadow],
        x: approachX,
        duration,
        ease: 'Power2',
        onComplete: () => {
          // Coup
          this.setSpineAnim(attacker.sprite, 'attack', false);

          if (target.stats.health > 0) {
            target.stats.health = Math.max(0, target.stats.health - (action.damage || 0));
            this.updateFighterStats(target);
            this.tweens.add({ targets: target.sprite, alpha: 0.7, duration: this.getDelay(70), yoyo: true });
          }

          // Retour
          const backDuration = this.computeDurationForDistance(attacker.currentX - attacker.sprite.x, 1100);
          this.tweens.add({
            targets: [attacker.sprite, attacker.shadow],
            x: attacker.currentX,
            duration: backDuration,
            ease: 'Power2',
            onComplete: () => {
              this.setSpineAnim(attacker.sprite, 'idle', true);
              resolve();
            }
          });
        }
      });
    });
  }

  executeBlock(action) {
    const fighter = this.fighters.find(f => f.id === action.fighter);
    if (!fighter) return new Promise((resolve) => this.time.delayedCall(this.getDelay(50), resolve));

    return new Promise((resolve) => {
      this.tweens.add({
        targets: fighter.sprite,
        scaleY: Math.abs(fighter.sprite.scaleY) * 0.9,
        duration: this.getDelay(120),
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: resolve
      });
    });
  }

  executeEvade(action) {
    const fighter = this.fighters.find(f => f.id === action.fighter);
    if (!fighter) return new Promise((resolve) => this.time.delayedCall(this.getDelay(50), resolve));

    const direction = fighter.side === 'left' ? -24 : 24;
    this.tweens.killTweensOf([fighter.sprite, fighter.shadow]);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: [fighter.sprite, fighter.shadow],
        x: this.clampXForFighter(fighter, fighter.currentX + direction),
        duration: this.getDelay(90),
        yoyo: true,
        ease: 'Power2',
        onComplete: () => { resolve(); }
      });
    });
  }

  executeDeath(action) {
    const fighter = this.fighters.find(f => f.id === action.fighter);
    if (!fighter) return new Promise((resolve) => this.time.delayedCall(this.getDelay(50), resolve));

    // Forcer les PV à 0 pour correspondre à l'état de mort
    fighter.stats.health = 0;
    this.updateFighterStats(fighter);

    // Ne pas disparaitre: garder visible, teinter et immobiliser
    return new Promise((resolve) => {
      this.tweens.killTweensOf([fighter.sprite, fighter.shadow]);
      // SpineGameObject n'a pas toujours setTint; utiliser alpha pour marquer la mort
      if (typeof fighter.sprite.setAlpha === 'function') {
        fighter.sprite.setAlpha(0.8);
      } else {
        fighter.sprite.alpha = 0.8;
      }
      this.tweens.add({
        targets: fighter.sprite,
        scaleY: Math.abs(fighter.sprite.scaleY) * 0.8,
        duration: this.getDelay(220),
        ease: 'Power2',
        onComplete: () => {
          // Freeze pose morte
          try { this.setSpineAnim(fighter.sprite, 'death', false); } catch(e) { this.setSpineAnim(fighter.sprite, 'idle', false); }
          resolve();
        }
      });
    });
  }

  executeEnd(_action) {
    return new Promise((resolve) => this.time.delayedCall(this.getDelay(150), resolve));
  }

  endCombat() {
    this.combatActive = false;
    this.isPlaying = false;
    if (this.stepTimer) { try { this.stepTimer.remove(false); } catch (e) {} }
    
    const winner = this.fighters.find(f => f.id === this.laBruteAdapter.laBruteData?.winner);
    if (winner) {
      this.appendCombatLog(`🏆 ${winner.stats.name} gagne le combat !`);
    }
    
    window.parent.postMessage({ 
      type: 'FIGHT_ENDED', 
      data: { winner: this.laBruteAdapter.laBruteData?.winner }
    }, '*');
  }

  /**
   * Met à jour les stats d'un combattant
   */
  updateFighterStats(fighter) {
    if (!fighter.ui) return;
    
    // Mettre à jour la barre de vie
    const healthPercent = fighter.stats.health / fighter.stats.maxHealth;
    fighter.ui.healthBar.width = 150 * healthPercent;
    
    // Changer la couleur selon la vie
    if (healthPercent > 0.5) {
      fighter.ui.healthBar.fillColor = 0x00ff00;
    } else if (healthPercent > 0.25) {
      fighter.ui.healthBar.fillColor = 0xffff00;
    } else {
      fighter.ui.healthBar.fillColor = 0xff0000;
    }
    
    // Mettre à jour le texte
    fighter.ui.statsText.setText(
      `${fighter.stats.name}\nHP: ${fighter.stats.health}/${fighter.stats.maxHealth}\nForce: ${fighter.stats.strength}`
    );
  }

  /**
   * Met à jour les informations de combat
   */
  updateCombatInfo() {
    const info = this.laBruteAdapter.getCombatInfo();
    this.combatInfo.setText(
      `Combat LaBrute\nID: ${info.fightId}\nÉtapes: ${info.currentStep}/${info.totalSteps}`
    );
  }

  /**
   * Ajoute un message aux logs
   */
  appendCombatLog(message) {
    const currentLogs = this.combatLogs.text;
    const newLogs = currentLogs + '\n' + message;
    
    // Garder seulement les 10 derniers logs
    const lines = newLogs.split('\n');
    if (lines.length > 10) {
      lines.splice(0, lines.length - 10);
    }
    
    this.combatLogs.setText(lines.join('\n'));
  }

  // Méthodes utilitaires
  setSpineAnim(spineObj, name, loop = false) {
    try { 
      spineObj.animationState.setAnimation(0, name, loop); 
    } catch(e) {
      // fallback ignored
    }
  }

  playRun(spineObj) {
    // Prefer 'run' if available, else 'walk'
    try { this.setSpineAnim(spineObj, 'run', true); }
    catch { this.setSpineAnim(spineObj, 'walk', true); }
  }

  getFighterScale(y) {
    return 1 - (y - 384) / 768 * 0.3;
  }

  getShadowOffset(y) {
    return 20 + (y - 384) / 768 * 10;
  }

  getShadowScale(y) {
    return 1 - (y - 384) / 768 * 0.2;
  }

  // --- Animation helpers ---
  setSpineAnim(spineObj, name, loop = false) {
    try { 
      spineObj.animationState.setAnimation(0, name, loop); 
    } catch(e) {
      // fallback ignored
    }
  }

  playRun(spineObj) {
    // Prefer 'run' if available, else 'walk'
    try { this.setSpineAnim(spineObj, 'run', true); }
    catch { this.setSpineAnim(spineObj, 'walk', true); }
  }

  // --- Motion helpers ---
  clampXForFighter(fighter, desiredX) {
    if (!this.combatZone) return desiredX;
    if (fighter.side === 'left') {
      return Phaser.Math.Clamp(desiredX, this.combatZone.leftMinX, this.combatZone.leftMaxX);
    }
    return Phaser.Math.Clamp(desiredX, this.combatZone.rightMinX, this.combatZone.rightMaxX);
  }

  computeDurationForDistance(distancePx, pxPerSecond = 900) {
    // Base speed ~900 px/s like original, scaled by fightSpeed
    const seconds = Math.max(0.05, Math.abs(distancePx) / Math.max(100, pxPerSecond));
    return this.getDelay(seconds * 1000);
  }

  // Contrôles UI
  togglePlay() {
    if (this.isPlaying) {
      this.pauseFight();
      this.playButton.setText('▶️');
    } else {
      this.startFight();
      this.playButton.setText('⏸️');
    }
  }

  toggleSpeed() {
    this.setFightSpeed(this.fightSpeed === 1 ? 2 : 1);
    this.speedButton.setText(`x${this.fightSpeed}`);
  }

  toggleSound() {
    // TODO: Implémenter le son
    console.log('🔊 Son toggle');
  }

  toggleMusic() {
    // TODO: Implémenter la musique
    console.log('🎵 Musique toggle');
  }
}
