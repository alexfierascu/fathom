import { loadAllStraits } from '@fathom/data';
import { loadedAtlasContent } from '@fathom/search';
import { describe, expect, it } from 'vitest';

import type { NormalizedRecord } from '../types';
import { assignRegion, resolveRelationships } from './resolve';

const record = (overrides: Partial<NormalizedRecord>): NormalizedRecord => ({
  id: 'test',
  entityType: 'strait',
  name: 'Test',
  alternateNames: [],
  countryNames: [],
  connectsNames: [],
  providers: [{ provider: 'test', providerId: '1' }],
  sources: [
    {
      id: 'test-source',
      type: 'dataset',
      title: 'Test',
      publisher: 'Test',
      locator: 'https://example.test',
    },
  ],
  ...overrides,
});

describe('assignRegion', () => {
  it('agrees with the curated region of every existing strait', () => {
    for (const strait of loadAllStraits()) {
      expect(assignRegion(strait.lat, strait.lon), strait.id).toBe(strait.region);
    }
  });
});

describe('resolveRelationships', () => {
  const atlas = loadedAtlasContent();

  it('builds the connects line and assigns a reviewable region', () => {
    const { resolved, issues } = resolveRelationships(
      [
        record({
          id: 'tiran',
          name: 'Straits of Tiran',
          lat: 28.0,
          lon: 34.46,
          countryNames: ['Egypt'],
          connectsNames: ['Red Sea', 'Gulf of Aqaba'],
        }),
      ],
      atlas,
    );
    expect(resolved[0]?.connects).toBe('Red Sea ↔ Gulf of Aqaba');
    expect(resolved[0]?.region).toBe('Middle East & Africa');
    expect(issues.some((i) => i.message.includes('review'))).toBe(true);
    expect(issues.some((i) => i.message.includes('Gulf of Aqaba'))).toBe(true);
  });

  it('does not warn about charted countries and waters', () => {
    const { issues } = resolveRelationships(
      [
        record({
          countryNames: ['Spain'],
          connectsNames: ['Atlantic Ocean', 'Mediterranean Sea'],
          lat: 36,
          lon: -5,
        }),
      ],
      atlas,
    );
    expect(issues.filter((i) => i.message.includes('not charted'))).toHaveLength(0);
  });
});
