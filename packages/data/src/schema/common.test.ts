import { describe, expect, it } from 'vitest';

import { EntityRefSchema, MeasurementSchema, NameSchema, entityId, parseEntityId } from './common';

describe('entity ids', () => {
  it('composes and parses type-prefixed ids', () => {
    expect(entityId('strait', 'gibraltar')).toBe('strait:gibraltar');
    expect(parseEntityId('strait:gibraltar')).toEqual({ type: 'strait', token: 'gibraltar' });
    expect(parseEntityId('historical-event:gallipoli')).toEqual({
      type: 'historical-event',
      token: 'gallipoli',
    });
  });

  it('rejects malformed ids', () => {
    expect(parseEntityId('gibraltar')).toBeNull();
    expect(parseEntityId('city:lisbon')).toBeNull();
    expect(parseEntityId('strait:Not A Token')).toBeNull();
  });
});

describe('EntityRefSchema', () => {
  it('accepts known types and rejects unknown ones', () => {
    expect(EntityRefSchema.safeParse({ type: 'water-body', id: 'mediterranean' }).success).toBe(
      true,
    );
    expect(EntityRefSchema.safeParse({ type: 'city', id: 'lisbon' }).success).toBe(false);
  });
});

describe('MeasurementSchema', () => {
  it('requires a unit and at least one source', () => {
    const valid = { value: 13, unit: 'km', sourceIds: ['imray-pilot'] };
    expect(MeasurementSchema.safeParse(valid).success).toBe(true);
    expect(MeasurementSchema.safeParse({ value: 13, unit: 'km', sourceIds: [] }).success).toBe(
      false,
    );
    expect(MeasurementSchema.safeParse({ value: 13, sourceIds: ['x'] }).success).toBe(false);
  });
});

describe('NameSchema', () => {
  it('carries language, kind, and qualifiers', () => {
    const name = {
      value: 'İstanbul Boğazı',
      language: 'tr',
      kind: 'official',
    };
    expect(NameSchema.safeParse(name).success).toBe(true);
    expect(NameSchema.safeParse({ value: 'X', kind: 'nickname' }).success).toBe(false);
  });
});
