import { StepType, BASE_FIGHTER_STATS, BARE_HANDS_DAMAGE, weapons, skills } from './constants.js';

export class FightGenerator {
  constructor() {
    this.steps = [];
    this.fighters = [];
  }

  // Generate complete fight based on LaBrute mechanics
  generateFight(fighter1Data, fighter2Data) {
    // Initialize fighters
    this.fighters = [
      this.createFighter(1, fighter1Data, 'L'),
      this.createFighter(2, fighter2Data, 'R')
    ];
    
    this.steps = [];
    let turn = 0;
    const maxTurns = 200;
    
    // Fight loop
    while (turn < maxTurns) {
      // Order fighters by initiative
      const orderedFighters = this.getOrderedFighters();
      
      for (const fighter of orderedFighters) {
        if (fighter.hp <= 0) continue;
        
        // Find opponent
        const opponent = this.fighters.find(f => f.id !== fighter.id && f.hp > 0);
        if (!opponent) break;
        
        // Generate turn actions
        this.generateTurn(fighter, opponent);
        
        // Check for deaths
        if (opponent.hp <= 0) {
          this.steps.push({
            type: StepType.Death,
            fighter: opponent.id,
            duration: 1000
          });
        }
      }
      
      // Check win condition
      const aliveFighters = this.fighters.filter(f => f.hp > 0);
      if (aliveFighters.length <= 1) {
        const winner = aliveFighters[0];
        this.steps.push({
          type: StepType.End,
          winner: winner ? winner.id : null
        });
        break;
      }
      
      // Update initiatives
      this.updateInitiatives();
      turn++;
    }
    
    return {
      fighters: this.fighters.map(f => ({
        id: f.id,
        name: f.name,
        level: f.level,
        hp: f.maxHp,
        maxHp: f.maxHp,
        strength: f.strength,
        agility: f.agility,
        speed: f.speed,
        team: f.team,
        skills: f.skills,
        weapons: f.weapons
      })),
      steps: this.steps
    };
  }

  createFighter(id, data, team) {
    const fighter = {
      id,
      name: data.name || `Fighter ${id}`,
      level: data.level || 1,
      team,
      strength: data.strength || 10,
      agility: data.agility || 10,
      speed: data.speed || 10,
      hp: data.hp || 100,
      maxHp: data.hp || 100,
      skills: data.skills || [],
      weapons: data.weapons || [],
      currentWeapon: null,
      initiative: this.getInitialInitiative(data.speed || 10),
      position: team === 'L' ? 0 : 550,  // Initial position based on team
      stunned: false,
      trapped: false,
      ...BASE_FIGHTER_STATS
    };
    
    // Apply skill bonuses
    this.applySkillBonuses(fighter);
    
    return fighter;
  }

  getInitialInitiative(speed) {
    return (Math.random() * 10 - speed) / 100;
  }

  getOrderedFighters() {
    return [...this.fighters].sort((a, b) => {
      // Dead fighters go last
      if (a.hp <= 0) return 1;
      if (b.hp <= 0) return -1;
      
      // Stunned fighters go last
      if (a.stunned && !b.stunned) return 1;
      if (b.stunned && !a.stunned) return -1;
      
      // Sort by initiative
      if (a.initiative !== b.initiative) {
        return a.initiative - b.initiative;
      }
      
      // Random if equal
      return Math.random() - 0.5;
    });
  }

  generateTurn(fighter, opponent) {
    // Move towards opponent if needed
    const distance = Math.abs(fighter.position - opponent.position);
    const reach = fighter.currentWeapon ? weapons[fighter.currentWeapon]?.reach || 0 : 0;
    
    if (distance > reach + 1) {
      this.steps.push({
        type: StepType.Move,
        fighter: fighter.id,
        to: opponent.position > fighter.position ? 1 : -1,
        duration: 800
      });
      fighter.position += opponent.position > fighter.position ? 100 : -100;
    }
    
    // Try to equip weapon
    if (!fighter.currentWeapon && fighter.weapons.length > 0 && Math.random() > 0.3) {
      const weapon = fighter.weapons[Math.floor(Math.random() * fighter.weapons.length)];
      fighter.currentWeapon = weapon;
      this.steps.push({
        type: StepType.Equip,
        fighter: fighter.id,
        weapon: weapon,
        duration: 300
      });
    }
    
    // Attempt hit
    this.attemptHit(fighter, opponent);
  }

