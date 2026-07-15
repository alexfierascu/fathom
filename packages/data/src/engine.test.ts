import { describe, expect, it } from 'vitest';

import { getChildren, getEntity, getParents, getRelated, getStraitEntity } from './engine';
import { loadStrait } from './loader';

describe('getEntity', () => {
  it('resolves straits, derived entities, and returns null for unknowns', () => {
    expect(getEntity('strait:gibraltar')?.name).toBe('Strait of Gibraltar');
    expect(getEntity('country:spain')?.name).toBe('Spain');
    expect(getEntity('country:united-kingdom')?.name).toBe('United Kingdom');
    expect(getEntity('water-body:mediterranean-sea')?.name).toBe('Mediterranean Sea');
    expect(getEntity('region:europe')?.name).toBe('Europe');
    expect(getEntity('strait:atlantis')).toBeNull();
    expect(getEntity('country:narnia')).toBeNull();
    expect(getEntity('not-a-canonical-id')).toBeNull();
    expect(getEntity('canal:suez')).toBeNull();
  });
});

describe('getRelated: strait relationships', () => {
  const gibraltar = getStraitEntity(loadStrait('gibraltar'));

  it('resolves countries in document order (many-to-many)', () => {
    const countries = getRelated(gibraltar, 'countries');
    expect(countries.map((c) => c.name)).toEqual(['Spain', 'Morocco']);
    expect(countries[0]?.entityId).toBe('country:spain');
  });

  it('resolves the single region (one-to-one from the strait side)', () => {
    expect(getRelated(gibraltar, 'region')?.name).toBe('Europe');
  });

  it('derives water bodies from the connects field', () => {
    const bodies = getRelated(gibraltar, 'waterBodies');
    expect(bodies.map((b) => b.name)).toEqual(['Atlantic Ocean', 'Mediterranean Sea']);
  });

  it('yields no water bodies for prose connects values', () => {
    const solent = getStraitEntity(loadStrait('solent'));
    expect(getRelated(solent, 'waterBodies')).toEqual([]);
  });

  it('returns empty knowledge attachments while collections are empty', () => {
    expect(getRelated(gibraltar, 'images')).toEqual([]);
    expect(getRelated(gibraltar, 'sources')).toEqual([]);
    expect(getRelated(gibraltar, 'events')).toEqual([]);
    expect(getRelated(gibraltar, 'wildlife')).toEqual([]);
    expect(getRelated(gibraltar, 'statistics')).toEqual([]);
    expect(getRelated(gibraltar, 'tags')).toEqual([]);
  });
});

describe('getRelated: reverse and derived relationships', () => {
  it('country ↔ strait is bidirectional', () => {
    const spain = getEntity('country:spain');
    if (spain?.type !== 'country') throw new Error('expected country node');
    const straits = getRelated(spain, 'straits');
    expect(straits.map((s) => s.id)).toContain('gibraltar');
  });

  it('countries resolve neighbors across shared straits and their sources', () => {
    const spain = getEntity('country:spain');
    if (spain?.type !== 'country') throw new Error('expected country node');
    expect(spain.data.code).toBe('ES');
    expect(getRelated(spain, 'neighbors').map((c) => c.id)).toContain('morocco');
    expect(getRelated(spain, 'neighbors').map((c) => c.id)).not.toContain('spain');
    expect(getRelated(spain, 'sources').map((s) => s.id)).toEqual(['iso-3166-country-codes']);
  });

  it('country ↔ water body is derived through shared straits', () => {
    const indonesia = getEntity('country:indonesia');
    if (indonesia?.type !== 'country') throw new Error('expected country node');
    const bodies = getRelated(indonesia, 'waterBodies');
    expect(bodies.map((b) => b.id)).toContain('java-sea');
    expect(getRelated(indonesia, 'straits').length).toBeGreaterThanOrEqual(6);
  });

  it('water body ↔ region is derived through shared straits', () => {
    const mediterranean = getEntity('water-body:mediterranean-sea');
    if (mediterranean?.type !== 'water-body') throw new Error('expected water-body node');
    expect(getRelated(mediterranean, 'regions').map((r) => r.id)).toEqual(['europe']);
    expect(getRelated(mediterranean, 'straits').map((s) => s.id)).toContain('gibraltar');
  });

  it('region resolves its straits', () => {
    const europe = getEntity('region:europe');
    if (europe?.type !== 'region') throw new Error('expected region node');
    expect(getRelated(europe, 'straits')).toHaveLength(12);
  });

  it('throws a clear error for unknown relationship names', () => {
    const gibraltar = getStraitEntity(loadStrait('gibraltar'));
    // @ts-expect-error deliberate misuse, as an untyped caller would
    expect(() => getRelated(gibraltar, 'harbors')).toThrow(
      'Unknown relationship "harbors" for entity type "strait"',
    );
  });
});

describe('hierarchy', () => {
  it("a strait's parent is its region; region children include the strait", () => {
    const gibraltar = getStraitEntity(loadStrait('gibraltar'));
    const parents = getParents(gibraltar);
    expect(parents.map((p) => p.entityId)).toEqual(['region:europe']);

    const europe = getEntity('region:europe');
    if (!europe) throw new Error('missing region');
    const children = getChildren(europe);
    expect(children.some((c) => c.entityId === 'strait:gibraltar')).toBe(true);
    expect(children.some((c) => c.type === 'water-body')).toBe(true);
  });

  it('straits have no child content while knowledge collections are empty', () => {
    expect(getChildren(getStraitEntity(loadStrait('gibraltar')))).toEqual([]);
  });

  it('water bodies follow the document hierarchy for parents and children', () => {
    const mediterranean = getEntity('water-body:mediterranean-sea');
    if (mediterranean?.type !== 'water-body') throw new Error('missing water body');

    expect(getParents(mediterranean).map((p) => p.entityId)).toEqual(['water-body:atlantic-ocean']);
    expect(getRelated(mediterranean, 'parent')?.id).toBe('atlantic-ocean');

    const childIds = getChildren(mediterranean).map((c) => c.id);
    expect(childIds).toContain('aegean-sea');
    expect(childIds).toContain('black-sea');

    const atlantic = getEntity('water-body:atlantic-ocean');
    if (atlantic?.type !== 'water-body') throw new Error('missing ocean');
    expect(getParents(atlantic)).toEqual([]);
    expect(getRelated(atlantic, 'children').map((c) => c.id)).toContain('mediterranean-sea');
  });

  it('water bodies cite their sources through the engine', () => {
    const mediterranean = getEntity('water-body:mediterranean-sea');
    if (mediterranean?.type !== 'water-body') throw new Error('missing water body');
    expect(getRelated(mediterranean, 'sources').map((s) => s.id)).toEqual([
      'iho-limits-of-oceans-and-seas',
    ]);
  });
});
