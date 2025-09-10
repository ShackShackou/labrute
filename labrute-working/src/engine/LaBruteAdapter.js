/**
 * LaBrute Adapter - Transforme les données LaBrute pour le moteur de combat
 * Interface entre le système LaBrute officiel et le moteur Phaser+Spine
 */

export class LaBruteAdapter {
  constructor() {
    this.laBruteData = null;
    this.fightSteps = [];
    this.fighters = [];
    this.currentStepIndex = 0;
  }

  // Map minimal StepType names for our usage
  stepTypeName(code) {
    // Indices alignés au core LaBrute (0..): Move=15, MoveBack=17, Hit=9, Block=20, Evade=21, Death=24, End=26, AttemptHit=19, Throw=25
    const map = {
      // Types numériques venant de notre code de test
      1: 'Move',
      2: 'Hit',
      3: 'Block',
      4: 'Evade',
      5: 'Death',
      6: 'End',
      
      // Types numériques venant de LaBrute officiel
      9: 'Hit', 
      15: 'Move', 
      17: 'MoveBack', 
      19: 'AttemptHit', 
      20: 'Block', 
      21: 'Evade', 
      24: 'Death', 
      25: 'Throw', 
      26: 'End'
    };
    
    const result = map[code];
    if (!result) {
      console.warn(`⚠️ Type de step non reconnu: ${code}`);
    }
    return result || 'Unknown';
  }

  normalizeType(a) {
    if (typeof a === 'string') return a;
    if (typeof a === 'number') {
      const typeName = this.stepTypeName(a);
      console.log(`🔄 Conversion type ${a} -> "${typeName}"`);
      return typeName;
    }
    console.warn(`⚠️ Type inconnu:`, a);
    return 'Unknown';
  }

  /**
   * Charge les données de combat LaBrute
   * @param {Object} laBruteFight - Données de combat depuis LaBrute
   */
  loadLaBruteFight(laBruteFight) {
    console.log('🔗 LaBruteAdapter: Chargement des données de combat', laBruteFight);
    
    this.laBruteData = laBruteFight;
    
    // Gérer différentes structures de données possibles
    try {
      // Cas 1: Steps et fighters déjà sous forme d'objets
      if (Array.isArray(laBruteFight.steps)) {
        console.log('📊 Utilisation des données steps en format Array');
        this.fightSteps = laBruteFight.steps;
      } 
      // Cas 2: Données provenant de l'API (JSON string)
      else if (typeof laBruteFight.steps === 'string') {
        console.log('📊 Parsing des données steps en JSON');
        this.fightSteps = JSON.parse(laBruteFight.steps || '[]');
      } 
      // Cas 3: Données de test (dummy)
      else {
        console.warn('⚠️ Format de steps non reconnu, utilisation des données de test');
        this.fightSteps = [
          { type: 1, f: "charA", t: "charB" },  // Move
          { type: 2, f: "charA", t: "charB", d: 2 },  // Hit
          { type: 5, f: "charB" },  // Death
          { type: 6, w: "charA" }  // End
        ];
      }

      // Même logique pour les fighters
      if (Array.isArray(laBruteFight.fighters)) {
        console.log('👥 Utilisation des données fighters en format Array');
        this.fighters = laBruteFight.fighters;
      } else if (typeof laBruteFight.fighters === 'string') {
        console.log('👥 Parsing des données fighters en JSON');
        this.fighters = JSON.parse(laBruteFight.fighters || '[]');
      } else {
        console.warn('⚠️ Format de fighters non reconnu, utilisation des données de test');
        // Fighters de test
        this.fighters = [
          {
            id: "charA",
            name: "Héros",
            team: "L",
            hp: 10,
            maxHp: 10,
            strengthValue: 5,
            agilityValue: 4,
            speedValue: 3,
            initiative: 2
          },
          {
            id: "charB",
            name: "Ennemi",
            team: "R",
            hp: 8,
            maxHp: 8,
            strengthValue: 4,
            agilityValue: 3,
            speedValue: 4,
            initiative: 1
          }
        ];
      }
    } catch (error) {
      console.error('❌ Erreur parsing données LaBrute:', error);
      // Données de secours en cas d'erreur
      this.fightSteps = [
        { type: 1, f: "charA", t: "charB" },
        { type: 2, f: "charA", t: "charB", d: 2 },
        { type: 5, f: "charB" },
        { type: 6, w: "charA" }
      ];
      this.fighters = [
        { id: "charA", name: "Héros", team: "L", hp: 10, maxHp: 10 },
        { id: "charB", name: "Ennemi", team: "R", hp: 8, maxHp: 8 }
      ];
    }

    this.currentStepIndex = 0;
    
    console.log(`✅ ${this.fightSteps.length} étapes de combat chargées`);
    console.log(`✅ ${this.fighters.length} combattants chargés`);
    console.log('📜 Exemple étape:', this.fightSteps[0]);
    console.log('👤 Exemple fighter:', this.fighters[0]);
  }

