import { describe, expect, it } from 'vitest';

import {
  HistoricalEventSchema,
  ImageSchema,
  SourceSchema,
  StatisticSchema,
  TagSchema,
  WildlifeSchema,
} from './knowledge';

const source = {
  id: 'admiralty-np-1',
  type: 'official-publication',
  title: 'Test Pilot Volume 1',
  publisher: 'Hydrographic Office',
  locator: 'NP1',
};

describe('SourceSchema', () => {
  it('accepts a minimal valid source and rejects one without a locator', () => {
    expect(SourceSchema.safeParse(source).success).toBe(true);
    expect(SourceSchema.safeParse({ ...source, locator: undefined }).success).toBe(false);
  });
});

describe('ImageSchema', () => {
  const image = {
    id: 'gibraltar-aerial',
    file: 'media/abc123',
    license: 'CC BY-SA 4.0',
    credit: 'A. Photographer',
    alt: 'Aerial view of a strait between two coasts',
    depicts: [{ type: 'strait', id: 'gibraltar' }],
  };

  it('requires license, credit, alt, and at least one depicted entity', () => {
    expect(ImageSchema.safeParse(image).success).toBe(true);
    expect(ImageSchema.safeParse({ ...image, depicts: [] }).success).toBe(false);
    expect(ImageSchema.safeParse({ ...image, alt: '' }).success).toBe(false);
  });
});

describe('HistoricalEventSchema', () => {
  it('supports approximate dates and requires involvement and sources', () => {
    const event = {
      id: 'test-passage',
      name: 'A test passage',
      date: { value: '1520', approximate: true },
      summary: 'Something happened at a strait.',
      involves: [{ type: 'strait', id: 'magellan' }],
      sourceIds: [source.id],
    };
    expect(HistoricalEventSchema.safeParse(event).success).toBe(true);
    expect(HistoricalEventSchema.safeParse({ ...event, involves: [] }).success).toBe(false);
    expect(HistoricalEventSchema.safeParse({ ...event, sourceIds: [] }).success).toBe(false);
  });
});

describe('WildlifeSchema', () => {
  it('requires both names, a habitat, and sources', () => {
    const wildlife = {
      id: 'test-porpoise',
      commonName: 'Test porpoise',
      scientificName: 'Phocoena testua',
      summary: 'A small cetacean.',
      habitats: [{ type: 'strait', id: 'gibraltar' }],
      sourceIds: [source.id],
    };
    expect(WildlifeSchema.safeParse(wildlife).success).toBe(true);
    expect(WildlifeSchema.safeParse({ ...wildlife, habitats: [] }).success).toBe(false);
  });
});

describe('StatisticSchema', () => {
  it('is a sourced value about one subject at one time', () => {
    const statistic = {
      subject: { type: 'strait', id: 'hormuz' },
      metric: 'tanker-transits',
      value: 20500,
      unit: 'transits/year',
      period: '2025',
      sourceIds: [source.id],
    };
    expect(StatisticSchema.safeParse(statistic).success).toBe(true);
    expect(StatisticSchema.safeParse({ ...statistic, unit: '' }).success).toBe(false);
    expect(StatisticSchema.safeParse({ ...statistic, sourceIds: [] }).success).toBe(false);
  });
});

describe('TagSchema', () => {
  it('requires a definition so tags mean the same thing everywhere', () => {
    expect(
      TagSchema.safeParse({ id: 'chokepoint', label: 'Chokepoint', definition: 'x' }).success,
    ).toBe(true);
    expect(TagSchema.safeParse({ id: 'chokepoint', label: 'Chokepoint' }).success).toBe(false);
  });
});
