import { loadStrait } from '@fathom/data';

import { relatedStraits, straitOfTheDay } from './discovery';

describe('relatedStraits', () => {
  it('prefers straits sharing a water body and never repeats the subject', () => {
    const related = relatedStraits(loadStrait('bosporus'), 3);
    expect(related.map((s) => s.id)).not.toContain('bosporus');
    // The Dardanelles shares the Sea of Marmara with the Bosporus.
    expect(related.map((s) => s.id)).toContain('dardanelles');
    expect(related.length).toBeLessThanOrEqual(3);
    expect(new Set(related.map((s) => s.id)).size).toBe(related.length);
  });
});

describe('straitOfTheDay', () => {
  it('picks deterministically for the current day', () => {
    expect(straitOfTheDay()?.id).toBe(straitOfTheDay()?.id);
  });
});
