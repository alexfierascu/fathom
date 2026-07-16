import { describe, expect, it } from 'vitest';

import { atlasSearchIndex, buildAtlasSearchDocuments } from './atlas';

describe('buildAtlasSearchDocuments', () => {
  it('indexes every charted entity', () => {
    const documents = buildAtlasSearchDocuments();
    const byType = (type: string) => documents.filter((doc) => doc.type === type).length;
    expect(byType('strait')).toBeGreaterThanOrEqual(42);
    expect(byType('water-body')).toBeGreaterThanOrEqual(46);
    expect(byType('country')).toBeGreaterThanOrEqual(42);
    expect(byType('region')).toBeGreaterThanOrEqual(5);
    expect(byType('port')).toBeGreaterThanOrEqual(1);
    expect(byType('canal')).toBeGreaterThanOrEqual(2);
    expect(byType('bridge')).toBeGreaterThanOrEqual(1);
    expect(byType('tunnel')).toBeGreaterThanOrEqual(2);
    expect(byType('island')).toBeGreaterThanOrEqual(4);
    expect(byType('maritime-route')).toBeGreaterThanOrEqual(1);
  });

  it('finds the seeded maritime entities', () => {
    const index = atlasSearchIndex();
    // The Gulf of Suez (a sea) outranks the canal per the type hierarchy.
    expect(
      index
        .search('suez')
        .slice(0, 3)
        .map((r) => r.document.entityId),
    ).toContain('canal:suez-canal');
    expect(index.search('seikan')[0]?.document.entityId).toBe('tunnel:seikan-tunnel');
    expect(
      index
        .search('sicily')
        .slice(0, 3)
        .map((r) => r.document.entityId),
    ).toContain('island:sicily');
    expect(index.search('northern sea')[0]?.document.entityId).toBe(
      'maritime-route:northern-sea-route',
    );
  });
});

describe('atlasSearchIndex', () => {
  const index = atlasSearchIndex();

  it('finds any entity kind within a few keystrokes', () => {
    // Both the territory and the strait answer 'gib'; the country's exact
    // name prefix legitimately outranks the strait's word-boundary match.
    // Strait-first ranking: the strait now beats the territory outright.
    expect(index.search('gib')[0]?.document.entityId).toBe('strait:gibraltar');
    expect(index.search('medit')[0]?.document.entityId).toBe('water-body:mediterranean-sea');
    expect(index.search('spai')[0]?.document.entityId).toBe('country:spain');
    expect(index.search('americas')[0]?.document.entityId).toBe('region:americas-arctic');
  });

  it('searches by country and region keywords', () => {
    const viaCountry = index.search('indonesia');
    expect(viaCountry.map((r) => r.document.entityId)).toContain('strait:sunda');
    expect(viaCountry[0]?.document.entityId).toBe('country:indonesia');
  });

  it('handles diacritics in atlas names', () => {
    expect(index.search('oresund').map((r) => r.document.entityId)).toContain('strait:oresund');
    expect(index.search('perouse')[0]?.document.entityId).toBe('strait:laperouse');
  });

  it('gives region documents a navigable path', () => {
    const europe = index.search('europe').find((r) => r.document.type === 'region');
    expect(europe?.document.path).toBe('/regions/europe');
  });
});
