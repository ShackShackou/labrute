import Rand from 'rand-seed';

let __rng: Rand | null = null;

export const setSeed = (seed: string) => {
  try { __rng = new Rand(seed); } catch { __rng = null; }
};

export const clearSeed = () => { __rng = null; };

export const hasSeed = () => __rng !== null;

export const rand = () => (__rng ? __rng.next() : Math.random());

// Integer inclusive [min..max]
export const randomBetweenSeeded = (min: number, max: number) => {
  if (min > max) return 0;
  if (min === max) return min;
  const r = rand();
  return Math.floor(r * (max - min + 1) + min);
};

