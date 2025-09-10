import { createPet } from '../game/pets.js';
import { weaponStats, getWeaponDamageModifier } from '../game/weapons.js';

export class CombatEngine {
  constructor(fighter1, fighter2) {
    this.fighter1 = fighter1;
    this.fighter2 = fighter2;
    this.currentTurn = 0;
    this.activePlayer = null; // Sera déterminé par l'initiative
    this.turnInProgress = false; // Add turn lock
    this.lastWeaponThrowTurn = -1; // Track when last weapon was thrown
    this.comboCounter = { [fighter1.stats.name]: 0, [fighter2.stats.name]: 0 }; // Track combo hits
    this.lastAttacker = null; // Track who attacked last for combo tracking
    this.initiativeOrder = []; // Ordre de jeu basé sur l'initiative
    this.currentInitiativeIndex = 0; // Index dans l'ordre d'initiative
    this.roundComplete = false; // Pour savoir quand recalculer l'initiative
    this.consecutiveStats = { // Track consecutive actions for achievements
      [fighter1.stats.name]: { counters: 0, blocks: 0, evades: 0, throws: 0 },
      [fighter2.stats.name]: { counters: 0, blocks: 0, evades: 0, throws: 0 }
    };
    this.combatSteps = []; // Detailed combat steps for replay
    
    // Initialize pets if fighters have them
    this.initializePets();
    
    // Initialize special moves for both fighters
    this.initializeSpecialMoves();
  }
  
  initializePets() {
    // Initialize pets for both fighters if they have them
    [this.fighter1, this.fighter2].forEach(fighter => {
      if (fighter.petType) {
        fighter.pet = createPet(fighter.petType, fighter);
      }
    });
  }
  
  initializeSpecialMoves() {
    // Available special moves
    this.specialMoves = {
      berserkerRage: {
        name: 'Berserker Rage',
        description: 'Double damage for 3 turns',
        duration: 3,
        effect: 'damage_boost',
        multiplier: 2,
        unlockChance: 0.15
      },
      defensiveShield: {
        name: 'Defensive Shield', 
        description: 'Reduces incoming damage by 50% for 3 turns',
        duration: 3,
        effect: 'defense_boost',
        multiplier: 0.5,
        unlockChance: 0.12
      },
      vampiricStrike: {
        name: 'Vampiric Strike',
        description: 'Next attack heals for 50% of damage dealt',
        duration: 1,
        effect: 'lifesteal',
        multiplier: 0.5,
        unlockChance: 0.10
      },
      adrenalineRush: {
        name: 'Adrenaline Rush',
        description: 'Restores full stamina and increases accuracy',
        duration: 2,
        effect: 'stamina_accuracy',
        multiplier: 1.5,
        unlockChance: 0.08
      },
      lightningReflexes: {
        name: 'Lightning Reflexes',
        description: 'Grants a chance for an extra attack each turn',
        duration: 5,
        effect: 'multi_attack',
        multiplier: 0.3, // 30% chance for an extra hit
        unlockChance: 0.05
      }
    };
    
    // Initialize fighter special move states
    [this.fighter1, this.fighter2].forEach(fighter => {
      fighter.specialMoves = {
        unlocked: [],
        active: {}
      };
    });
    
    // Calculer l'initiative initiale
    this.calculateInitiative();
  }
  
  // Add a combat step for replay
  addCombatStep(type, data) {
    this.combatSteps.push({
      turn: this.currentTurn,
      type: type,
      timestamp: Date.now(),
      ...data
    });
  }
  
