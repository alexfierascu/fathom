import { loadAllStraits } from '@fathom/data';

import {
  findCountryBySlug,
  findStraitBySlug,
  findWaterBodyBySlug,
  getAdjacentStraits,
} from './navigation';

describe('findStraitBySlug', () => {
  it('returns the strait for a known slug', () => {
    expect(findStraitBySlug('hormuz')?.name).toBe('Strait of Hormuz');
  });

  it('returns null for unknown or missing slugs', () => {
    expect(findStraitBySlug('atlantis')).toBeNull();
    expect(findStraitBySlug(undefined)).toBeNull();
  });
});

describe('findCountryBySlug', () => {
  it('returns the country for a known slug', () => {
    expect(findCountryBySlug('spain')?.code).toBe('ES');
  });

  it('returns null for unknown or missing slugs', () => {
    expect(findCountryBySlug('narnia')).toBeNull();
    expect(findCountryBySlug(undefined)).toBeNull();
  });
});

describe('findWaterBodyBySlug', () => {
  it('returns the water body for a known slug', () => {
    expect(findWaterBodyBySlug('mediterranean-sea')?.type).toBe('sea');
  });

  it('returns null for unknown or missing slugs', () => {
    expect(findWaterBodyBySlug('sea-of-atlantis')).toBeNull();
    expect(findWaterBodyBySlug(undefined)).toBeNull();
  });
});

describe('getAdjacentStraits', () => {
  const all = loadAllStraits();

  it('has no previous at the start of the canonical order', () => {
    const { previous, next } = getAdjacentStraits('gibraltar');
    expect(previous).toBeNull();
    expect(next?.id).toBe(all[1]?.id);
  });

  it('has no next at the end of the canonical order', () => {
    const last = all.at(-1);
    if (!last) throw new Error('empty dataset');
    const { previous, next } = getAdjacentStraits(last.id);
    expect(next).toBeNull();
    expect(previous?.id).toBe(all.at(-2)?.id);
  });

  it('returns both neighbors in the middle', () => {
    const { previous, next } = getAdjacentStraits('hormuz');
    const position = all.findIndex((s) => s.id === 'hormuz');
    expect(previous?.id).toBe(all[position - 1]?.id);
    expect(next?.id).toBe(all[position + 1]?.id);
  });

  it('returns no neighbors for unknown ids', () => {
    expect(getAdjacentStraits('atlantis')).toEqual({ previous: null, next: null });
  });
});
