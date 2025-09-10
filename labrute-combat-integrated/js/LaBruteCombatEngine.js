// Moteur de combat avec les vraies mécaniques de LaBrute
// Extrait depuis core/src et server/src de LaBrute officiel

export const StepType = {
  Saboteur: 0, Leave: 1, Arrive: 2, Trash: 3, Steal: 4, Trap: 5, Heal: 6,
  Resist: 7, Survive: 8, Hit: 9, FlashFlood: 10, Hammer: 11, Poison: 12,
  Bomb: 13, Hypnotise: 14, Move: 15, Eat: 16, MoveBack: 17, Equip: 18,
  AttemptHit: 19, Block: 20, Evade: 21, Sabotage: 22, Disarm: 23, Death: 24,
  Throw: 25, End: 26, Counter: 27, SkillActivate: 28, SkillExpire: 29,
  Spy: 30, Vampirism: 31, Haste: 32, Treat: 33, DropShield: 34, Regeneration: 35
};

export const BASE_FIGHTER_STATS = {
  reversal: 0,
  evasion: 0.1,
  dexterity: 0.2,
  block: -0.25,
  accuracy: 0,
  disarm: 0.05,
  combo: 0,
  deflect: 0,
  tempo: 1.2,
  criticalChance: 0.05,
  criticalDamage: 1.5,
};

export const BARE_HANDS_DAMAGE = 5;
export const NO_WEAPON_TOSS = 0.1;

