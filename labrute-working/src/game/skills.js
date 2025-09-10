export const SkillName = {
  herculeanStrength: 'herculeanStrength',
  felineAgility: 'felineAgility',
  lightningBolt: 'lightningBolt',
  vitality: 'vitality',
  immortality: 'immortality',
  weaponMaster: 'weaponMaster',
  martialArts: 'martialArts',
  sixthSense: 'sixthSense',
  hostility: 'hostility',
  fistsOfFury: 'fistsOfFury',
  shield: 'shield',
  armor: 'armor',
  toughenedSkin: 'toughenedSkin',
  untouchable: 'untouchable',
  sabotage: 'sabotage',
  shock: 'shock',
  bodybuilder: 'bodybuilder',
  relentless: 'relentless',
  survival: 'survival',
  leadSkeleton: 'leadSkeleton',
  balletShoes: 'balletShoes',
  determination: 'determination',
  firstStrike: 'firstStrike',
  resistant: 'resistant',
  reconnaissance: 'reconnaissance',
  counterAttack: 'counterAttack',
  ironHead: 'ironHead',
  thief: 'thief',
  fierceBrute: 'fierceBrute',
  tragicPotion: 'tragicPotion',
  net: 'net',
  bomb: 'bomb',
  hammer: 'hammer',
  cryOfTheDamned: 'cryOfTheDamned',
  hypnosis: 'hypnosis',
  flashFlood: 'flashFlood',
  tamer: 'tamer',
  regeneration: 'regeneration',
  chef: 'chef',
  spy: 'spy',
  saboteur: 'saboteur',
  strongWill: 'strongWill',
  potion: 'potion',
  repulse: 'repulse',
  trickster: 'trickster',
  backup: 'backup',
  hideaway: 'hideaway',
  monk: 'monk',
  vampirism: 'vampirism',
  chaining: 'chaining',
  haste: 'haste',
  treat: 'treat',
  fastMetabolism: 'fastMetabolism',
};

export const FightStat = {
  REVERSAL: 'reversal',
  EVASION: 'evasion',
  DEXTERITY: 'dexterity',
  BLOCK: 'block',
  ACCURACY: 'accuracy',
  DISARM: 'disarm',
  COMBO: 'combo',
  DEFLECT: 'deflect',
  TEMPO: 'tempo',
  COUNTER: 'counter',
  ENDURANCE: 'endurance',
  STRENGTH: 'strength',
  AGILITY: 'agility',
  SPEED: 'speed',
  INITIATIVE: 'initiative',
};

