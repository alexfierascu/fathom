import { STRAITS } from '@fathom/data';

import { filterStraits, isFiltering, matchesQuery } from './filtering';

const hormuz = STRAITS.find((s) => s.id === 'hormuz');
if (!hormuz) throw new Error('fixture strait missing');

describe('matchesQuery', () => {
  it('matches everything when the query is empty', () => {
    expect(matchesQuery(hormuz, '')).toBe(true);
  });

  it('matches on name, country, connects, and region (case-insensitive)', () => {
    expect(matchesQuery(hormuz, 'hormuz')).toBe(true);
    expect(matchesQuery(hormuz, 'iran')).toBe(true);
    expect(matchesQuery(hormuz, 'persian gulf')).toBe(true);
    expect(matchesQuery(hormuz, 'middle east')).toBe(true);
    expect(matchesQuery(hormuz, 'atlantis')).toBe(false);
  });
});

describe('filterStraits', () => {
  it('returns everything for the All region and empty query', () => {
    expect(filterStraits(STRAITS, 'All', '')).toHaveLength(STRAITS.length);
  });

  it('filters by region', () => {
    const filtered = filterStraits(STRAITS, 'Europe', '');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((s) => s.region === 'Europe')).toBe(true);
  });

  it('combines region and query, trimming and lowercasing the query', () => {
    const filtered = filterStraits(STRAITS, 'Europe', '  TURKEY ');
    expect(filtered.map((s) => s.id).sort()).toEqual(['bosporus', 'dardanelles']);
  });

  it('returns nothing when the query matches no strait', () => {
    expect(filterStraits(STRAITS, 'All', 'atlantis')).toHaveLength(0);
  });
});

describe('isFiltering', () => {
  it('is false only for the All region with a blank query', () => {
    expect(isFiltering('All', '')).toBe(false);
    expect(isFiltering('All', '   ')).toBe(false);
    expect(isFiltering('All', 'x')).toBe(true);
    expect(isFiltering('Europe', '')).toBe(true);
  });
});
