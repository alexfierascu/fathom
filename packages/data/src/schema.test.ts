import { describe, expect, it } from 'vitest';

import { StraitIndexEntrySchema, StraitSchema } from './schema';

const valid = {
  id: 'gibraltar',
  name: 'Strait of Gibraltar',
  countries: ['Spain', 'Morocco'],
  region: 'Europe',
  connects: 'Atlantic Ocean ↔ Mediterranean Sea',
  lat: 35.95,
  lon: -5.59,
  note: 'Only 13 km wide at its narrowest.',
};

describe('StraitSchema', () => {
  it('accepts a valid strait document', () => {
    expect(StraitSchema.parse(valid)).toEqual(valid);
  });

  it('rejects out-of-range coordinates', () => {
    expect(StraitSchema.safeParse({ ...valid, lat: 91 }).success).toBe(false);
    expect(StraitSchema.safeParse({ ...valid, lon: -200 }).success).toBe(false);
  });

  it('rejects unknown regions', () => {
    expect(StraitSchema.safeParse({ ...valid, region: 'Atlantis' }).success).toBe(false);
  });

  it('rejects malformed ids', () => {
    expect(StraitSchema.safeParse({ ...valid, id: 'Gibraltar!' }).success).toBe(false);
  });

  it('rejects empty countries', () => {
    expect(StraitSchema.safeParse({ ...valid, countries: [] }).success).toBe(false);
    expect(StraitSchema.safeParse({ ...valid, countries: [''] }).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    expect(StraitSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
  });

  it('accepts the optional canonical expansion fields', () => {
    const rich = {
      ...valid,
      slug: 'gibraltar',
      names: [{ value: 'Estrecho de Gibraltar', language: 'es', kind: 'official' }],
      summary: 'Short summary.',
      status: 'published',
      connectsWaterBodies: [
        { type: 'water-body', id: 'atlantic-ocean' },
        { type: 'water-body', id: 'mediterranean-sea' },
      ],
      separates: [{ type: 'country', id: 'spain' }],
      borderedBy: [{ type: 'country', id: 'morocco' }],
      dimensions: {
        widthMin: { value: 13, unit: 'km', sourceIds: ['test-source'] },
      },
      tagIds: ['chokepoint'],
      sourceIds: ['test-source'],
    };
    expect(StraitSchema.safeParse(rich).success).toBe(true);
  });

  it('rejects invalid canonical expansion values', () => {
    expect(
      StraitSchema.safeParse({
        ...valid,
        dimensions: { widthMin: { value: 13, unit: 'km', sourceIds: [] } },
      }).success,
    ).toBe(false);
    expect(
      StraitSchema.safeParse({ ...valid, connectsWaterBodies: [{ type: 'ocean', id: 'x' }] })
        .success,
    ).toBe(false);
  });
});

describe('StraitIndexEntrySchema', () => {
  it('accepts a valid index entry and rejects detail-only fields', () => {
    const entry = {
      id: valid.id,
      name: valid.name,
      region: valid.region,
      countries: valid.countries,
      lat: valid.lat,
      lon: valid.lon,
    };
    expect(StraitIndexEntrySchema.parse(entry)).toEqual(entry);
    expect(StraitIndexEntrySchema.safeParse({ ...entry, note: 'x' }).success).toBe(false);
  });
});
