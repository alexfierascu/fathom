import { describe, expect, it } from 'vitest';

import { StraitSchema } from './schema';
import { validateEntity } from './validate';

describe('validateEntity', () => {
  it('returns the parsed value for valid data', () => {
    const result = validateEntity(StraitSchema, {
      id: 'test',
      name: 'Test Strait',
      countries: ['Testland'],
      region: 'Europe',
      connects: 'A ↔ B',
      lat: 0,
      lon: 0,
      note: 'A note.',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('test');
  });

  it('returns readable issues for invalid data', () => {
    const result = validateEntity(StraitSchema, { id: 'test', lat: 123 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((issue) => issue.startsWith('lat:'))).toBe(true);
    }
  });
});
