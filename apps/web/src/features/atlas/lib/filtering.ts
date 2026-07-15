import type { Strait, StraitRegion } from '@fathom/data';

export type RegionFilter = 'All' | StraitRegion;

export function matchesQuery(strait: Strait, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const haystack =
    `${strait.name} ${strait.countries.join(' ')} ${strait.connects} ${strait.region}`.toLowerCase();
  return haystack.includes(normalizedQuery);
}

export function filterStraits(
  straits: readonly Strait[],
  region: RegionFilter,
  query: string,
): readonly Strait[] {
  const normalized = query.trim().toLowerCase();
  return straits.filter(
    (strait) => (region === 'All' || strait.region === region) && matchesQuery(strait, normalized),
  );
}

export function isFiltering(region: RegionFilter, query: string): boolean {
  return query.trim() !== '' || region !== 'All';
}
