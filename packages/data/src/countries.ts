import { CountriesIndexSchema, CountrySchema, type CountriesIndex, type Country } from './schema';

import rawIndex from './countries/index.json';

import rawAlbania from './countries/albania.json';
import rawArgentina from './countries/argentina.json';
import rawAustralia from './countries/australia.json';
import rawBahamas from './countries/bahamas.json';
import rawCanada from './countries/canada.json';
import rawChile from './countries/chile.json';
import rawChina from './countries/china.json';
import rawCuba from './countries/cuba.json';
import rawDenmark from './countries/denmark.json';
import rawDjibouti from './countries/djibouti.json';
import rawEritrea from './countries/eritrea.json';
import rawFrance from './countries/france.json';
import rawGreenland from './countries/greenland.json';
import rawIceland from './countries/iceland.json';
import rawIndia from './countries/india.json';
import rawIndonesia from './countries/indonesia.json';
import rawIran from './countries/iran.json';
import rawItaly from './countries/italy.json';
import rawJapan from './countries/japan.json';
import rawMadagascar from './countries/madagascar.json';
import rawMalaysia from './countries/malaysia.json';
import rawMorocco from './countries/morocco.json';
import rawMozambique from './countries/mozambique.json';
import rawNewZealand from './countries/new-zealand.json';
import rawNorway from './countries/norway.json';
import rawOman from './countries/oman.json';
import rawPapuaNewGuinea from './countries/papua-new-guinea.json';
import rawPhilippines from './countries/philippines.json';
import rawRussia from './countries/russia.json';
import rawSingapore from './countries/singapore.json';
import rawSouthKorea from './countries/south-korea.json';
import rawSpain from './countries/spain.json';
import rawSriLanka from './countries/sri-lanka.json';
import rawSweden from './countries/sweden.json';
import rawTaiwan from './countries/taiwan.json';
import rawTurkey from './countries/turkey.json';
import rawUkraine from './countries/ukraine.json';
import rawUnitedKingdom from './countries/united-kingdom.json';
import rawUnitedStates from './countries/united-states.json';
import rawYemen from './countries/yemen.json';

/**
 * Every country document ships with the package and is imported statically,
 * mirroring the straits and water bodies loaders. Adding a country means
 * adding its JSON file, an index.json entry, and one import here.
 */
const RAW_COUNTRY_DOCUMENTS: readonly unknown[] = [
  rawAlbania,
  rawArgentina,
  rawAustralia,
  rawBahamas,
  rawCanada,
  rawChile,
  rawChina,
  rawCuba,
  rawDenmark,
  rawDjibouti,
  rawEritrea,
  rawFrance,
  rawGreenland,
  rawIceland,
  rawIndia,
  rawIndonesia,
  rawIran,
  rawItaly,
  rawJapan,
  rawMadagascar,
  rawMalaysia,
  rawMorocco,
  rawMozambique,
  rawNewZealand,
  rawNorway,
  rawOman,
  rawPapuaNewGuinea,
  rawPhilippines,
  rawRussia,
  rawSingapore,
  rawSouthKorea,
  rawSpain,
  rawSriLanka,
  rawSweden,
  rawTaiwan,
  rawTurkey,
  rawUkraine,
  rawUnitedKingdom,
  rawUnitedStates,
  rawYemen,
];

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