export const SkillModifiers = {
  [SkillName.herculeanStrength]: {
    [FightStat.STRENGTH]: { percent: 0.5, flat: 3 },
    [FightStat.DEXTERITY]: { percent: -0.3 },
  },
  [SkillName.felineAgility]: {
    [FightStat.AGILITY]: { percent: 0.5, flat: 3 },
    [FightStat.ACCURACY]: { percent: -0.3 },
  },
  [SkillName.lightningBolt]: {
    [FightStat.SPEED]: { percent: 0.5, flat: 3 },
    [FightStat.INITIATIVE]: { flat: -0.3 },
  },
  [SkillName.vitality]: {
    [FightStat.ENDURANCE]: { percent: 0.5, flat: 3 },
    [FightStat.STRENGTH]: { percent: -0.3 },
  },
  [SkillName.immortality]: {
    [FightStat.ENDURANCE]: { flat: 250 },
    [FightStat.STRENGTH]: { flat: -8 },
    [FightStat.AGILITY]: { flat: -8 },
    [FightStat.SPEED]: { flat: -8 },
  },
  [SkillName.weaponMaster]: {
    [FightStat.DEXTERITY]: { percent: 0.5 },
    [FightStat.ACCURACY]: { percent: 0.1 },
  },
  [SkillName.martialArts]: {
    [FightStat.COUNTER]: { percent: 1 },
    [FightStat.COMBO]: { percent: 0.5 },
    [FightStat.BLOCK]: { percent: -0.2 },
  },
  [SkillName.sixthSense]: {
    [FightStat.COUNTER]: { percent: 0.5 },
    [FightStat.BLOCK]: { percent: 0.25 },
    [FightStat.EVASION]: { percent: 0.1 },
  },
  [SkillName.hostility]: {
    [FightStat.REVERSAL]: { percent: 0.5 },
    [FightStat.COUNTER]: { percent: 0.3 },
  },
  [SkillName.fistsOfFury]: {
    [FightStat.COMBO]: { percent: 0.5 },
    [FightStat.DEXTERITY]: { percent: 0.2 },
  },
  [SkillName.shield]: {
    [FightStat.BLOCK]: { percent: 0.45 },
  },
  [SkillName.armor]: {
    [FightStat.BLOCK]: { percent: 0.3 },
    [FightStat.SPEED]: { flat: -2 },
  },
  [SkillName.toughenedSkin]: {
    [FightStat.BLOCK]: { percent: 0.15 },
  },
  [SkillName.untouchable]: {
    [FightStat.EVASION]: { percent: 0.5 },
  },
  [SkillName.sabotage]: {
    [FightStat.DISARM]: { percent: 2.5 },
  },
  [SkillName.shock]: {
    [FightStat.DISARM]: { percent: 0.5 },
    [FightStat.INITIATIVE]: { flat: -0.1 },
  },
  [SkillName.bodybuilder]: {
    [FightStat.STRENGTH]: { flat: 3 },
    [FightStat.ENDURANCE]: { flat: 3 },
    [FightStat.AGILITY]: { flat: 3 },
    [FightStat.SPEED]: { flat: 3 },
  },
  [SkillName.relentless]: {
    [FightStat.ENDURANCE]: { flat: 4 },
    [FightStat.ACCURACY]: { percent: -0.3 },
  },
  [SkillName.survival]: {
    [FightStat.ENDURANCE]: { flat: 11 },
  },
  [SkillName.leadSkeleton]: {
    [FightStat.ENDURANCE]: { flat: 5 },
    [FightStat.SPEED]: { flat: -1 },
  },
  [SkillName.balletShoes]: {
    [FightStat.EVASION]: { percent: 0.18 },
    [FightStat.DEXTERITY]: { percent: 0.18 },
  },
  [SkillName.determination]: {
    [FightStat.ENDURANCE]: { flat: 2 },
    [FightStat.STRENGTH]: { flat: 2 },
    [FightStat.AGILITY]: { flat: 2 },
    [FightStat.SPEED]: { flat: 2 },
  },
  [SkillName.firstStrike]: {
    [FightStat.INITIATIVE]: { flat: 2 },
  },
  [SkillName.resistant]: {
    [FightStat.SPEED]: { flat: 4 },
  },
  [SkillName.reconnaissance]: {
    [FightStat.SPEED]: { flat: 5 },
    [FightStat.INITIATIVE]: { flat: 0.4 },
    [FightStat.STRENGTH]: { flat: -2 },
  },
  [SkillName.counterAttack]: {
    [FightStat.COUNTER]: { percent: 0.9 },
    [FightStat.INITIATIVE]: { flat: -0.1 },
  },
  [SkillName.ironHead]: {
    [FightStat.BLOCK]: { percent: -0.5 },
    [FightStat.EVASION]: { percent: -0.5 },
    [FightStat.ACCURACY]: { percent: 0.3 },
  },
  [SkillName.thief]: {
    [FightStat.DISARM]: { percent: 0.5 },
    [FightStat.INITIATIVE]: { flat: 0.2 },
  },
  [SkillName.fierceBrute]: {
    [FightStat.STRENGTH]: { flat: 4 },
    [FightStat.BLOCK]: { percent: -0.3 },
  },
  [SkillName.tragicPotion]: {
    [FightStat.STRENGTH]: { flat: -1 },
    [FightStat.AGILITY]: { flat: -1 },
    [FightStat.SPEED]: { flat: -1 },
    [FightStat.ENDURANCE]: { flat: 5 },
    [FightStat.INITIATIVE]: { flat: 0.1 },
  },
  [SkillName.net]: {},
  [SkillName.bomb]: {},
  [SkillName.hammer]: {},
  [SkillName.cryOfTheDamned]: {},
  [SkillName.hypnosis]: {},
  [SkillName.flashFlood]: {},
  [SkillName.tamer]: {},
  [SkillName.regeneration]: {},
  [SkillName.chef]: {},
  [SkillName.spy]: {},
  [SkillName.saboteur]: {},
  [SkillName.strongWill]: {},
  [SkillName.potion]: {},
  [SkillName.repulse]: {},
  [SkillName.trickster]: {
    [FightStat.EVASION]: { percent: 0.2 },
    [FightStat.DEXTERITY]: { percent: 0.2 },
    [FightStat.COUNTER]: { percent: 0.2 },
  },
  [SkillName.backup]: {
    // Backup doesn't modify stats, it's handled in combat
  },
  [SkillName.hideaway]: {
    [FightStat.EVASION]: { percent: 0.25 },
    [FightStat.INITIATIVE]: { flat: -0.2 },
  },
  [SkillName.monk]: {
    [FightStat.COUNTER]: { percent: 0.4 },
    [FightStat.SPEED]: { flat: 6 },
    [FightStat.STRENGTH]: { flat: -4 },
  },
  [SkillName.vampirism]: {
    // Vampirism is handled in combat mechanics
    [FightStat.ENDURANCE]: { flat: -3 },
  },
  [SkillName.chaining]: {
    [FightStat.COMBO]: { percent: 0.3 },
    [FightStat.DEXTERITY]: { percent: 0.15 },
  },
  [SkillName.haste]: {
    [FightStat.SPEED]: { percent: 0.3 },
    [FightStat.INITIATIVE]: { flat: -0.4 },
  },
  [SkillName.treat]: {
    // Treat is a combat ability, no stat modifiers
  },
  [SkillName.fastMetabolism]: {
    [FightStat.ENDURANCE]: { flat: 2 },
    // Regeneration handled in combat
  },
};

