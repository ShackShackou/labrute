// Mapping weapon names to optional sprite paths.
// Drop your images in `client/public/images/weapons/` and map here.
// Filenames should be lowercase to match the WeaponName values.

// Pre-filled keys for all known WeaponName values. Leave value as '' until you drop
// a corresponding image under `client/public/images/weapons/` (e.g., 'axe.webp').
// When set to a non-empty path, HUD and projectiles will use the texture.
export const weaponTexturePath: Record<string, string> = {
  axe: '',
  baton: '',
  broadsword: '',
  bumps: '',
  fan: '',
  flail: '',
  fryingPan: '',
  halbard: '',
  hatchet: '',
  keyboard: '',
  knife: '',
  lance: '',
  leek: '',
  mammothBone: '',
  morningStar: '',
  mug: '',
  noodleBowl: '',
  piopio: '',
  racquet: '',
  sai: '',
  scimitar: '',
  shuriken: '',
  sword: '',
  trombone: '',
  trident: '',
  whip: '',
};

export const getWeaponTexturePath = (weaponName: string): string | null => {
  const key = (weaponName || '').toLowerCase();
  return weaponTexturePath[key] ?? null;
};
