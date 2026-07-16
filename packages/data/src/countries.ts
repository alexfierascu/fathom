import { CountriesIndexSchema, CountrySchema, type CountriesIndex, type Country } from './schema';

import { RAW_COUNTRY_DOCUMENTS } from './countries/manifest';
import rawIndex from './countries/index.json';

interface LoadedCountries {
  index: CountriesIndex;
  byId: ReadonlyMap<string, Country>;
  all: readonly Country[];
}

let cache: LoadedCountries | null = null;

function load(): LoadedCountries {
  if (cache) return cache;

  const index = CountriesIndexSchema.parse(rawIndex);

  const byId = new Map<string, Country>();
  for (const raw of RAW_COUNTRY_DOCUMENTS) {
    const country = CountrySchema.parse(raw);
    if (byId.has(country.id)) {
      throw new Error(`Duplicate country document for id "${country.id}"`);
    }
    byId.set(country.id, country);
  }

  if (index.length !== byId.size) {
    throw new Error(
      `Index lists ${String(index.length)} countries but ${String(byId.size)} documents exist`,
    );
  }

  const all = index.map((entry) => {
    const country = byId.get(entry.id);
    if (!country) {
      throw new Error(`Index entry "${entry.id}" has no country document`);
    }
    return country;
  });

  cache = { index, byId, all };
  return cache;
}

/** The lightweight index of all countries, in canonical order. */
export function loadCountriesIndex(): CountriesIndex {
  return load().index;
}

/** One full country document by id. Throws for unknown ids. */
export function loadCountry(id: string): Country {
  const country = load().byId.get(id);
  if (!country) {
    throw new Error(`Unknown country id "${id}"`);
  }
  return country;
}

/** All full country documents, in canonical (index) order. */
export function loadAllCountries(): readonly Country[] {
  return load().all;
}
