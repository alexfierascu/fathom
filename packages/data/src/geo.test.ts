import { describe, expect, it } from 'vitest';

import { distanceKm, nearestStraits } from './geo';

describe('distanceKm', () => {
  it('measures great-circle distance', () => {
    // Gibraltar to Dover, roughly 1,750 km.
    const d = distanceKm(35.95, -5.59, 51.0, 1.4);
    expect(d).toBeGreaterThan(1600);
    expect(d).toBeLessThan(1900);
  });
});

describe('nearestStraits', () => {
  it('finds neighbors and excludes the subject', () => {
    const near = nearestStraits(41.12, 29.07, { limit: 3, excludeId: 'bosporus' });
    expect(near.map((s) => s.id)).not.toContain('bosporus');
    expect(near[0]?.id).toBe('dardanelles');
  });
});
