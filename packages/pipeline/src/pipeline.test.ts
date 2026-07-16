import { describe, expect, it } from 'vitest';

import { runPipeline } from './pipeline';
import type { ProviderAdapter, ProviderRecord } from './types';

const tiran: ProviderRecord = {
  provider: 'fake',
  providerId: 'F1',
  entityType: 'strait',
  name: 'Straits of Tiran',
  lat: 28.0,
  lon: 34.46,
  summary: 'The narrow passages between the Sinai and Arabian peninsulas.',
  countryNames: ['Egypt'],
  connectsNames: ['Red Sea', 'Gulf of Nowhere'],
  source: {
    id: 'fake-tiran',
    type: 'dataset',
    title: 'Fake dataset',
    publisher: 'Test',
    locator: 'https://example.test/tiran',
  },
};

const bosporusDuplicate: ProviderRecord = {
  ...tiran,
  providerId: 'F2',
  name: 'Bosporus',
  lat: 41.12,
  lon: 29.07,
  countryNames: ['Turkey'],
  connectsNames: ['Black Sea', 'Sea of Marmara'],
  source: { ...tiran.source, id: 'fake-bosporus' },
};

const incomplete: ProviderRecord = {
  ...tiran,
  providerId: 'F3',
  name: 'Mystery Passage',
  summary: undefined,
  connectsNames: [],
  source: { ...tiran.source, id: 'fake-mystery' },
};

const fakeAdapter: ProviderAdapter = {
  name: 'fake',
  provides: ['strait'],
  fetchRecords: () => Promise.resolve([tiran, bosporusDuplicate, incomplete]),
};

describe('runPipeline', () => {
  it('imports, dedupes against the atlas, stages valid drafts, and reports', async () => {
    const result = await runPipeline([fakeAdapter], [], { types: ['strait'] });

    expect(result.report.counts.imported).toBe(3);
    expect(result.report.counts.duplicatesOfAtlas).toBe(1); // Bosporus already charted
    expect(result.report.counts.staged).toBe(1);
    expect(result.report.counts.rejected).toBeGreaterThanOrEqual(1); // Mystery Passage

    const staged = result.staged[0];
    expect(staged?.id).toBe('straits-of-tiran');
    expect(staged?.document.status).toBe('draft');
    expect(staged?.document.region).toBe('Middle East & Africa');
    expect(staged?.document.connects).toBe('Red Sea ↔ Gulf of Nowhere');

    // Cited sources ride along for apply.
    expect(result.stagedSources.map((s) => s.id)).toContain('fake-tiran');

    // The search index covers existing + staged content.
    const search = result.searchDocuments as { entityId: string }[];
    expect(search.some((doc) => doc.entityId === 'strait:straits-of-tiran')).toBe(true);

    // The fictional gulf is not charted: surfaced as a warning, and the
    // staged strait itself is valid (connects is prose, not a reference).
    expect(
      result.report.issues.some(
        (issue) => issue.severity === 'warning' && issue.message.includes('Gulf of Nowhere'),
      ),
    ).toBe(true);
  });

  it('surfaces adapter failures as import issues instead of crashing', async () => {
    const failing: ProviderAdapter = {
      name: 'broken',
      provides: ['strait'],
      fetchRecords: () => Promise.reject(new Error('HTTP 500')),
    };
    const result = await runPipeline([failing], [], { types: ['strait'] });
    expect(result.report.counts.imported).toBe(0);
    expect(
      result.report.issues.some(
        (issue) => issue.stage === 'import' && issue.message.includes('HTTP 500'),
      ),
    ).toBe(true);
  });
});