  // Track consecutive actions for achievements
  updateConsecutiveStats(fighter, action, reset = false) {
    const stats = this.consecutiveStats[fighter.stats.name];
    if (!stats) return;
    
    if (reset) {
      // Reset all consecutive counters for this fighter
      stats.counters = 0;
      stats.blocks = 0;
      stats.evades = 0;
      stats.throws = 0;
      return;
    }
    
    // Reset other stats when a specific action occurs
    switch (action) {
      case 'counter':
        stats.counters++;
        stats.blocks = 0;
        stats.evades = 0;
        console.log(`${fighter.stats.name} consecutive counters: ${stats.counters}`);
        break;
      case 'block':
        stats.blocks++;
        stats.counters = 0;
        stats.evades = 0;
        console.log(`${fighter.stats.name} consecutive blocks: ${stats.blocks}`);
        break;
      case 'evade':
        stats.evades++;
        stats.counters = 0;
        stats.blocks = 0;
        console.log(`${fighter.stats.name} consecutive evades: ${stats.evades}`);
        break;
      case 'throw':
        stats.throws++;
        console.log(`${fighter.stats.name} consecutive throws: ${stats.throws}`);
        break;
      case 'hit':
        // Getting hit resets defensive stats
        stats.counters = 0;
        stats.blocks = 0;
        stats.evades = 0;
        break;
    }
    
    // Check for achievement thresholds
    if (stats.counters >= 4) {
      console.log(`🏆 ${fighter.stats.name} achieves 4 consecutive counters!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'counter4b2b' });
    }
    if (stats.blocks >= 4) {
      console.log(`🏆 ${fighter.stats.name} achieves 4 consecutive blocks!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'block4b2b' });
    }
    if (stats.evades >= 4) {
      console.log(`🏆 ${fighter.stats.name} achieves 4 consecutive evades!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'evade4b2b' });
    }
    if (stats.throws >= 10) {
      console.log(`🏆 ${fighter.stats.name} achieves 10 consecutive throws!`);
      this.addCombatStep('achievement', { fighter: fighter.stats.name, achievement: 'throw10b2b' });
    }
  }
  
  calculateInitiative() {
    // Calculer l'initiative pour chaque fighter
    // Initiative = baseInitiative + (speed * 0.01) + random(0, 0.1)
    // Plus l'initiative est BASSE, plus on joue TÔT (comme LaBrute officiel)
    
    this.fighter1.stats.initiative = 
      this.fighter1.stats.baseInitiative - (this.fighter1.stats.speed * 0.01) + Math.random() * 0.1;
    
    this.fighter2.stats.initiative = 
      this.fighter2.stats.baseInitiative - (this.fighter2.stats.speed * 0.01) + Math.random() * 0.1;
    
    // Déterminer l'ordre de jeu (le plus petit joue en premier)
    if (this.fighter1.stats.initiative <= this.fighter2.stats.initiative) {
      this.initiativeOrder = [this.fighter1, this.fighter2];
    } else {
      this.initiativeOrder = [this.fighter2, this.fighter1];
    }
    
    // Définir le premier joueur actif
    this.currentInitiativeIndex = 0;
    this.activePlayer = this.initiativeOrder[0];
    this.roundComplete = false;
  }
  
  executeTurn() {
    // Prevent multiple simultaneous turn executions
    if (this.turnInProgress) {
      // Silently skip
      return null;
    }
    
    // Safety check for valid fighters
    if (!this.activePlayer || this.activePlayer.stats.health <= 0) {
      // Invalid state, reset
      this.turnInProgress = false;
      return null;
    }
    
    try {
      this.turnInProgress = true;
      this.currentTurn++;
      
      const attacker = this.activePlayer;
      const defender = attacker === this.fighter1 ? this.fighter2 : this.fighter1;
      
      // Ensure defender is valid
      if (!defender || defender.stats.health <= 0) {
        this.turnInProgress = false;
        return {
          type: 'victory',
          attacker: attacker,
          target: defender,
          message: `${attacker.stats.name} wins!`,
          gameOver: true,
          winner: attacker
        };
      }
      
      // SPECIAL MOVES DISABLED - Too slow for combat rhythm
      // this.processSpecialMoveEffects(attacker);
      // this.processSpecialMoveEffects(defender);
      
      // Special move unlocking DISABLED
      const unlockedMove = null; // this.tryUnlockSpecialMove(attacker);
      
      // Check for skill abilities first
      const skillResult = this.checkSkillAbilities(attacker, defender);
      if (skillResult === 'treated') {
        // Skill was used, continue with normal turn
      } else if (skillResult === 'extra_turn') {
        // Don't switch turns for haste effect
        this.turnInProgress = false;
        return { type: 'skill', skill: 'haste', message: `${attacker.stats.name} gains an extra action!` };
      }
      
      // Check stamina for action
      if (attacker.stats.stamina < 20) {
        attacker.stats.stamina = Math.min(attacker.stats.maxStamina, attacker.stats.stamina + 30);
        this.switchTurns();
        
        let message = `${attacker.stats.name} recovers stamina!`;
        if (unlockedMove) {
          message += ` ${attacker.stats.name} unlocks ${unlockedMove.name}!`;
        }
        
        // Mark turn as complete before returning
        this.turnInProgress = false;
        
        return {
          type: 'rest',
          attacker: attacker,
          target: defender,
          message: message,
          unlockedMove: unlockedMove,
          gameOver: false
        };
      }
      
      // Decide between normal attack, special move, or weapon throw
      const useSpecialMove = attacker.specialMoves.unlocked.length > 0 && Math.random() < 0.3;
      // Prevent throwing if a weapon was thrown in the last 2 turns to avoid simultaneous throws
      const canThrowWeapon = attacker.hasWeapon && (this.currentTurn - this.lastWeaponThrowTurn) > 2;
      const throwWeapon = canThrowWeapon && Math.random() < 0.15; // 15% chance to throw weapon
      
      let result;
      if (throwWeapon && attacker.stats.stamina >= 35) {
        result = this.executeWeaponThrow(attacker, defender);
      } else if (useSpecialMove && attacker.stats.stamina >= 40) {
        result = this.executeSpecialMove(attacker, defender);
      } else {
        result = this.calculateAttack(attacker, defender);
      }
      
      if (unlockedMove) {
        result.message += ` ${attacker.stats.name} unlocks ${unlockedMove.name}!`;
        result.unlockedMove = unlockedMove;
      }
      
      // Don't execute additional attacks if the primary was countered
      if (!result.countered) {
        // Check for multi-attack after the primary action
        result.multiAttack = this.executeMultiAttack(attacker, defender);
        
        // Check for pet assistance after the primary action
        result.petAssist = this.executePetAssistance(attacker, defender, result);
      }
      
      this.switchTurns();
      
      // Check for game over
      const gameOver = defender.stats.health <= 0;
      const winner = gameOver ? attacker : null;
      
      result.gameOver = gameOver;
      result.winner = winner;
      
      // Mark turn as complete
      this.turnInProgress = false;
      
      return result;
      
    } catch (error) {
      console.error("Combat error:", error.message);
      // ALWAYS reset the turn flag on error to prevent deadlock
      this.turnInProgress = false;
      
      // Try to recover by switching turns
      this.switchTurns();
      
      return {
        type: 'error',
        attacker: this.activePlayer,
        target: this.activePlayer === this.fighter1 ? this.fighter2 : this.fighter1,
        message: 'Turn error - skipping',
        gameOver: false
      };
    }
  }
  
  executeMultiAttack(attacker, defender) {
    // Base chance from agility (e.g., 0.5% per point of agility)
    let multiAttackChance = attacker.stats.agility * 0.005;
    
    // Lightning reflexes DISABLED for faster combat
    const reflexActive = false; // attacker.specialMoves.active.lightningReflexes;
    
    // Reflexes bonus DISABLED
    // if (reflexActive) {
    //   multiAttackChance += this.specialMoves.lightningReflexes.multiplier;
    // }
    // Ensure we have a chance and enough stamina
    if (multiAttackChance > 0 && Math.random() < multiAttackChance && attacker.stats.stamina >= 15) {
      // Stamina cost for extra attack
      attacker.stats.stamina -= 15;
      
      // Perform a weaker, faster follow-up attack
      const followUpAttack = this.calculateAttack(attacker, defender, 0.6); // 60% damage
      
      // Customize message based on what triggered the attack
      let message;
      if (reflexActive) {
        message = `👟 ${attacker.stats.name}'s reflexes grant another strike for ${followUpAttack.damage} damage!`;
      } else {
        message = `💨 ${attacker.stats.name} is quick enough for a follow-up attack, dealing ${followUpAttack.damage} damage!`;
      }
      
      followUpAttack.message = message;
      followUpAttack.type = 'multi_attack'; // Differentiate for animation
      return followUpAttack;
    }
    
