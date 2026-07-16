import { describe, expect, it } from 'vitest';

import { parseWikidataResults } from './wikidata';

const bindings = [
  {
    item: { value: 'http://www.wikidata.org/entity/Q83267' },
    itemLabel: { value: 'Straits of Tiran' },
    lat: { value: '28.0' },
    lon: { value: '34.46' },
    countries: { value: 'Egypt|Saudi Arabia' },
    waters: { value: 'Red Sea|Gulf of Aqaba' },
    description: { value: 'narrow sea passages between the Sinai and Arabian peninsulas' },
  },
  {
    // Unlabeled item (label falls back to the QID) — must be dropped.
    item: { value: 'http://www.wikidata.org/entity/Q99999999' },
    itemLabel: { value: 'Q99999999' },
  },
];

describe('parseWikidataResults', () => {
  it('maps SPARQL bindings to provider records with CC0 dataset sources', () => {
    const records = parseWikidataResults(bindings, 'strait');
    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record?.providerId).toBe('Q83267');
    expect(record?.countryNames).toEqual(['Egypt', 'Saudi Arabia']);
    expect(record?.connectsNames).toEqual(['Red Sea', 'Gulf of Aqaba']);
    expect(record?.lat).toBeCloseTo(28.0);
    expect(record?.source.license).toBe('CC0 1.0');
    expect(record?.source.locator).toBe('https://www.wikidata.org/wiki/Q83267');
  });
});
