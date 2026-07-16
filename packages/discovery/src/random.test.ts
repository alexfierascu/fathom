import { describe, expect, it } from 'vitest';

import { randomEntity, randomWalk } from './random';

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

describe('randomEntity', () => {
  it('picks deterministically with a seeded source', () => {
    const a = randomEntity({ random: seeded(7) });
    const b = randomEntity({ random: seeded(7) });
    expect(a?.entityId).toBe(b?.entityId);
  });

  it('respects type and exclusion filters', () => {
    const pick = randomEntity({ types: ['strait'], excludeId: 'strait:gibraltar' });
    expect(pick?.type).toBe('strait');
    expect(pick?.entityId).not.toBe('strait:gibraltar');
  });
});

describe('randomWalk', () => {
  it('drifts without revisiting and respects the step limit', () => {
    const walk = randomWalk('strait:gibraltar', 5, { random: seeded(3) });
    expect(walk.length).toBeGreaterThan(0);
    expect(walk.length).toBeLessThanOrEqual(5);
    const ids = walk.map((node) => node.entityId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('strait:gibraltar');
  });
});
