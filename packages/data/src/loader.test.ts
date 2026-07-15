import { describe, expect, it } from 'vitest';

import { loadAllStraits, loadStrait, loadStraitsIndex } from './loader';
import { STRAIT_REGIONS } from './schema';

describe('loadStraitsIndex', () => {
  it('returns the 42 straits of the atlas', () => {
    expect(loadStraitsIndex()).toHaveLength(42);
  });

  it('preserves the canonical ordering from the prototype', () => {
    const index = loadStraitsIndex();
    expect(index[0]?.id).toBe('gibraltar');
    expect(index.at(-1)?.id).toBe('vilkitsky');
  });

  it('has unique ids', () => {
    const ids = loadStraitsIndex().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('loadStrait', () => {
  it('returns the full document for a known id', () => {
    const hormuz = loadStrait('hormuz');
    expect(hormuz.name).toBe('Strait of Hormuz');
    expect(hormuz.connects).toBe('Persian Gulf ↔ Gulf of Oman');
    expect(hormuz.note).not.toBe('');
  });

  it('throws for an unknown id', () => {
    expect(() => loadStrait('atlantis')).toThrow('Unknown strait id "atlantis"');
  });
});

describe('loadAllStraits', () => {
  it('returns full documents in index order', () => {
    const all = loadAllStraits();
    expect(all).toHaveLength(42);
    expect(all[0]?.id).toBe('gibraltar');
    expect(all.at(-1)?.id).toBe('vilkitsky');
  });

  it('agrees with the index on every shared field', () => {
    const index = loadStraitsIndex();
    for (const entry of index) {
      const strait = loadStrait(entry.id);
      expect({
        id: strait.id,
        name: strait.name,
        region: strait.region,
        countries: strait.countries,
        lat: strait.lat,
        lon: strait.lon,
      }).toEqual(entry);
    }
  });

  it('covers every region with at least one strait', () => {
    const all = loadAllStraits();
    for (const region of STRAIT_REGIONS) {
      expect(all.some((strait) => strait.region === region)).toBe(true);
    }
  });
});
