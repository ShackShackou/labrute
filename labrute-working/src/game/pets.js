export const PetName = {
  bear: 'bear',
  panther: 'panther',
  dog1: 'dog1',
  dog2: 'dog2',
  dog3: 'dog3',
};

export const pets = [
  {
    name: PetName.bear,
    displayName: 'Bear',
    enduranceMalus: 8,
    initiative: 3.9,
    strength: 40,
    agility: 2,
    speed: 1,
    counter: 0,
    combo: 0,
    block: 0,
    evasion: -0.3,
    accuracy: 0.5,
    disarm: 0,
    damage: 5,
    hp: 110,
    reach: 1,
    scale: 1.5,
    assistChance: 0.3,
    ability: 'maul',
    description: 'A powerful bear companion that can maul enemies with devastating force'
  },
  {
    name: PetName.panther,
    displayName: 'Panther',
    enduranceMalus: 4,
    initiative: 0.6,
    strength: 23,
    agility: 16,
    speed: 24,
    counter: 0,
    combo: -0.2,
    block: 0,
    evasion: 0.1,
    accuracy: 0.5,
    disarm: 0,
    damage: 3,
    hp: 26,
    reach: 1,
    scale: 1.2,
    assistChance: 0.4,
    ability: 'pounce',
    description: 'An agile panther that strikes with speed and precision'
  },
  {
    name: PetName.dog1,
    displayName: 'Wolf',
    enduranceMalus: 1,
    initiative: -0.3,
    strength: 8,
    agility: 5,
    speed: 8,
    counter: 0,
    combo: 0,
    block: 0,
    evasion: 0,
    accuracy: 0.5,
    disarm: 0,
    damage: 2,
    hp: 12,
    reach: 1,
    scale: 0.8,
    assistChance: 0.5,
    ability: 'bite',
    description: 'A loyal wolf companion that fights alongside its master'
  },
  {
    name: PetName.dog2,
    displayName: 'Hound',
    enduranceMalus: 1,
    initiative: -0.3,
    strength: 10,
    agility: 4,
    speed: 10,
    counter: 0,
    combo: 0,
    block: 0,
    evasion: 0,
    accuracy: 0.5,
    disarm: 0,
    damage: 2,
    hp: 14,
    reach: 1,
    scale: 0.9,
    assistChance: 0.45,
    ability: 'bite',
    description: 'A fierce hound that tracks and attacks enemies'
  },
  {
    name: PetName.dog3,
    displayName: 'Mastiff',
    enduranceMalus: 2,
    initiative: -0.3,
    strength: 12,
    agility: 3,
    speed: 6,
    counter: 0,
    combo: 0,
    block: 0,
    evasion: -0.1,
    accuracy: 0.5,
    disarm: 0,
    damage: 3,
    hp: 18,
    reach: 1,
    scale: 1.0,
    assistChance: 0.4,
    ability: 'guard',
    description: 'A protective mastiff that guards its master from harm'
  },
];

export class Pet {
  constructor(petData, owner) {
    this.name = petData.displayName;
    this.type = petData.name;
    this.owner = owner;
    this.stats = {
      hp: petData.hp,
      maxHp: petData.hp,
      strength: petData.strength,
      agility: petData.agility,
      speed: petData.speed,
      initiative: petData.initiative,
      accuracy: petData.accuracy,
      evasion: petData.evasion,
      damage: petData.damage,
      reach: petData.reach,
    };
    this.assistChance = petData.assistChance;
    this.ability = petData.ability;
    this.description = petData.description;
    this.scale = petData.scale;
    this.isAlive = true;
    this.combo = petData.combo;
    this.counter = petData.counter;
    this.block = petData.block;
    this.disarm = petData.disarm;
  }

  takeDamage(damage) {
    this.stats.hp = Math.max(0, this.stats.hp - damage);
    if (this.stats.hp <= 0) {
      this.isAlive = false;
    }
    return this.stats.hp;
  }

  canAssist() {
    return this.isAlive && Math.random() < this.assistChance;
  }

  calculateDamage() {
    const baseDamage = this.stats.damage + this.stats.strength * 0.5;
    const variation = 0.8 + Math.random() * 0.4;
    return Math.floor(baseDamage * variation);
  }

  getAbilityEffect(target) {
    const damage = this.calculateDamage();
    let effect = {
      damage: damage,
      message: '',
      specialEffect: null,
      statusEffect: null
    };

    switch (this.ability) {
      case 'maul':
        effect.damage = Math.floor(damage * 1.5);
        effect.message = `${this.name} mauls the target for ${effect.damage} damage!`;
        effect.specialEffect = 'bleed';
        if (Math.random() < 0.3) {
          effect.statusEffect = { type: 'bleed', duration: 2, damage: 3 };
        }
        break;

      case 'pounce':
        effect.damage = damage;
        effect.message = `${this.name} pounces for ${damage} damage!`;
        if (Math.random() < 0.4) {
          effect.statusEffect = { type: 'stun', duration: 1 };
          effect.message += ' Target is stunned!';
        }
        break;

      case 'bite':
        effect.damage = damage;
        effect.message = `${this.name} bites for ${damage} damage!`;
        if (Math.random() < 0.2) {
          effect.statusEffect = { type: 'weaken', duration: 2, modifier: 0.8 };
        }
        break;

      case 'guard':
        if (Math.random() < 0.5) {
          this.owner.stats.defense += 5;
          effect.damage = 0;
          effect.message = `${this.name} guards ${this.owner.stats.name}, increasing defense!`;
          effect.specialEffect = 'shield';
        } else {
          effect.damage = damage;
          effect.message = `${this.name} attacks for ${damage} damage!`;
        }
        break;

      default:
        effect.message = `${this.name} attacks for ${damage} damage!`;
    }

    return effect;
  }
}

export function createPet(petType, owner) {
  const petData = pets.find(p => p.name === petType);
  if (!petData) {
    console.error(`Pet type ${petType} not found`);
    return null;
  }
  return new Pet(petData, owner);
}

export function getRandomPet() {
  const weights = [
    { pet: PetName.bear, weight: 10 },
    { pet: PetName.panther, weight: 15 },
    { pet: PetName.dog1, weight: 30 },
    { pet: PetName.dog2, weight: 25 },
    { pet: PetName.dog3, weight: 20 },
  ];
  
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of weights) {
    random -= item.weight;
    if (random <= 0) {
      return item.pet;
    }
  }
  
  return PetName.dog1;
}