export function applySkillModifiers(fighter, skill) {
  const modifiers = SkillModifiers[skill];
  if (!modifiers) return fighter;
  
  const updatedFighter = { ...fighter };
  
  Object.entries(modifiers).forEach(([stat, modifier]) => {
    switch(stat) {
      case FightStat.ENDURANCE:
        if (modifier.flat) updatedFighter.stats.maxHealth += modifier.flat * 2;
        if (modifier.percent) updatedFighter.stats.maxHealth *= (1 + modifier.percent);
        updatedFighter.stats.health = Math.min(updatedFighter.stats.health, updatedFighter.stats.maxHealth);
        break;
      case FightStat.STRENGTH:
        if (modifier.flat) updatedFighter.stats.strength += modifier.flat;
        if (modifier.percent) updatedFighter.stats.strength *= (1 + modifier.percent);
        break;
      case FightStat.AGILITY:
        if (modifier.flat) updatedFighter.stats.agility += modifier.flat;
        if (modifier.percent) updatedFighter.stats.agility *= (1 + modifier.percent);
        break;
      case FightStat.SPEED:
        if (modifier.flat) updatedFighter.stats.speed = (updatedFighter.stats.speed || 10) + modifier.flat;
        if (modifier.percent) updatedFighter.stats.speed = (updatedFighter.stats.speed || 10) * (1 + modifier.percent);
        break;
      case FightStat.COUNTER:
        if (!updatedFighter.stats.counter) updatedFighter.stats.counter = 0;
        if (modifier.flat) updatedFighter.stats.counter += modifier.flat;
        if (modifier.percent) updatedFighter.stats.counter += modifier.percent;
        break;
      case FightStat.COMBO:
        if (!updatedFighter.stats.combo) updatedFighter.stats.combo = 0;
        if (modifier.flat) updatedFighter.stats.combo += modifier.flat;
        if (modifier.percent) updatedFighter.stats.combo += modifier.percent;
        break;
      case FightStat.BLOCK:
        if (modifier.flat) updatedFighter.stats.defense += modifier.flat * 5;
        if (modifier.percent) updatedFighter.stats.blockChance = (updatedFighter.stats.blockChance || 0) + modifier.percent;
        break;
      case FightStat.EVASION:
        if (modifier.percent) updatedFighter.stats.evasionBonus = (updatedFighter.stats.evasionBonus || 0) + modifier.percent;
        break;
      case FightStat.ACCURACY:
        if (modifier.percent) updatedFighter.stats.accuracyBonus = (updatedFighter.stats.accuracyBonus || 0) + modifier.percent;
        break;
      case FightStat.DISARM:
        if (modifier.percent) updatedFighter.stats.disarmChance = (updatedFighter.stats.disarmChance || 0) + modifier.percent;
        break;
      case FightStat.INITIATIVE:
        if (modifier.flat) updatedFighter.stats.initiative = (updatedFighter.stats.initiative || 0) + modifier.flat;
        break;
      case FightStat.DEXTERITY:
        if (modifier.percent) updatedFighter.stats.dexterityBonus = (updatedFighter.stats.dexterityBonus || 0) + modifier.percent;
        break;
      case FightStat.REVERSAL:
        if (modifier.percent) updatedFighter.stats.reversalChance = (updatedFighter.stats.reversalChance || 0) + modifier.percent;
        break;
    }
  });
  
  // Ensure stats don't go below minimum values
  updatedFighter.stats.strength = Math.max(1, Math.floor(updatedFighter.stats.strength));
  updatedFighter.stats.agility = Math.max(0, Math.floor(updatedFighter.stats.agility));
  updatedFighter.stats.defense = Math.max(0, Math.floor(updatedFighter.stats.defense));
  updatedFighter.stats.health = Math.max(1, Math.floor(updatedFighter.stats.health));
  updatedFighter.stats.maxHealth = Math.max(1, Math.floor(updatedFighter.stats.maxHealth));
  
  return updatedFighter;
}