// Toutes les armes de LaBrute avec leurs vraies stats
export const weapons = {
  axe: { name: 'axe', odds: 3000, types: ['heavy'], tempo: 2.2, reversal: 0.1, evasion: -0.3, dexterity: -0.2, block: -0.3, accuracy: 0.5, disarm: 0.1, combo: -0.4, deflect: 0, damage: 50, reach: 1, toss: 8 },
  baton: { name: 'baton', odds: 100, types: ['long'], tempo: 0.8, reversal: 0.3, evasion: 0.05, dexterity: 0, block: 0.2, accuracy: 0, disarm: 0.1, combo: 0.1, deflect: 0, damage: 6, reach: 3, toss: 5 },
  broadsword: { name: 'broadsword', odds: 500, types: ['sharp'], tempo: 1, reversal: 0.1, evasion: 0, dexterity: 0, block: 0.15, accuracy: 0, disarm: 0.15, combo: 0, deflect: 0, damage: 14, reach: 1, toss: 8 },
  bumps: { name: 'bumps', odds: 50, types: ['heavy', 'blunt'], tempo: 2.5, reversal: 0.3, evasion: -0.3, dexterity: -0.35, block: -0.3, accuracy: 0.5, disarm: 0.1, combo: -0.6, deflect: 0, damage: 55, reach: 1, toss: 10 },
  fan: { name: 'fan', odds: 50, types: ['fast'], tempo: 0.28, reversal: -0.4, evasion: 0.6, dexterity: 0.5, block: -0.5, accuracy: 0.3, disarm: -0.3, combo: 0.5, deflect: 0.25, damage: 4, reach: 0, toss: 2 },
  flail: { name: 'flail', odds: 400, types: ['heavy'], tempo: 1, reversal: 0.39, evasion: 0, dexterity: 0, block: 0, accuracy: -0.1, disarm: -0.1, combo: 0, deflect: 0, damage: 19, reach: 1, toss: 6 },
  fryingPan: { name: 'fryingPan', odds: 40, types: ['blunt'], tempo: 0.8, reversal: -0.1, evasion: 0.15, dexterity: 0.1, block: 0.3, accuracy: 0.3, disarm: 0, combo: 0, deflect: 0, damage: 17, reach: 0, toss: 8 },
  halbard: { name: 'halbard', odds: 200, types: ['long', 'sharp'], tempo: 1.8, reversal: 0.1, evasion: -0.1, dexterity: -0.1, block: 0, accuracy: 0, disarm: 0.3, combo: -0.2, deflect: 0, damage: 24, reach: 5, toss: 10 },
  hatchet: { name: 'hatchet', odds: 400, types: ['heavy', 'sharp'], tempo: 1, reversal: 0, evasion: 0, dexterity: 0, block: 0, accuracy: 0.1, disarm: 0, combo: 0, deflect: 0, damage: 17, reach: 0, toss: 6 },
  keyboard: { name: 'keyboard', odds: 100, types: ['blunt'], tempo: 0.7, reversal: 0, evasion: 0, dexterity: 0, block: 0, accuracy: 0.3, disarm: 0, combo: 0.3, deflect: 0, damage: 7, reach: 1, toss: 5 },
  knife: { name: 'knife', odds: 200, types: ['fast', 'sharp'], tempo: 0.5, reversal: -0.15, evasion: 0.1, dexterity: 0.25, block: -0.15, accuracy: 0, disarm: -0.1, combo: 0.3, deflect: 0, damage: 7, reach: 0, toss: 3 },
  lance: { name: 'lance', odds: 100, types: ['long'], tempo: 0.8, reversal: 0.15, evasion: 0, dexterity: 0.05, block: 0, accuracy: 0, disarm: 0.1, combo: 0.1, deflect: 0, damage: 10, reach: 4, toss: 5 },
  leek: { name: 'leek', odds: 40, types: [], tempo: 0.5, reversal: 0, evasion: 0.5, dexterity: 0.5, block: 0, accuracy: 0.4, disarm: 0, combo: 0.3, deflect: 0, damage: 5, reach: 1, toss: 3 },
  mammothBone: { name: 'mammothBone', odds: 250, types: ['heavy', 'blunt'], tempo: 2.2, reversal: 0, evasion: -0.15, dexterity: -0.15, block: -0.1, accuracy: 0.3, disarm: 0, combo: -0.3, deflect: 0, damage: 32, reach: 2, toss: 10 },
  morningStar: { name: 'morningStar', odds: 250, types: ['heavy'], tempo: 1.5, reversal: 0.15, evasion: -0.05, dexterity: -0.05, block: -0.3, accuracy: 0.1, disarm: 0.1, combo: -0.1, deflect: 0, damage: 26, reach: 1, toss: 8 },
  mug: { name: 'mug', odds: 400, types: ['blunt', 'thrown'], tempo: 0.7, reversal: 0, evasion: 0, dexterity: 0, block: 0, accuracy: 0.3, disarm: 0, combo: 0.1, deflect: 0, damage: 8, reach: 0, toss: 4 },
  noodleBowl: { name: 'noodleBowl', odds: 300, types: ['thrown'], tempo: 0.16, reversal: 0, evasion: 0, dexterity: 0, block: 0, accuracy: 0.4, disarm: 0, combo: 0, deflect: 0, damage: 10, reach: 0, toss: 2 },
  piopio: { name: 'piopio', odds: 5, types: ['thrown'], tempo: 0.12, reversal: 0, evasion: 0, dexterity: 0, block: 0, accuracy: 0.5, disarm: 0, combo: 0, deflect: 0, damage: 3, reach: 0, toss: 2 },
  racquet: { name: 'racquet', odds: 70, types: [], tempo: 0.8, reversal: 0.1, evasion: 0.1, dexterity: 0.1, block: 0.1, accuracy: 0.05, disarm: 0, combo: 0.05, deflect: 0.3, damage: 11, reach: 1, toss: 5 },
  sai: { name: 'sai', odds: 200, types: ['fast'], tempo: 0.6, reversal: 0.5, evasion: 0.1, dexterity: 0.25, block: 0.15, accuracy: 0, disarm: 0.5, combo: 0, deflect: 0, damage: 9, reach: 0, toss: 4 },
  scimitar: { name: 'scimitar', odds: 70, types: ['sharp'], tempo: 0.8, reversal: 0, evasion: 0.05, dexterity: 0.05, block: 0, accuracy: 0.05, disarm: 0.05, combo: 0.05, deflect: 0, damage: 11, reach: 0, toss: 6 },
  shuriken: { name: 'shuriken', odds: 200, types: ['fast', 'thrown'], tempo: 0.14, reversal: 0, evasion: 0.1, dexterity: 0, block: 0, accuracy: 0.3, disarm: 0, combo: 0, deflect: 0, damage: 5, reach: 0, toss: 2 },
  sword: { name: 'sword', odds: 100, types: ['sharp'], tempo: 0.9, reversal: 0, evasion: 0, dexterity: 0.05, block: 0.05, accuracy: 0, disarm: 0.05, combo: 0, deflect: 0, damage: 12, reach: 1, toss: 7 },
  trident: { name: 'trident', odds: 100, types: ['long'], tempo: 1.2, reversal: 0.1, evasion: -0.05, dexterity: 0, block: 0, accuracy: 0, disarm: 0.25, combo: 0, deflect: 0, damage: 16, reach: 3, toss: 7 },
  trombone: { name: 'trombone', odds: 50, types: ['blunt'], tempo: 1.1, reversal: 0, evasion: 0, dexterity: 0, block: 0.2, accuracy: 0.3, disarm: 0, combo: 0, deflect: 0, damage: 20, reach: 2, toss: 8 },
  whip: { name: 'whip', odds: 60, types: ['long'], tempo: 1.5, reversal: 0.35, evasion: -0.1, dexterity: 0.3, block: -0.2, accuracy: -0.2, disarm: 0.35, combo: -0.1, deflect: 0, damage: 12, reach: 5, toss: 7 }
};

