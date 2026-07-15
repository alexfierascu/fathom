import { describe, expect, it } from 'vitest';

import { findBrokenReferences, loadAtlasDataset, type AtlasDataset } from './integrity';
import type { Country, Source, Strait, WaterBody } from './schema';

const testStrait: Strait = {
  id: 'test-strait',
  name: 'Test Strait',
  countries: ['Testland'],
  region: 'Europe',
  connects: 'Test Sea ↔ Trial Ocean',
  lat: 0,
  lon: 0,
  note: 'A strait for testing.',
};

const testSource: Source = {
  id: 'test-source',
  type: 'website',
  title: 'Test Source',
  publisher: 'Testers',
  locator: 'https://example.test',
};

const testWaterBodies: WaterBody[] = [
  {
    id: 'trial-ocean',
    name: 'Trial Ocean',
    type: 'ocean',
    summary: 'An ocean for testing.',
    sourceIds: ['test-source'],
  },
  {
    id: 'test-sea',
    name: 'Test Sea',
    type: 'sea',
    parentId: 'trial-ocean',
    summary: 'A sea for testing.',
    sourceIds: ['test-source'],
  },
];

const testCountries: Country[] = [
  {
    id: 'testland',
    name: 'Testland',
    code: 'TL',
    summary: 'A country for testing.',
    sourceIds: ['test-source'],
  },
];

const baseDataset: AtlasDataset = {
  straits: [testStrait],
  waterBodies: testWaterBodies,
  countries: testCountries,
  sources: [testSource],
  images: [],
  events: [],
  wildlife: [],
  statistics: [],
  tags: [],
};

describe('findBrokenReferences', () => {
  it('finds no broken references in the real dataset', () => {
    expect(findBrokenReferences(loadAtlasDataset())).toEqual([]);
  });

  it('flags references to unknown ids', () => {
    const dataset: AtlasDataset = {
      ...baseDataset,
      straits: [{ ...testStrait, sourceIds: ['missing-source'], tagIds: ['missing-tag'] }],
    };
    const broken = findBrokenReferences(dataset);
    expect(broken).toHaveLength(2);
    expect(broken[0]).toEqual({
      from: 'strait:test-strait',
      field: 'sourceIds',
      ref: 'source:missing-source',
      reason: 'unknown-id',
    });
  });

  it('flags connects values that name no water body document', () => {
    const dataset: AtlasDataset = { ...baseDataset, waterBodies: [] };
    const broken = findBrokenReferences(dataset);
    expect(broken.map((b) => b.ref)).toEqual(['water-body:test-sea', 'water-body:trial-ocean']);
    expect(broken.every((b) => b.field === 'connects' && b.reason === 'unknown-id')).toBe(true);
  });

  it('flags water body parents and sources that do not resolve', () => {
    const dataset: AtlasDataset = {
      ...baseDataset,
      straits: [],
      waterBodies: [
        {
          id: 'orphan-sea',
          name: 'Orphan Sea',
          type: 'sea',
          parentId: 'no-such-ocean',
          summary: 'A sea with a missing parent.',
          sourceIds: ['missing-source'],
        },
      ],
    };
    const broken = findBrokenReferences(dataset);
    expect(broken.map((b) => `${b.field}:${b.ref}`)).toEqual([
      'parentId:water-body:no-such-ocean',
      'sourceIds:source:missing-source',
    ]);
  });

  it('accepts references that resolve against documents and derived entities', () => {
    const dataset: AtlasDataset = {
      ...baseDataset,
      straits: [
        {
          ...testStrait,
          connectsWaterBodies: [
            { type: 'water-body', id: 'test-sea' },
            { type: 'water-body', id: 'trial-ocean' },
          ],
          borderedBy: [{ type: 'country', id: 'testland' }],
        },
      ],
    };
    expect(findBrokenReferences(dataset)).toEqual([]);
  });

  it('reports not-yet-modeled entity types distinctly', () => {
    const dataset: AtlasDataset = {
      ...baseDataset,
      straits: [{ ...testStrait, separates: [{ type: 'island', id: 'isle-of-wight' }] }],
    };
    expect(findBrokenReferences(dataset)).toEqual([
      {
        from: 'strait:test-strait',
        field: 'separates',
        ref: 'island:isle-of-wight',
        reason: 'unresolvable-type',
      },
    ]);
  });

  it('handles circular references safely and validates statistic subjects', () => {
    const dataset: AtlasDataset = {
      ...baseDataset,
      events: [
        {
          id: 'event-a',
          name: 'Event A',
          date: { value: '1900' },
          summary: 'First of a circular pair.',
          involves: [{ type: 'strait', id: 'test-strait' }],
          relatedEventIds: ['event-b'],
          sourceIds: ['test-source'],
        },
        {
          id: 'event-b',
          name: 'Event B',
          date: { value: '1901' },
          summary: 'Second of a circular pair.',
          involves: [{ type: 'strait', id: 'test-strait' }],
          relatedEventIds: ['event-a'],
          sourceIds: ['test-source'],
        },
      ],
      statistics: [
        {
          subject: { type: 'strait', id: 'no-such-strait' },
          metric: 'transits',
          value: 1,
          unit: 'transits/year',
          period: '2025',
          sourceIds: ['test-source'],
        },
      ],
    };

    const broken = findBrokenReferences(dataset);
    expect(broken).toEqual([
      {
        from: 'statistic about strait:no-such-strait',
        field: 'subject',
        ref: 'strait:no-such-strait',
        reason: 'unknown-id',
      },
    ]);
  });
});
