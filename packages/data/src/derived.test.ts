import { describe, expect, it } from 'vitest';

import { connectedWaterBodyNames, derivedRegistries, slugifyName } from './derived';
import { loadStrait } from './loader';

describe('slugifyName', () => {
  it('produces deterministic kebab-case tokens', () => {
    expect(slugifyName('Gulf of St. Lawrence')).toBe('gulf-of-st-lawrence');
    expect(slugifyName('Middle East & Africa')).toBe('middle-east-africa');
    expect(slugifyName('Öresund')).toBe('oresund');
    expect(slugifyName('United Kingdom')).toBe('united-kingdom');
  });
});

describe('connectedWaterBodyNames', () => {
  it('parses "A ↔ B" connects values and ignores prose', () => {
    expect(connectedWaterBodyNames(loadStrait('gibraltar'))).toEqual([
      'Atlantic Ocean',
      'Mediterranean Sea',
    ]);
    expect(connectedWaterBodyNames(loadStrait('bonifacio'))).toEqual([]);
    expect(connectedWaterBodyNames(loadStrait('mozambique'))).toEqual([]);
  });
});

describe('derivedRegistries', () => {
  const registries = derivedRegistries();

  it('derives every country named by a strait, exactly once', () => {
    const spain = registries.countriesById.get('spain');
    expect(spain).toEqual({ id: 'spain', name: 'Spain' });
    const names = [...registries.countriesById.values()].map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('derives all five regions', () => {
    expect(registries.regionsById.size).toBe(5);
    expect(registries.regionsById.get('americas-arctic')?.name).toBe('Americas & Arctic');
  });

  it('maps memberships in canonical strait order', () => {
    expect(registries.straitIdsByRegionId.get('europe')).toHaveLength(12);
    expect(registries.straitIdsByCountryId.get('indonesia')).toEqual([
      'malacca',
      'singapore',
      'sunda',
      'lombok',
      'makassar',
      'karimata',
    ]);
  });
});