export class LaBruteCombatEngine {
  constructor() {
    this.fighters = [];
    this.steps = [];
    this.currentTurn = 0;
  }

  // Calcul des HP selon la formule officielle
  getHP(level, endurance) {
    return Math.floor(50 + (Math.max(endurance, 0) + level * 0.25) * 6);
  }

  // Calcul du tempo selon la formule officielle
  getTempo(speed) {
    return 0.10 + (20 / (10 + (speed * 1.5))) * 0.90;
  }

  // Initiative initiale
  getInitialInitiative(speed) {
    return (Math.random() * 10 - speed) / 100;
  }

  // Créer un combattant avec stats LaBrute
  createFighter(id, data) {
    const fighter = {
      id,
      name: data.name || `Fighter ${id}`,
      level: data.level || 1,
      team: data.team || (id === 1 ? 'L' : 'R'),
      
      // Stats principales
      strength: data.strength || 10,
      agility: data.agility || 10,
      speed: data.speed || 10,
      endurance: data.endurance || 10,
      
      // HP calculés selon la formule LaBrute
      hp: 0,
      maxHp: 0,
      
      // Armes et compétences
      weapons: data.weapons || [],
      skills: data.skills || [],
      currentWeapon: null,
      
      // État de combat
      initiative: 0,
      position: data.team === 'L' ? 0 : 550,
      stunned: false,
      trapped: false,
      poisoned: false,
      
      // Stats dérivées
      ...BASE_FIGHTER_STATS
    };
    
    // Calculer les HP
    fighter.maxHp = this.getHP(fighter.level, fighter.endurance);
    fighter.hp = fighter.maxHp;
    
    // Initiative initiale
    fighter.initiative = this.getInitialInitiative(fighter.speed);
    
    return fighter;
  }

  // Générer un combat complet
  generateFight(fighter1Data, fighter2Data) {
    this.fighters = [
      this.createFighter(1, fighter1Data),
      this.createFighter(2, fighter2Data)
    ];
    
    this.steps = [];
    this.currentTurn = 0;
    
    const maxTurns = 500;
    
    while (this.currentTurn < maxTurns) {
      // Ordonner les combattants par initiative
      const orderedFighters = this.getOrderedFighters();
      
      for (const fighter of orderedFighters) {
        if (fighter.hp <= 0) continue;
        
        const opponent = this.fighters.find(f => f.id !== fighter.id && f.hp > 0);
        if (!opponent) break;
        
        // Générer les actions du tour
        this.generateTurnActions(fighter, opponent);
        
        // Vérifier les morts
        if (opponent.hp <= 0) {
          this.steps.push({
            type: StepType.Death,
            fighter: opponent.id,
            duration: 1000
          });
        }
      }
      
      // Condition de victoire
      const aliveFighters = this.fighters.filter(f => f.hp > 0);
      if (aliveFighters.length <= 1) {
        this.steps.push({
          type: StepType.End,
          winner: aliveFighters[0]?.id || null
        });
        break;
      }
      
      // Mettre à jour les initiatives
      this.updateInitiatives();
      this.currentTurn++;
    }
    
    return {
      fighters: this.fighters.map(f => ({...f})),
      steps: this.steps
    };
  }

  // Ordonner les combattants selon les règles LaBrute
  getOrderedFighters() {
    return [...this.fighters].sort((a, b) => {
      // Morts en dernier
      if (a.hp <= 0) return 1;
      if (b.hp <= 0) return -1;
      
      // Stun en dernier
      if (a.stunned && !b.stunned) return 1;
      if (b.stunned && !a.stunned) return -1;
      
      // Par initiative
      if (a.initiative !== b.initiative) {
        return a.initiative - b.initiative;
      }
      
      // Aléatoire si égalité
      return Math.random() - 0.5;
    });
  }

