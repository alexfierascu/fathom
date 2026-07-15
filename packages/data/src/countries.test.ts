import { describe, expect, it } from 'vitest';

import { loadAllCountries, loadCountriesIndex, loadCountry } from './countries';
import { slugifyName } from './derived';
import { loadAllStraits } from './loader';

describe('countries dataset', () => {
  it('loads all documents in canonical order', () => {
    const all = loadAllCountries();
    expect(all.length).toBe(loadCountriesIndex().length);
    expect(all.length).toBeGreaterThanOrEqual(40);
  });

  it('covers every country named by strait documents', () => {
    const known = new Set(loadAllCountries().map((c) => c.id));
    for (const strait of loadAllStraits()) {
      for (const name of strait.countries) {
        expect(known.has(slugifyName(name)), `missing document for "${name}"`).toBe(true);
      }
    }
  });

  it('keeps ids consistent with slugified names', () => {
    for (const country of loadAllCountries()) {
      expect(country.id).toBe(slugifyName(country.name));
    }
  });

  it('loads single documents and throws for unknown ids', () => {
    expect(loadCountry('spain').code).toBe('ES');
    expect(loadCountry('united-kingdom').code).toBe('GB');
    expect(() => loadCountry('narnia')).toThrow('Unknown country id');
  });
});