  attemptHit(attacker, target) {
    // Add attempt hit step
    this.steps.push({
      type: StepType.AttemptHit,
      fighter: attacker.id,
      target: target.id,
      duration: 200
    });
    
    // Check block
    if (Math.random() < this.getFighterStat(target, 'block')) {
      this.steps.push({
        type: StepType.Block,
        fighter: target.id,
        attacker: attacker.id,
        duration: 300
      });
      return;
    }
    
    // Check evade
    if (Math.random() < this.getFighterStat(target, 'evasion')) {
      this.steps.push({
        type: StepType.Evade,
        fighter: target.id,
        attacker: attacker.id,
        duration: 500
      });
      return;
    }
    
    // Calculate damage
    const damage = this.calculateDamage(attacker, target);
    
    // Apply damage
    target.hp -= damage;
    
    // Add hit step
    this.steps.push({
      type: StepType.Hit,
      fighter: attacker.id,
      target: target.id,
      damage: damage,
      duration: 400
    });
  }

  calculateDamage(attacker, target) {
    const weapon = attacker.currentWeapon ? weapons[attacker.currentWeapon] : null;
    const weaponDamage = weapon ? weapon.damage : BARE_HANDS_DAMAGE;
    
    // Base damage formula from LaBrute
    let damage = weaponDamage + attacker.strength * (0.2 + weaponDamage * 0.05);
    
    // Random factor
    damage *= (0.8 + Math.random() * 0.4);
    
    // Critical hit
    if (Math.random() < this.getFighterStat(attacker, 'criticalChance')) {
      damage *= this.getFighterStat(attacker, 'criticalDamage');
    }
    
    // Armor reduction
    const armor = this.getFighterStat(target, 'armor');
    if (armor > 0) {
      damage *= (1 - armor);
    }
    
    return Math.floor(damage);
  }

  getFighterStat(fighter, stat) {
    let value = fighter[stat] || 0;
    
    // Apply weapon modifiers
    if (fighter.currentWeapon) {
      const weapon = weapons[fighter.currentWeapon];
      if (weapon && weapon[stat]) {
        value += weapon[stat];
      }
    }
    
    return Math.max(0, value);
  }

  updateInitiatives() {
    for (const fighter of this.fighters) {
      if (fighter.hp <= 0) continue;
      
      // Get tempo
      const tempo = this.getTempo(fighter.speed);
      const weaponTempo = fighter.currentWeapon ? weapons[fighter.currentWeapon].tempo : 1.2;
      
      // Update initiative
      fighter.initiative += tempo * weaponTempo;
    }
  }

  getTempo(speed) {
    return 0.10 + (20 / (10 + (speed * 1.5))) * 0.90;
  }

  applySkillBonuses(fighter) {
    // Apply skill stat bonuses
    if (fighter.skills.includes('herculeanStrength')) {
      fighter.strength *= 1.5;
    }
    if (fighter.skills.includes('felineAgility')) {
      fighter.agility *= 1.5;
    }
    if (fighter.skills.includes('lightningBolt')) {
      fighter.speed *= 1.5;
    }
    if (fighter.skills.includes('vitality')) {
      fighter.hp *= 1.5;
      fighter.maxHp *= 1.5;
    }
    if (fighter.skills.includes('armor')) {
      fighter.armor = 0.25;
    }
    if (fighter.skills.includes('sixthSense')) {
      fighter.evasion += 0.1;
      fighter.counter += 0.1;
    }
  }
}