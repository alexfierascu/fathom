import { describe, expect, it } from 'vitest';

import type { ProviderRecord } from '../types';
import { normalize } from './normalize';

const base: ProviderRecord = {
  provider: 'a',
  providerId: '1',
  entityType: 'strait',
  name: '  Strait of   Tiran ',
  source: {
    id: 'src-a',
    type: 'dataset',
    title: 'A',
    publisher: 'A',
    locator: 'https://a.test',
  },
};

describe('normalize', () => {
  it('canonicalizes names and derives slugs', () => {
    const { normalized } = normalize([base]);
    expect(normalized[0]?.name).toBe('Strait of Tiran');
    expect(normalized[0]?.id).toBe('strait-of-tiran');
  });

  it('merges the same entity from different providers, keeping provenance', () => {
    const { normalized, duplicatesInBatch } = normalize([
      { ...base, summary: 'Short.' },
      {
        ...base,
        provider: 'b',
        providerId: '2',
        summary: 'A longer, better summary of the strait.',
        countryNames: ['Egypt'],
        source: { ...base.source, id: 'src-b' },
      },
    ]);
    expect(normalized).toHaveLength(1);
    expect(duplicatesInBatch).toBe(1);
    expect(normalized[0]?.summary).toContain('longer');
    expect(normalized[0]?.providers).toHaveLength(2);
    expect(normalized[0]?.sources.map((s) => s.id)).toEqual(['src-a', 'src-b']);
    expect(normalized[0]?.countryNames).toEqual(['Egypt']);
  });

  it('rejects records that produce no valid slug', () => {
    const { normalized, issues } = normalize([{ ...base, name: '???' }]);
    expect(normalized).toHaveLength(0);
    expect(issues[0]?.severity).toBe('error');
  });
});
