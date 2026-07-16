import { describe, expect, it } from 'vitest';

import { loadStrait } from '@fathom/data';

import { similarStraits, similarityBetween } from './similarity';

describe('similarityBetween', () => {
  it('explains every point of the score with reasons', () => {
    const result = similarityBetween(loadStrait('bosporus'), loadStrait('dardanelles'));
    expect(result.score).toBeGreaterThan(0);
    const total = result.reasons.reduce((sum, reason) => sum + reason.weight, 0);
    expect(total).toBeCloseTo(result.score);
    expect(result.reasons.map((reason) => reason.signal)).toEqual(
      expect.arrayContaining(['shared-water', 'shared-country', 'same-region', 'proximity']),
    );
  });

  it('scores strategic kinship through shared tags', () => {
    const result = similarityBetween(loadStrait('hormuz'), loadStrait('malacca'));
    const tagReason = result.reasons.find((reason) => reason.signal === 'shared-tag');
    expect(tagReason).toBeDefined();
    expect(tagReason?.detail).toContain('chokepoint');
  });
});

describe('similarStraits', () => {
  it('ranks the genuinely kindred straits at the top for the Bosporus', () => {
    const ranked = similarStraits(loadStrait('bosporus'), 5);
    // The Dardanelles shares the Marmara, Turkey, and the region; Kerch
    // shares the Black Sea and the crossed tag — both belong up top.
    expect(ranked.slice(0, 3).map((result) => result.id)).toContain('dardanelles');
    expect(ranked.map((result) => result.id)).not.toContain('bosporus');
  });

  it('never returns more than the limit and always scores descending', () => {
    const ranked = similarStraits(loadStrait('gibraltar'), 4);
    expect(ranked.length).toBeLessThanOrEqual(4);
    for (let i = 1; i < ranked.length; i += 1) {
      const prev = ranked[i - 1];
      const curr = ranked[i];
      if (prev && curr) expect(prev.score).toBeGreaterThanOrEqual(curr.score);
    }
  });
});
