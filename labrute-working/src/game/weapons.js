export const WeaponName = {
  // Fast weapons
  fan: 'fan',
  keyboard: 'keyboard',
  knife: 'knife',
  leek: 'leek',
  mug: 'mug',
  sai: 'sai',
  racquet: 'racquet',
  
  // Heavy weapons
  axe: 'axe',
  bumps: 'bumps',
  flail: 'flail',
  fryingPan: 'fryingPan',
  hatchet: 'hatchet',
  mammothBone: 'mammothBone',
  morningStar: 'morningStar',
  trombone: 'trombone',
  
  // Long weapons
  baton: 'baton',
  halbard: 'halbard',
  lance: 'lance',
  trident: 'trident',
  whip: 'whip',
  
  // Thrown weapons
  noodleBowl: 'noodleBowl',
  piopio: 'piopio',
  shuriken: 'shuriken',
  
  // Sharp weapons
  broadsword: 'broadsword',
  scimitar: 'scimitar',
  sword: 'sword',
  
  // Our existing weapons
  dagger: 'dagger',
  hammer: 'hammer',
  mace: 'mace',
  club: 'club',
  staff: 'staff',
  spear: 'spear',
};

export const WeaponType = {
  FAST: 'fast',
  SHARP: 'sharp',
  HEAVY: 'heavy',
  LONG: 'long',
  THROWN: 'thrown',
  BLUNT: 'blunt',
};

export const weaponStats = {
  // Fast weapons (high accuracy, low damage)
  [WeaponName.fan]: { type: WeaponType.FAST, damage: 8, accuracy: 0.9, critChance: 0.15 },
  [WeaponName.keyboard]: { type: WeaponType.FAST, damage: 10, accuracy: 0.85, critChance: 0.1 },
  [WeaponName.knife]: { type: WeaponType.FAST, damage: 12, accuracy: 0.88, critChance: 0.2 },
  [WeaponName.leek]: { type: WeaponType.FAST, damage: 7, accuracy: 0.92, critChance: 0.1 },
  [WeaponName.mug]: { type: WeaponType.FAST, damage: 9, accuracy: 0.87, critChance: 0.12 },
  [WeaponName.sai]: { type: WeaponType.FAST, damage: 11, accuracy: 0.9, critChance: 0.18 },
  [WeaponName.racquet]: { type: WeaponType.FAST, damage: 10, accuracy: 0.86, critChance: 0.14 },
  [WeaponName.dagger]: { type: WeaponType.FAST, damage: 12, accuracy: 0.88, critChance: 0.2 },
  
  // Heavy weapons (high damage, low accuracy)
  [WeaponName.axe]: { type: WeaponType.HEAVY, damage: 25, accuracy: 0.65, critChance: 0.15 },
  [WeaponName.bumps]: { type: WeaponType.HEAVY, damage: 22, accuracy: 0.68, critChance: 0.12 },
  [WeaponName.flail]: { type: WeaponType.HEAVY, damage: 24, accuracy: 0.63, critChance: 0.18 },
  [WeaponName.fryingPan]: { type: WeaponType.HEAVY, damage: 20, accuracy: 0.7, critChance: 0.1 },
  [WeaponName.hatchet]: { type: WeaponType.HEAVY, damage: 23, accuracy: 0.67, critChance: 0.14 },
  [WeaponName.mammothBone]: { type: WeaponType.HEAVY, damage: 26, accuracy: 0.62, critChance: 0.16 },
  [WeaponName.morningStar]: { type: WeaponType.HEAVY, damage: 27, accuracy: 0.6, critChance: 0.2 },
  [WeaponName.trombone]: { type: WeaponType.HEAVY, damage: 21, accuracy: 0.69, critChance: 0.11 },
  [WeaponName.hammer]: { type: WeaponType.HEAVY, damage: 25, accuracy: 0.65, critChance: 0.15 },
  [WeaponName.mace]: { type: WeaponType.HEAVY, damage: 22, accuracy: 0.68, critChance: 0.12 },
  [WeaponName.club]: { type: WeaponType.HEAVY, damage: 20, accuracy: 0.7, critChance: 0.1 },
  
  // Long weapons (medium damage, good reach)
  [WeaponName.baton]: { type: WeaponType.LONG, damage: 14, accuracy: 0.78, critChance: 0.12 },
  [WeaponName.halbard]: { type: WeaponType.LONG, damage: 18, accuracy: 0.72, critChance: 0.15 },
  [WeaponName.lance]: { type: WeaponType.LONG, damage: 17, accuracy: 0.74, critChance: 0.14 },
  [WeaponName.trident]: { type: WeaponType.LONG, damage: 16, accuracy: 0.75, critChance: 0.13 },
  [WeaponName.whip]: { type: WeaponType.LONG, damage: 13, accuracy: 0.8, critChance: 0.16 },
  [WeaponName.staff]: { type: WeaponType.LONG, damage: 15, accuracy: 0.77, critChance: 0.11 },
  [WeaponName.spear]: { type: WeaponType.LONG, damage: 16, accuracy: 0.75, critChance: 0.13 },
  
  // Thrown weapons (varies)
  [WeaponName.noodleBowl]: { type: WeaponType.THROWN, damage: 12, accuracy: 0.7, critChance: 0.1 },
  [WeaponName.piopio]: { type: WeaponType.THROWN, damage: 14, accuracy: 0.75, critChance: 0.12 },
  [WeaponName.shuriken]: { type: WeaponType.THROWN, damage: 15, accuracy: 0.85, critChance: 0.25 },
  
  // Sharp weapons (high crit, medium damage)
  [WeaponName.broadsword]: { type: WeaponType.SHARP, damage: 19, accuracy: 0.73, critChance: 0.22 },
  [WeaponName.scimitar]: { type: WeaponType.SHARP, damage: 17, accuracy: 0.76, critChance: 0.24 },
  [WeaponName.sword]: { type: WeaponType.SHARP, damage: 18, accuracy: 0.75, critChance: 0.23 },
};

export function getRandomWeapon() {
  const weapons = Object.keys(WeaponName);
  return weapons[Math.floor(Math.random() * weapons.length)];
}

export function getWeaponDamageModifier(weaponType, fighterStats) {
  const weapon = weaponStats[weaponType];
  if (!weapon) return 1;
  
  let modifier = weapon.damage / 10; // Base modifier from weapon damage
  
  // Apply skill bonuses
  if (fighterStats.skills) {
    if (fighterStats.skills.includes('weaponMaster')) {
      modifier *= 1.15; // 15% bonus
    }
    
    // Specific weapon type bonuses
    if (weapon.type === WeaponType.SHARP && fighterStats.skills.includes('swordMastery')) {
      modifier *= 1.2;
    }
    if (weapon.type === WeaponType.HEAVY && fighterStats.skills.includes('bodybuilder')) {
      modifier *= 1.1;
    }
  }
  
  return modifier;
}