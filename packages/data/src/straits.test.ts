import { describe, expect, it } from 'vitest';

import { STRAIT_REGIONS, STRAITS } from './straits';

describe('straits dataset', () => {
  it('contains the 42 straits from the legacy prototype', () => {
    expect(STRAITS).toHaveLength(42);
  });

  it('has a unique, well-formed id for every strait', () => {
    const ids = STRAITS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('has valid coordinates for every strait', () => {
    for (const strait of STRAITS) {
      expect(strait.lat).toBeGreaterThanOrEqual(-90);
      expect(strait.lat).toBeLessThanOrEqual(90);
      expect(strait.lon).toBeGreaterThanOrEqual(-180);
      expect(strait.lon).toBeLessThanOrEqual(180);
    }
  });

  it('has complete descriptive fields for every strait', () => {
    for (const strait of STRAITS) {
      expect(strait.name).not.toBe('');
      expect(strait.connects).not.toBe('');
      expect(strait.note).not.toBe('');
      expect(strait.countries.length).toBeGreaterThan(0);
      expect(strait.countries).not.toContain('');
    }
  });

  it('assigns every strait to a known region', () => {
    for (const strait of STRAITS) {
      expect(STRAIT_REGIONS).toContain(strait.region);
    }
  });

  it('covers every region with at least one strait', () => {
    for (const region of STRAIT_REGIONS) {
      expect(STRAITS.some((s) => s.region === region)).toBe(true);
    }
  });
});