  /**
   * Transforme un Fighter LaBrute en format compatible avec ton moteur
   * @param {Object} laBruteFighter - Fighter depuis LaBrute
   * @returns {Object} Fighter compatible avec ton moteur
   */
  transformFighter(laBruteFighter) {
    return {
      // Données de base
      id: laBruteFighter.id,
      name: laBruteFighter.name,
      side: laBruteFighter.team === 'L' ? 'left' : 'right',
      
      // Stats transformées
      stats: {
        name: laBruteFighter.name,
        health: laBruteFighter.hp ?? 100,
        maxHealth: laBruteFighter.maxHp ?? laBruteFighter.hp ?? 100,
        stamina: 100,
        maxStamina: 100,
        strength: laBruteFighter.strengthValue ?? 20,
        defense: laBruteFighter.agilityValue ?? 10,
        agility: laBruteFighter.agilityValue ?? 15,
        speed: laBruteFighter.speedValue ?? 12,
        initiative: laBruteFighter.initiative ?? 0,
        baseInitiative: laBruteFighter.initiative ?? 1,
        counter: 0,
        combo: 0
      },

      // Skills et weapons LaBrute
      skills: laBruteFighter.skills || [],
      weapons: laBruteFighter.weapons || [],
      pets: laBruteFighter.pets || [],

      // Apparence
      body: laBruteFighter.body || '00000000000',
      colors: laBruteFighter.colors || '00000000000000000000000000000000',
      
      // Position et état
      baseX: laBruteFighter.x || 0,
      baseY: laBruteFighter.y || 0,
      baseScale: 0.30
    };
  }

  /**
   * Transforme une étape de combat LaBrute en action compatible
   * @param {Object} step - Étape de combat LaBrute
   * @returns {Object} Action compatible avec ton moteur
   */
  transformCombatStep(step) {
    // Gérer différents formats d'étapes
    // Format original LaBrute: { a: type, f: fighter, t: target, ... }
    // Format numérique: { type: 1, f: fighter, t: target, ... }
    let type;
    
    if (step.a !== undefined) {
      // Format original
      type = this.normalizeType(step.a);
    } else if (step.type !== undefined) {
      // Format numérique
      type = this.normalizeType(step.type);
    } else {
      console.warn('⚠️ Format d\'étape inconnu:', step);
      type = 'Unknown';
    }
    
    console.log(`🔄 Transformation étape: ${type}`, step);
    
    const action = {
      type: type,
      turn: this.currentStepIndex,
      data: step,
      actionType: 'unknown'
    };

    switch (type) {
      case 'Move': {
        action.actionType = 'move';
        action.fighterId = step.f;
        action.targetId = step.t;
        action.sameSpace = step.s === 1;
        action.reposition = step.r === 1;
        break;
      }
      case 'MoveBack': {
        action.actionType = 'moveBack';
        action.fighterId = step.f;
        break;
      }
      case 'Hit': {
        action.actionType = 'attack';
        action.attacker = step.f;
        action.target = step.t;
        action.damage = step.d;
        action.weapon = step.w;
        action.critical = step.c === 1;
        action.stunned = step.s === 1;
        break;
      }
      case 'Block': {
        action.actionType = 'block';
        action.fighter = step.f;
        break;
      }
      case 'Evade': {
        action.actionType = 'evade';
        action.fighter = step.f;
        break;
      }
      case 'Death': {
        action.actionType = 'death';
        action.fighter = step.f;
        break;
      }
      case 'End': {
        action.actionType = 'end';
        action.winner = step.w;
        action.loser = step.l;
        break;
      }
      default: {
        // Convertir les types numériques aux valeurs connues
        if (step.type === 1 || step.a === 1) {
          action.actionType = 'move';
          action.fighterId = step.f;
          action.targetId = step.t;
        } else if (step.type === 2 || step.a === 2) {
          action.actionType = 'attack';
          action.attacker = step.f;
          action.target = step.t;
          action.damage = step.d;
        } else if (step.type === 3 || step.a === 3) {
          action.actionType = 'block';
          action.fighter = step.f;
        } else if (step.type === 4 || step.a === 4) {
          action.actionType = 'evade';
          action.fighter = step.f;
        } else if (step.type === 5 || step.a === 5) {
          action.actionType = 'death';
          action.fighter = step.f;
        } else if (step.type === 6 || step.a === 6) {
          action.actionType = 'end';
          action.winner = step.w;
          action.loser = step.l;
        } else {
          action.actionType = 'unknown';
          console.warn('⚠️ Type d\'action non reconnu:', step);
        }
        break;
      }
    }

    return action;
  }

  /**
   * Récupère la prochaine étape de combat
   * @returns {Object|null} Prochaine action ou null si fini
   */
  getNextStep() {
    if (this.currentStepIndex >= this.fightSteps.length) {
      return null;
    }

    const step = this.fightSteps[this.currentStepIndex];
    this.currentStepIndex++;
    return this.transformCombatStep(step);
  }

  /**
   * Vérifie si le combat est terminé
   * @returns {boolean}
   */
  isCombatFinished() {
    return this.currentStepIndex >= this.fightSteps.length;
  }

  /**
   * Récupère les combattants transformés
   * @returns {Array} Array de 2 fighters compatibles
   */
  getTransformedFighters() {
    if (this.fighters.length < 2) {
      console.warn('⚠️ Pas assez de combattants LaBrute');
      return null;
    }

    const fighter1 = this.fighters.find(f => f.id === this.laBruteData.brute1Id) || this.fighters[0];
    const fighter2 = this.fighters.find(f => f.id === this.laBruteData.brute2Id) || this.fighters[1];

    return [
      this.transformFighter(fighter1),
      this.transformFighter(fighter2)
    ];
  }

  /**
   * Récupère les informations de combat
   * @returns {Object} Métadonnées du combat
   */
  getCombatInfo() {
    return {
      fightId: this.laBruteData?.id,
      totalSteps: this.fightSteps.length,
      currentStep: this.currentStepIndex,
      isFinished: this.isCombatFinished(),
      background: this.laBruteData?.background || 'default'
    };
  }

  /**
   * Reset l'adaptateur pour un nouveau combat
   */
  reset() {
    this.currentStepIndex = 0;
    console.log('🔄 LaBruteAdapter reset');
  }
}