export function getRandomSkill(excludeSkills = []) {
  const availableSkills = Object.keys(SkillName).filter(skill => !excludeSkills.includes(skill));
  const randomIndex = Math.floor(Math.random() * availableSkills.length);
  return SkillName[availableSkills[randomIndex]];
}

export const skillDescriptions = {
  [SkillName.herculeanStrength]: "Massive strength boost (+50% STR, +3 flat)",
  [SkillName.felineAgility]: "Enhanced agility (+50% AGI, +3 flat)",
  [SkillName.lightningBolt]: "Lightning speed (+50% SPD, +3 flat)",
  [SkillName.vitality]: "Increased health (+50% END, +3 flat)",
  [SkillName.immortality]: "Massive health boost (+250 HP) but weakens other stats",
  [SkillName.weaponMaster]: "Better weapon handling (+50% dexterity)",
  [SkillName.martialArts]: "Master of combos and counters",
  [SkillName.sixthSense]: "Enhanced defensive awareness",
  [SkillName.hostility]: "Increased aggression and reversals",
  [SkillName.fistsOfFury]: "Combo specialist",
  [SkillName.shield]: "Strong blocking ability (+45%)",
  [SkillName.armor]: "Good protection but slower",
  [SkillName.toughenedSkin]: "Natural armor (+15% block)",
  [SkillName.untouchable]: "Hard to hit (+50% evasion)",
  [SkillName.sabotage]: "Master of disarming",
  [SkillName.shock]: "Disarms and stuns enemies",
  [SkillName.bodybuilder]: "All stats increased (+3 each)",
  [SkillName.relentless]: "Never gives up (+4 END)",
  [SkillName.survival]: "Built to last (+11 END)",
  [SkillName.leadSkeleton]: "Heavy but durable",
  [SkillName.balletShoes]: "Graceful dodger",
  [SkillName.determination]: "Well-rounded fighter (+2 all)",
  [SkillName.firstStrike]: "Always attacks first",
  [SkillName.resistant]: "Fast recovery (+4 SPD)",
  [SkillName.reconnaissance]: "Scout: fast but weaker",
  [SkillName.counterAttack]: "Counter specialist (+90%)",
  [SkillName.ironHead]: "Can't dodge but always hits",
  [SkillName.thief]: "Steals weapons easily",
  [SkillName.fierceBrute]: "Strong but can't block well",
  [SkillName.tragicPotion]: "Mixed blessing: tough but weak",
  [SkillName.trickster]: "Unpredictable fighter",
  [SkillName.backup]: "Can call backup brutes to help in combat",
  [SkillName.hideaway]: "Can hide during combat (+25% evasion)",
  [SkillName.monk]: "Martial arts master (+40% counter, +6 speed)",
  [SkillName.vampirism]: "Heals by dealing damage",
  [SkillName.chaining]: "Chain attacks together (+30% combo)",
  [SkillName.haste]: "Super fast attacks (+30% speed)",
  [SkillName.treat]: "Can heal during combat",
  [SkillName.fastMetabolism]: "Regenerates health each turn",
};