  // Générer les actions d'un tour
  generateTurnActions(fighter, opponent) {
    // Décider si on pioche une arme
    if (!fighter.currentWeapon && fighter.weapons.length > 0) {
      if (Math.random() > NO_WEAPON_TOSS) {
        const weapon = fighter.weapons[Math.floor(Math.random() * fighter.weapons.length)];
        fighter.currentWeapon = weapon;
        this.steps.push({
          type: StepType.Equip,
          fighter: fighter.id,
          weapon: weapon,
          duration: 300
        });
      }
    }
    
    // Calculer la distance
    const distance = Math.abs(fighter.position - opponent.position);
    const reach = fighter.currentWeapon ? (weapons[fighter.currentWeapon]?.reach || 0) : 0;
    
    // Se déplacer si nécessaire
    if (distance > (reach + 1) * 50) {
      const targetPos = opponent.position > fighter.position ? 
        Math.min(fighter.position + 150, opponent.position - 50) :
        Math.max(fighter.position - 150, opponent.position + 50);
      
      this.steps.push({
        type: StepType.Move,
        fighter: fighter.id,
        to: targetPos,
        duration: 800
      });
      fighter.position = targetPos;
    }
    
    // Tenter une attaque
    this.attemptHit(fighter, opponent);
  }

  // Résolution d'attaque selon les mécaniques LaBrute
  attemptHit(attacker, defender) {
    this.steps.push({
      type: StepType.AttemptHit,
      fighter: attacker.id,
      target: defender.id,
      duration: 200
    });
    
    // Calcul des stats avec arme
    const attackerStats = this.getFighterStats(attacker);
    const defenderStats = this.getFighterStats(defender);
    
    // Test de blocage
    if (Math.random() < defenderStats.block) {
      this.steps.push({
        type: StepType.Block,
        fighter: defender.id,
        attacker: attacker.id,
        duration: 300
      });
      
      // Test de contre-attaque
      if (Math.random() < defenderStats.reversal) {
        this.steps.push({
          type: StepType.Counter,
          fighter: defender.id,
          target: attacker.id,
          duration: 400
        });
      }
      return;
    }
    
    // Test d'esquive
    if (Math.random() < defenderStats.evasion) {
      this.steps.push({
        type: StepType.Evade,
        fighter: defender.id,
        attacker: attacker.id,
        duration: 500
      });
      return;
    }
    
    // Calcul des dégâts selon la formule officielle
    const damage = this.calculateDamage(attacker, defender, attackerStats);
    
    // Appliquer les dégâts
    defender.hp = Math.max(0, defender.hp - damage);
    
    this.steps.push({
      type: StepType.Hit,
      fighter: attacker.id,
      target: defender.id,
      damage: damage,
      duration: 400
    });
  }

  // Calcul des dégâts selon les formules officielles LaBrute
  calculateDamage(attacker, defender, attackerStats) {
    const weapon = attacker.currentWeapon ? weapons[attacker.currentWeapon] : null;
    const weaponDamage = weapon ? weapon.damage : BARE_HANDS_DAMAGE;
    
    // Formule officielle de dégâts
    let damage = weaponDamage + attacker.strength * (0.2 + weaponDamage * 0.05);
    
    // Facteur aléatoire
    damage *= (0.8 + Math.random() * 0.4);
    
    // Coup critique
    if (Math.random() < attackerStats.criticalChance) {
      damage *= attackerStats.criticalDamage;
      
      // Ajouter indicateur de critique
      this.steps.push({
        type: StepType.SkillActivate,
        fighter: attacker.id,
        skill: 'critical',
        duration: 100
      });
    }
    
    // Réduction par l'armure
    if (defender.armor) {
      damage *= (1 - defender.armor);
    }
    
    return Math.floor(damage);
  }

  // Obtenir les stats avec modificateurs d'arme
  getFighterStats(fighter) {
    const stats = {...BASE_FIGHTER_STATS};
    
    if (fighter.currentWeapon) {
      const weapon = weapons[fighter.currentWeapon];
      if (weapon) {
        Object.keys(stats).forEach(stat => {
          if (weapon[stat] !== undefined) {
            stats[stat] += weapon[stat];
          }
        });
      }
    }
    
    // Limiter les valeurs
    stats.block = Math.max(0, Math.min(0.9, stats.block));
    stats.evasion = Math.max(0, Math.min(0.9, stats.evasion));
    stats.reversal = Math.max(0, Math.min(0.9, stats.reversal));
    
    return stats;
  }

  // Mise à jour des initiatives selon les formules LaBrute
  updateInitiatives() {
    for (const fighter of this.fighters) {
      if (fighter.hp <= 0) continue;
      
      const tempo = this.getTempo(fighter.speed);
      const weaponTempo = fighter.currentWeapon ? 
        (weapons[fighter.currentWeapon]?.tempo || 1.2) : 1.2;
      
      fighter.initiative += tempo * weaponTempo;
    }
  }
}