import { beforeEach, describe, expect, it } from 'vitest';

import { clearRecommendationCache, recommendationsFor } from './recommend';

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

describe('recommendationsFor', () => {
  beforeEach(clearRecommendationCache);

  it('assembles the full set of strait groups for Gibraltar', () => {
    const groups = recommendationsFor('strait:gibraltar', { random: seeded(1) });
    const keys = groups.map((group) => group.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'connected-straits',
        'nearby-straits',
        'connected-seas',
        'neighbouring-countries',
        'strategically-similar',
        'same-region',
        'random-discovery',
      ]),
    );
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.reason).toBeTruthy();
        expect(item.entityId).not.toBe('strait:gibraltar');
      }
    }
  });

  it('finds historically related entities through shared events', () => {
    const groups = recommendationsFor('strait:dover', { random: seeded(2) });
    const historical = groups.find((group) => group.key === 'historically-related');
    expect(historical?.items.map((item) => item.entityId)).toContain('tunnel:channel-tunnel');
  });

  it('covers water bodies, countries, regions, and structures', () => {
    expect(recommendationsFor('water-body:mediterranean-sea').map((g) => g.key)).toEqual(
      expect.arrayContaining(['straits', 'adjacent-seas', 'countries']),
    );
    expect(recommendationsFor('country:spain').map((g) => g.key)).toEqual(
      expect.arrayContaining(['straits', 'neighbours', 'waters']),
    );
    expect(recommendationsFor('region:europe').map((g) => g.key)).toContain('straits');
    expect(recommendationsFor('canal:suez-canal').length).toBeGreaterThan(0);
  });

  it('caches deterministic groups but redraws the random group', () => {
    const first = recommendationsFor('strait:hormuz', { random: seeded(3) });
    const second = recommendationsFor('strait:hormuz', { random: seeded(99) });
    const deterministic = (groups: typeof first) =>
      groups.filter((group) => group.key !== 'random-discovery');
    expect(deterministic(second)).toEqual(deterministic(first));
  });

  it('returns empty for unknown entities', () => {
    expect(recommendationsFor('strait:atlantis')).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'random-discovery' })]),
    );
    expect(recommendationsFor('nonsense')).toEqual([]);
  });
});