    return null;
  }
  
  executePetAssistance(attacker, defender, primaryResult) {
    const pet = attacker.pet;
    
    // Only assist if pet exists, is alive, and primary action hit or was successful
    if (!pet || !pet.isAlive || (!primaryResult.hit && primaryResult.type !== 'special')) {
      return null;
    }
    
    // Check if pet should assist
    if (!pet.canAssist()) {
      return null;
    }
    
    // Create assistance result based on pet type and ability
    const assistResult = this.calculatePetAction(pet, defender);
    
    // Apply pet assistance effects
    if (assistResult.damage > 0) {
      defender.stats.health = Math.max(0, defender.stats.health - assistResult.damage);
      
      // Apply status effects if any
      if (assistResult.statusEffect) {
        this.applyStatusEffect(defender, assistResult.statusEffect);
      }
    }
    
    return assistResult;
  }
  
  calculatePetAction(pet, target) {
    const owner = pet.owner;
    const effect = pet.getAbilityEffect(target);
    
    // Apply defense reduction
    const reducedDefense = Math.floor(target.stats.defense * 0.4); // Pets bypass some defense
    const finalDamage = Math.max(0, effect.damage - reducedDefense);
    
    return {
      type: 'pet_assist',
      pet: pet,
      owner: owner,
      target: target,
      damage: finalDamage,
      ability: pet.ability,
      specialEffect: effect.specialEffect,
      statusEffect: effect.statusEffect,
      message: `${owner.stats.name}'s ${effect.message}`
    };
  }
  
  applyStatusEffect(target, effect) {
    if (!target.statusEffects) {
      target.statusEffects = [];
    }
    
    // Check if effect already exists
    const existing = target.statusEffects.find(e => e.type === effect.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration);
    } else {
      target.statusEffects.push({ ...effect, remainingDuration: effect.duration });
    }
  }
  
  calculateAttack(attacker, defender, damageModifier = 1.0) {
    // Stamina cost
    attacker.stats.stamina -= 20;
    
    // Check for counter-attack chance BEFORE the attack
    const counterChance = (defender.stats.counter || 0) * 0.01; // Base 1% per counter point
    const counterRoll = Math.random();
    const willCounter = counterRoll < counterChance && defender.stats.stamina >= 25;
    
    if (willCounter) {
      defender.stats.stamina -= 25;
      
      // Calculate counter damage (50% of defender's strength)
      const counterDamage = Math.floor(defender.stats.strength * 0.5 * (0.8 + Math.random() * 0.4));
      attacker.stats.health = Math.max(0, attacker.stats.health - counterDamage);
      
      // Track consecutive counter
      this.updateConsecutiveStats(defender, 'counter');
      this.updateConsecutiveStats(attacker, 'hit'); // Reset attacker's defensive stats
      
      return {
        type: 'counter',
        attacker: attacker,
        target: defender,
        hit: true,
        damage: counterDamage,
        message: `⚔️ ${defender.stats.name} counters the attack for ${counterDamage} damage!`,
        countered: true
      };
    }
    
    // Block check based on defender's defense stat
    const blockChance = defender.stats.defense * 0.01; // 1% chance to block per defense point
    const hasStaminaForBlock = defender.stats.stamina >= 15;
    const blockRoll = Math.random();
    const blockSuccess = hasStaminaForBlock && blockRoll < blockChance;
    
    // Show debug indicator for block calculation (guarded)
    if (defender.scene && typeof defender.scene.showBlockChanceIndicator === 'function') {
      defender.scene.showBlockChanceIndicator(defender, blockChance, hasStaminaForBlock, blockSuccess, hasStaminaForBlock);
    }
    
    if (blockSuccess) {
      defender.stats.stamina -= 15; // Stamina cost for blocking
      const damageReduction = 0.75; // 75% damage reduction
      
      // Calculate original potential damage to show how much was blocked
      let potentialDamage = Math.floor(attacker.stats.strength * (0.75 + (Math.random() * 0.5)));
      let blockedDamage = Math.floor(potentialDamage * damageReduction);
      let finalDamage = potentialDamage - blockedDamage;
      defender.stats.health = Math.max(0, defender.stats.health - finalDamage);
      
      // Track consecutive block
      this.updateConsecutiveStats(defender, 'block');
      
      return {
        type: 'block',
        attacker: attacker,
        target: defender,
        hit: true,
        damage: finalDamage,
        message: `🛡️ ${defender.stats.name} blocks the attack, taking only ${finalDamage} damage!`
      };
    }
    
    // Dodge check based on defender's agility
    // AGI provides a 0.8% chance to dodge per point.
    const dodgeChance = defender.stats.agility * 0.008;
    const dodgeRoll = Math.random();
    const dodgeSuccess = dodgeRoll < dodgeChance;
    
    // Show debug indicator for dodge calculation (guarded)
    if (defender.scene && typeof defender.scene.showDodgeChanceIndicator === 'function') {
      defender.scene.showDodgeChanceIndicator(defender, dodgeChance, true, dodgeSuccess);
    }
    
    if (dodgeSuccess) {
      // Track consecutive dodge
      this.updateConsecutiveStats(defender, 'evade');
      
      return {
        type: 'dodge',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        message: `💨 ${defender.stats.name} dodges!`,
        dodgedAction: 'attack'
      };
    }
    
    // Base accuracy
    let accuracy = 0.75;
    
    // Adrenaline rush DISABLED for faster combat
    // if (attacker.specialMoves.active.adrenalineRush) {
    //   accuracy *= this.specialMoves.adrenalineRush.multiplier;
    // }
    
    // Weapon accuracy modifiers
    switch (attacker.weaponType) {
      case 'hammer':
        accuracy -= 0.15; // Hammers are slower but hit harder
        break;
      case 'axe':
        accuracy -= 0.10; // Axes are heavy and unwieldy
        break;
      case 'dagger':
        accuracy += 0.10; // Daggers are fast and precise
        break;
      case 'spear':
        accuracy += 0.05; // Spears have good reach and balance
        break;
      case 'staff':
        accuracy -= 0.05; // Staves are more defensive weapons
        break;
      case 'sword':
        // Swords have no accuracy modifier (balanced weapon)
        break;
      case 'bow':
        accuracy += 0.15; // Bows are ranged and precise
        break;
      case 'mace':
        accuracy -= 0.12; // Maces are heavy and cumbersome
        break;
      case 'whip':
        accuracy += 0.08; // Whips have good reach but require skill
        break;
      case 'trident':
        accuracy += 0.07; // Tridents have excellent reach and control
        break;
      case 'katana':
        accuracy += 0.12; // Katanas are expertly crafted for precision
        break;
      case 'flail':
        accuracy -= 0.18; // Flails are unpredictable and hard to control
        break;
    }
    
    // RNG hit check
    const hit = Math.random() < accuracy;
    
    if (!hit) {
      return {
        type: 'attack',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        message: `${attacker.stats.name} misses!`
      };
    }
    
    // Calculate damage
    let baseDamage = attacker.stats.strength;
    
    // Apply weapon damage modifier
    if (attacker.hasWeapon && attacker.weaponType) {
      const weaponModifier = getWeaponDamageModifier(attacker.weaponType, attacker.stats);
      baseDamage *= weaponModifier;
    } else {
      // No weapon - small boost for fists
      baseDamage *= 1.05;
    }
    
    // Berserker rage DISABLED for faster combat
    // if (attacker.specialMoves.active.berserkerRage) {
    //   baseDamage *= this.specialMoves.berserkerRage.multiplier;
    // }
    
    // RNG damage variation (±25%)
    const damageVariation = 0.75 + (Math.random() * 0.5);
    let finalDamage = Math.floor(baseDamage * damageVariation * damageModifier);
    
    // Apply defense
    let effectiveDefense = defender.stats.defense;
    
    // Defensive shield DISABLED for faster combat
    // if (defender.specialMoves.active.defensiveShield) {
    //   finalDamage *= this.specialMoves.defensiveShield.multiplier;
    // }
    
    finalDamage = Math.max(1, finalDamage - effectiveDefense);
    
    // Weapon-specific critical hit chances
    let criticalChance = 0.10; // Base 10% chance
    
    if (attacker.hasWeapon && attacker.weaponType && weaponStats[attacker.weaponType]) {
      criticalChance = weaponStats[attacker.weaponType].critChance || 0.10;
    }
    
    const critical = Math.random() < criticalChance;
    if (critical) {
      finalDamage *= 2;
    }
    
    // Vampiric healing DISABLED for faster combat
    // if (attacker.specialMoves.active.vampiricStrike) {
    //   const healing = Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier);
    //   attacker.stats.health = Math.min(attacker.stats.maxHealth, attacker.stats.health + healing);
    // }
    
    // Apply damage (special handling for backups)
    if (defender.isBackup) {
      this.handleBackupDamage(defender, finalDamage);
    } else {
      defender.stats.health = Math.max(0, defender.stats.health - finalDamage);
    }
    
    // Vampirism skill effect
    if (attacker.stats.skills && attacker.stats.skills.includes('vampirism')) {
      const vampHeal = Math.floor(finalDamage * 0.3); // 30% lifesteal
      attacker.stats.health = Math.min(attacker.stats.health + vampHeal, attacker.stats.maxHealth);
      console.log(`${attacker.stats.name} drains ${vampHeal} HP! (Vampirism)`);
      this.addCombatStep('skill_activate', {
        fighter: attacker.stats.name,
        skill: 'vampirism',
        healAmount: vampHeal,
        newHealth: attacker.stats.health
      });
    }
    
    // Check for combo
    let comboHits = 0;
    let comboMessage = '';
    if (this.lastAttacker === attacker && hit) {
      // Base combo chance from stats
      const comboChance = (attacker.stats.combo || 0) * 0.15; // 15% per combo point
      
      if (Math.random() < comboChance) {
        // Determine combo length (3-5 hits)
        const maxCombo = Math.min(5, 3 + Math.floor((attacker.stats.combo || 0) / 2));
        comboHits = Math.floor(Math.random() * (maxCombo - 2)) + 3; // 3 to maxCombo hits
        
        // Execute combo hits
        let totalComboDamage = 0;
        for (let i = 0; i < comboHits - 1; i++) { // -1 because first hit already done
          const comboMultiplier = 0.6 + (i * 0.1); // Each hit gets stronger
          const comboDamage = Math.floor(finalDamage * comboMultiplier);
          totalComboDamage += comboDamage;
          defender.stats.health = Math.max(0, defender.stats.health - comboDamage);
        }
        
        comboMessage = ` COMBO x${comboHits}! (+${totalComboDamage} damage)`;
        this.comboCounter[attacker.stats.name] = comboHits;
      }
    }
    
    // Track last attacker for combo chains
    this.lastAttacker = attacker;
    
    // Reset defender's consecutive defensive stats when hit
    this.updateConsecutiveStats(defender, 'hit');
    
    const critText = critical ? ' CRITICAL HIT!' : '';
    const rageText = attacker.specialMoves.active.berserkerRage ? ' [RAGE]' : '';
    const shieldText = defender.specialMoves.active.defensiveShield ? ' [SHIELDED]' : '';
    const lifeStealText = attacker.specialMoves.active.vampiricStrike ? ` +${Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier)} HP` : '';
    const comboText = comboMessage;
    
    const result = {
      type: 'attack',
      attacker: attacker,
      target: defender,
      hit: true,
      damage: finalDamage,
      critical: critical,
      message: `${attacker.stats.name} hits for ${finalDamage} damage${critText}${rageText}${shieldText}${lifeStealText}${comboText}`,
      combo: comboHits > 0 ? comboHits : undefined
    };
    
    // SAFETY CHECK: Validate hit detection consistency
    return this.validateCombatResult(result);
  }
  
  // Check for skill-based abilities
  checkSkillAbilities(fighter, opponent) {
    const skills = fighter.stats.skills || [];
    
    // Haste - chance for extra attack
    if (skills.includes('haste') && Math.random() < 0.15) {
      console.log(`${fighter.stats.name} moves with incredible speed! (Haste)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'haste',
        effect: 'extra_turn'
      });
      return 'extra_turn';
    }
    
    // Treat - healing ability
    if (skills.includes('treat') && fighter.stats.health < fighter.stats.maxHealth * 0.5 && Math.random() < 0.2) {
      const healAmount = Math.floor(fighter.stats.maxHealth * 0.15);
      fighter.stats.health = Math.min(fighter.stats.health + healAmount, fighter.stats.maxHealth);
      console.log(`${fighter.stats.name} heals for ${healAmount} HP! (Treat)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'treat',
        healAmount: healAmount,
        newHealth: fighter.stats.health
      });
      return 'treated';
    }
    
    // Fast Metabolism - passive regen
    if (skills.includes('fastMetabolism') && Math.random() < 0.3) {
      const regenAmount = Math.floor(fighter.stats.maxHealth * 0.05);
      fighter.stats.health = Math.min(fighter.stats.health + regenAmount, fighter.stats.maxHealth);
      console.log(`${fighter.stats.name} regenerates ${regenAmount} HP! (Fast Metabolism)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'fastMetabolism',
        healAmount: regenAmount,
        newHealth: fighter.stats.health
      });
    }
    
    // Hideaway - temporary evasion boost
    if (skills.includes('hideaway') && fighter.stats.health < fighter.stats.maxHealth * 0.3 && Math.random() < 0.25) {
      fighter.temporaryEvasion = (fighter.temporaryEvasion || 0) + 0.5;
      console.log(`${fighter.stats.name} hides in the shadows! (Hideaway)`);
      this.addCombatStep('skill_activate', { 
        fighter: fighter.stats.name, 
        skill: 'hideaway',
        effect: 'evasion_boost'
      });
      setTimeout(() => {
        fighter.temporaryEvasion = 0;
      }, 3000);
    }
    
    return null;
  }

  executeSpecialMove(attacker, defender) {
    // Higher stamina cost for special moves
    attacker.stats.stamina -= 40;
    
    // Select random unlocked special move
    const randomMove = attacker.specialMoves.unlocked[Math.floor(Math.random() * attacker.specialMoves.unlocked.length)];
    const moveData = this.specialMoves[randomMove];
    
    // Activate the special move
    attacker.specialMoves.active[randomMove] = moveData.duration;
    
    // Special move specific effects
    if (randomMove === 'adrenalineRush') {
      attacker.stats.stamina = attacker.stats.maxStamina;
    }
    
    return {
      type: 'special',
      attacker: attacker,
      target: defender,
      specialMove: moveData,
      message: `${attacker.stats.name} activates ${moveData.name}! ${moveData.description}`
    };
  }
  
  tryUnlockSpecialMove(fighter) {
    // Skip if fighter has all special moves
    const availableMoves = Object.keys(this.specialMoves).filter(move => 
      !fighter.specialMoves.unlocked.includes(move)
    );
    
    if (availableMoves.length === 0) return null;
    
    // Check each available move for unlock
    for (const moveKey of availableMoves) {
      const move = this.specialMoves[moveKey];
      if (Math.random() < move.unlockChance) {
        fighter.specialMoves.unlocked.push(moveKey);
        return move;
      }
    }
    
    return null;
  }
  
  processSpecialMoveEffects(fighter) {
    // Decrease duration of active special moves
    Object.keys(fighter.specialMoves.active).forEach(moveKey => {
      fighter.specialMoves.active[moveKey]--;
      
      if (fighter.specialMoves.active[moveKey] <= 0) {
        delete fighter.specialMoves.active[moveKey];
      }
    });
  }
  executeWeaponThrow(attacker, defender) {
    // Record this turn as having a weapon throw
    this.lastWeaponThrowTurn = this.currentTurn;
    
    // Stamina cost for weapon throw
    attacker.stats.stamina -= 35;
    
    // Base accuracy for thrown weapons (higher than normal due to surprise)
    let accuracy = 0.85;
    
    // Adrenaline rush DISABLED for faster combat
    // if (attacker.specialMoves.active.adrenalineRush) {
    //   accuracy *= this.specialMoves.adrenalineRush.multiplier;
    // }
    
    // Defender can try to dodge the throw
    const dodgeChance = defender.stats.agility * 0.006; // Lower dodge chance vs throws
    const dodgeRoll = Math.random();
    const dodgeSuccess = dodgeRoll < dodgeChance;
    
    // Show debug indicator for weapon throw dodge calculation (guarded)
    if (defender.scene && typeof defender.scene.showDodgeChanceIndicator === 'function') {
      defender.scene.showDodgeChanceIndicator(defender, dodgeChance, true, dodgeSuccess);
    }
    
    if (dodgeSuccess) {
      attacker.hasWeapon = false; // Weapon is still lost
      
      // Track consecutive dodge
      this.updateConsecutiveStats(defender, 'evade');
      
      return {
        type: 'dodge',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        weaponLost: true,
        message: `💨 ${defender.stats.name} dodges the ${attacker.weaponType}!`,
        dodgedAction: 'throw'
      };
    }
    
    // Weapon type affects throw accuracy
    switch (attacker.weaponType) {
      case 'dagger':
        accuracy += 0.10; // Daggers are easier to throw accurately
        break;
      case 'spear':
        accuracy += 0.05; // Spears are designed for throwing
        break;
      case 'hammer':
        accuracy -= 0.20; // Hammers are hard to throw accurately
        break;
      case 'axe':
        accuracy -= 0.10; // Axes are somewhat unwieldy when thrown
        break;
    }
    
    // RNG hit check
    const hit = Math.random() < accuracy;
    
    if (!hit) {
      // Weapon is still thrown and lost even on miss
      attacker.hasWeapon = false;
      
      return {
        type: 'throw',
        attacker: attacker,
        target: defender,
        hit: false,
        damage: 0,
        weaponLost: true,
        message: `${attacker.stats.name} throws and misses! ${attacker.weaponType} lost!`
      };
    }
    
    // Calculate throw damage (higher than normal attack due to momentum)
    let baseDamage = attacker.stats.strength * 1.4; // Throwing bonus
    
    // Weapon-specific throw damage modifiers
    switch (attacker.weaponType) {
      case 'hammer':
        baseDamage *= 1.5; // Heavy weapons hit very hard when thrown
        break;
      case 'axe':
        baseDamage *= 1.4; // Axes are devastating when thrown
        break;
      case 'spear':
        baseDamage *= 1.3; // Spears are designed for throwing
        break;
      case 'sword':
        baseDamage *= 1.2; // Swords aren't ideal for throwing
        break;
      case 'dagger':
        baseDamage *= 1.1; // Daggers are light but precise
        break;
    }
    
    // Berserker rage DISABLED for faster combat
    // if (attacker.specialMoves.active.berserkerRage) {
    //   baseDamage *= this.specialMoves.berserkerRage.multiplier;
    // }
    
    // RNG damage variation
    const damageVariation = 0.8 + (Math.random() * 0.4); // Less variation for throws
    let finalDamage = Math.floor(baseDamage * damageVariation);
    
    // Apply defense (reduced effectiveness against thrown weapons)
    let effectiveDefense = Math.floor(defender.stats.defense * 0.7);
    
    // Defensive shield DISABLED for faster combat
    // if (defender.specialMoves.active.defensiveShield) {
    //   finalDamage *= this.specialMoves.defensiveShield.multiplier;
    // }
    
    finalDamage = Math.max(2, finalDamage - effectiveDefense); // Minimum 2 damage for throws
    
    // Higher critical hit chance for throws (15%)
    const critical = Math.random() < 0.15;
    if (critical) {
      finalDamage *= 2.2; // Slightly higher crit multiplier
    }
    
    // Vampiric healing (if active)
    if (attacker.specialMoves.active.vampiricStrike) {
      const healing = Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier);
      attacker.stats.health = Math.min(attacker.stats.maxHealth, attacker.stats.health + healing);
    }
    
    // Apply damage
    defender.stats.health = Math.max(0, defender.stats.health - finalDamage);
    
    // Weapon is lost after throwing
    attacker.hasWeapon = false;
    
    // Track consecutive throws
    this.updateConsecutiveStats(attacker, 'throw');
    this.updateConsecutiveStats(defender, 'hit'); // Reset defender's defensive stats
    
    const critText = critical ? ' CRITICAL THROW!' : '';
    const rageText = attacker.specialMoves.active.berserkerRage ? ' [RAGE]' : '';
    const shieldText = defender.specialMoves.active.defensiveShield ? ' [SHIELDED]' : '';
    const lifeStealText = attacker.specialMoves.active.vampiricStrike ? ` +${Math.floor(finalDamage * this.specialMoves.vampiricStrike.multiplier)} HP` : '';
    
    const result = {
      type: 'throw',
      attacker: attacker,
      target: defender,
      hit: true,
      damage: finalDamage,
      critical: critical,
      weaponLost: true,
      message: `${attacker.stats.name} hurls their ${attacker.weaponType} for ${finalDamage} damage!${critText}${rageText}${shieldText}${lifeStealText} Weapon is lost!`
    };
    
    // SAFETY CHECK: Validate hit detection consistency
    return this.validateCombatResult(result);
  }
  
  switchTurns() {
    // Passer au prochain joueur dans l'ordre d'initiative
    this.currentInitiativeIndex++;
    
    // Si on a fini un round complet (les 2 ont joué)
    if (this.currentInitiativeIndex >= this.initiativeOrder.length) {
      this.currentInitiativeIndex = 0;
      this.roundComplete = true;
      // Recalculer l'initiative pour le prochain round
      this.calculateInitiative();
    } else {
      // Passer au prochain dans l'ordre
      this.activePlayer = this.initiativeOrder[this.currentInitiativeIndex];
    }
    
    // SAFETY CHECK - ensure active player is valid
    if (!this.activePlayer || this.activePlayer.stats.health <= 0) {
      // Find a valid player
      if (this.fighter1.stats.health > 0) {
        this.activePlayer = this.fighter1;
      } else if (this.fighter2.stats.health > 0) {
        this.activePlayer = this.fighter2;
      }
    }
    
    // Reset combo if switching to different attacker
    const previousPlayer = this.activePlayer === this.fighter1 ? this.fighter2 : this.fighter1;
    if (this.lastAttacker !== this.activePlayer) {
      this.comboCounter[previousPlayer.stats.name] = 0;
    }
    
    // Incrémenter le tour
    this.currentTurn++;
  }
  
  // Validate that the given fighter is the active player
  isActivePlayer(fighter) {
    return this.activePlayer === fighter && !this.turnInProgress;
  }
  
  // Combat result validation system
  validateCombatResult(result) {
    // CRITICAL SAFETY CHECK: Ensure hit detection is consistent with damage dealt
    if (result.damage > 0 && !result.hit) {
      console.warn(`COMBAT VALIDATION ERROR: Damage dealt (${result.damage}) but hit=false. Correcting to hit=true`);
      result.hit = true;
      result.message += ' [HIT CORRECTED]';
    }
    
    // Ensure hit is false when no damage is dealt (for misses)
    if (result.damage === 0 && result.hit && result.type !== 'block' && result.type !== 'special') {
      console.warn(`COMBAT VALIDATION ERROR: No damage dealt (${result.damage}) but hit=true. Correcting to hit=false`);
      result.hit = false;
    }
    
    // Validate result structure integrity
    if (!result.attacker || !result.target) {
      console.error('COMBAT VALIDATION ERROR: Missing attacker or target in result');
      result.hit = false;
      result.damage = 0;
    }
    
    // Validate damage is never negative
    if (result.damage < 0) {
      console.warn(`COMBAT VALIDATION ERROR: Negative damage (${result.damage}). Setting to 0`);
      result.damage = 0;
      result.hit = false;
    }
    
    // Validate target health doesn't go negative (additional safety)
    if (result.target && result.target.stats && result.target.stats.health < 0) {
      console.warn('COMBAT VALIDATION ERROR: Target health went negative. Correcting to 0');
      result.target.stats.health = 0;
    }
    
    // Add validation timestamp for debugging
    result.validated = true;
    result.validationTime = Date.now();
    
    return result;
  }
  
  checkPreFightAchievements() {
    // Check brute achievements for both fighters
    const fighter1Achievements = this.achievementTracker.checkBruteAchievements(this.fighter1);
    const fighter2Achievements = this.achievementTracker.checkBruteAchievements(this.fighter2);
    
    // Process achievements (but don't show notifications during pre-fight)
    this.achievementTracker.processAchievements(fighter1Achievements);
    this.achievementTracker.processAchievements(fighter2Achievements);
  }
  
  trackCombatAction(result) {
    if (!result || !this.achievementTracker) return;
    
    const attacker = result.attacker;
    const defender = result.target;
    
    // Track based on action type
    switch (result.type) {
      case 'attack':
      case 'multi_attack':
        if (result.hit && result.damage > 0) {
          this.achievementTracker.trackHit(result.damage, result.combo, result.combo || 0);
        }
        break;
        
      case 'throw':
        this.achievementTracker.trackWeaponThrow();
        if (result.hit && result.damage > 0) {
          this.achievementTracker.trackHit(result.damage);
        }
        break;
        
      case 'block':
        this.achievementTracker.trackDefense('block');
        break;
        
      case 'dodge':
        this.achievementTracker.trackDefense('evade');
        break;
        
      case 'counter':
        this.achievementTracker.trackDefense('counter');
        if (result.damage > 0) {
          this.achievementTracker.trackHit(result.damage);
        }
        break;
        
      case 'steal':
        this.achievementTracker.trackWeaponSteal();
        break;
        
      case 'special':
        this.achievementTracker.trackSkillUse();
        break;
    }
    
    // Track damage taken for flawless victory
    if (defender && result.damage > 0 && result.hit) {
      // If defender is fighter1, they took damage
      if (defender === this.fighter1) {
        this.achievementTracker.trackDamageTaken();
      }
    }
    
    // Track healing
    if (result.healing > 0) {
      this.achievementTracker.trackHealing(result.healing);
    }
    
    // Track pet kills
    if (result.petKilled) {
      this.achievementTracker.trackPetKill();
    }
  }
  
  checkGameOver() {
    const fighter1Dead = this.fighter1.stats.health <= 0;
    const fighter2Dead = this.fighter2.stats.health <= 0;
    
    if (fighter1Dead || fighter2Dead) {
      const winner = fighter1Dead ? this.fighter2 : this.fighter1;
      const loser = fighter1Dead ? this.fighter1 : this.fighter2;
      
      // Check post-fight achievements
      const fightAchievements = this.achievementTracker.checkFightAchievements(
        winner === this.fighter1 ? winner : null,
        loser
      );
      
      // Process and get newly unlocked achievements
      const newAchievements = this.achievementTracker.processAchievements(fightAchievements);
      
      return {
        gameOver: true,
        winner: winner,
        loser: loser,
        achievements: newAchievements
      };
    }
    
    return null;
  }
  
  initializeBackups() {
    // Check if fighters have backup skill
    [this.fighter1, this.fighter2].forEach(fighter => {
      if (fighter.skill === 'backup') {
        // Create a potential backup brute
        const backup = this.createBackupBrute(fighter);
        if (backup) {
          this.backupBrutes[fighter.stats.name] = backup;
        }
      }
    });
  }
  
  createBackupBrute(master) {
    // In a real implementation, this would fetch from user's other brutes
    // For now, create a simulated backup brute
    const backup = {
      stats: {
        name: `${master.stats.name}'s Backup`,
        health: 60,
        maxHealth: 60,
        stamina: 80,
        maxStamina: 80,
        strength: master.stats.strength * 0.7,
        defense: master.stats.defense * 0.7,
        agility: master.stats.agility * 0.7,
        speed: master.stats.speed * 0.7,
        level: Math.max(1, (master.stats.level || 10) - 3) // Lower level than master
      },
      master: master,
      isBackup: true,
      arrivesAtTurn: Math.floor(Math.random() * 5) + 3, // Arrives turn 3-7
      leavesAtTurn: null, // Will be set when arrives
      remainingTime: 2.8, // Stays for 2.8 "seconds" worth of turns
      side: master.side,
      hasWeapon: false,
      weaponType: null,
      skill: null
    };
    
    return backup;
  }
  
  checkBackupArrival() {
    // Check if any backups should arrive this turn
    Object.entries(this.backupBrutes).forEach(([masterName, backup]) => {
      if (backup && !backup.active && this.currentTurn === backup.arrivesAtTurn) {
        // Check if master is still alive
        const master = masterName === this.fighter1.stats.name ? this.fighter1 : this.fighter2;
        if (master.stats.health > 0) {
          this.activateBackup(backup);
        }
      }
    });
    
    // Check if any active backups should leave
    this.activeBackups = this.activeBackups.filter(backup => {
      if (backup.remainingTime <= 0) {
        this.deactivateBackup(backup);
        return false;
      }
      return true;
    });
  }
  
  activateBackup(backup) {
    backup.active = true;
    backup.leavesAtTurn = this.currentTurn + Math.ceil(backup.remainingTime);
    this.activeBackups.push(backup);
    
    // Add combat step
    this.addCombatStep('backup_arrive', { 
      backup: backup.stats.name,
      master: backup.master.stats.name 
    });
    
    console.log(`💫 ${backup.stats.name} arrives to help!`);
  }
  
  deactivateBackup(backup) {
    backup.active = false;
    
    // Add combat step
    this.addCombatStep('backup_leave', { 
      backup: backup.stats.name 
    });
    
    console.log(`👋 ${backup.stats.name} leaves the battlefield!`);
  }
  
  handleBackupDamage(backup, damage) {
    // Instead of taking HP damage, reduce remaining time
    const timeReduction = damage * 0.05; // 5% per damage point
    backup.remainingTime = Math.max(0, backup.remainingTime - timeReduction);
    
    console.log(`⏱️ ${backup.stats.name} time reduced by ${timeReduction.toFixed(2)} (${damage} damage)`);
  }
  
  getRandomTarget(attacker) {
    // Get all valid targets including active backups
    const targets = [];
    
    // Add main fighters
    if (attacker !== this.fighter1 && attacker.master !== this.fighter1 && this.fighter1.stats.health > 0) {
      targets.push(this.fighter1);
    }
    if (attacker !== this.fighter2 && attacker.master !== this.fighter2 && this.fighter2.stats.health > 0) {
      targets.push(this.fighter2);
    }
    
    // Add active backups from opposing team
    this.activeBackups.forEach(backup => {
      if (backup.master.side !== attacker.side && backup.active) {
        targets.push(backup);
      }
    });
    
    // Return random target or null if none available
    return targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null;
  }
  
  executeBackupActions() {
    // Give each active backup a chance to act (25% per turn)
    for (const backup of this.activeBackups) {
      if (Math.random() < 0.25) {
        const target = this.getRandomTarget(backup);
        if (target) {
          // Backup performs a simple attack
          const damage = Math.floor(backup.stats.strength * 0.8 + Math.random() * 10);
          
          if (target.isBackup) {
            this.handleBackupDamage(target, damage);
          } else {
            target.stats.health = Math.max(0, target.stats.health - damage);
          }
          
          // Add combat step
          this.addCombatStep('backup_attack', {
            attacker: backup.stats.name,
            target: target.stats.name,
            damage: damage
          });
          
          return {
            type: 'backup_attack',
            attacker: backup,
            target: target,
            hit: true,
            damage: damage,
            message: `⚔️ ${backup.stats.name} strikes ${target.stats.name} for ${damage} damage!`
          };
        }
      }
    }
    
    return null;
  }
}