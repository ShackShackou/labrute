import { describe, expect, test } from '@jest/globals';
import { useCharacter, Part } from '../client/src/hooks/useCharacter';

const parts: Part[] = [
  { part: 'head', gender: 'any', id: '1', symbol: 'S1', pivotX: 0, pivotY: 0, z: 1 },
  { part: 'body', gender: 'any', id: '2', symbol: 'S2', pivotX: 0, pivotY: 0, z: 1 },
];

describe('useCharacter', () => {
  test('getSeed returns JSON', () => {
    const hook = useCharacter(parts);
    hook.randomize();
    const seed = hook.getSeed();
    expect(() => JSON.parse(seed)).not.toThrow();
  });
});
