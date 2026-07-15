import { describe, expect, it } from 'vitest';

import { createSearchIndex, foldForSearch, groupResults, type SearchDocument } from './engine';

const docs: SearchDocument[] = [
  {
    entityId: 'strait:oresund',
    type: 'strait',
    name: 'Öresund',
    path: '/straits/oresund',
    summary: 'Crossed by the Öresund Bridge.',
    keywords: ['Denmark', 'Sweden', 'Europe'],
  },
  {
    entityId: 'strait:dover',
    type: 'strait',
    name: 'Strait of Dover',
    path: '/straits/dover',
    summary: 'The narrowest point of the Channel.',
    keywords: ['United Kingdom', 'France', 'Europe'],
  },
  {
    entityId: 'water-body:north-sea',
    type: 'water-body',
    name: 'North Sea',
    path: '/water-bodies/north-sea',
    summary: 'A shallow shelf sea.',
    keywords: ['sea'],
  },
  {
    entityId: 'country:denmark',
    type: 'country',
    name: 'Denmark',
    path: '/countries/denmark',
    summary: 'Sits astride the Danish straits.',
    keywords: ['DK', 'country'],
  },
];

const index = createSearchIndex(docs);

describe('foldForSearch', () => {
  it('lowercases and strips diacritics while preserving positions', () => {
    expect(foldForSearch('Öresund')).toBe('oresund');
    expect(foldForSearch('La Pérouse')).toBe('la perouse');
    expect(foldForSearch('Öresund').length).toBe('Öresund'.length);
  });
});

describe('createSearchIndex', () => {
  it('finds entities within a few keystrokes, name prefix first', () => {
    const results = index.search('dov');
    expect(results[0]?.document.entityId).toBe('strait:dover');
  });

  it('matches names regardless of diacritics and highlights the match', () => {
    const results = index.search('ores');
    expect(results[0]?.document.entityId).toBe('strait:oresund');
    expect(results[0]?.nameMatches).toEqual([{ start: 0, end: 4 }]);
  });

  it('ranks name matches above keyword matches', () => {
    const results = index.search('denmark');
    expect(results[0]?.document.entityId).toBe('country:denmark');
    expect(results.map((r) => r.document.entityId)).toContain('strait:oresund');
  });

  it('requires every token to match', () => {
    expect(index.search('north sea')).toHaveLength(1);
    expect(index.search('north atlantis')).toHaveLength(0);
  });

  it('returns nothing for blank queries and respects the limit', () => {
    expect(index.search('   ')).toHaveLength(0);
    expect(index.search('e', { limit: 2 })).toHaveLength(2);
  });

  it('marks word-boundary matches inside names', () => {
    const results = index.search('dover');
    expect(results[0]?.nameMatches).toEqual([{ start: 10, end: 15 }]);
  });
});

describe('groupResults', () => {
  it('groups by type with the best-matching group first', () => {
    const groups = groupResults(index.search('denmark'));
    expect(groups.map((g) => g.type)).toEqual(['country', 'strait']);
    const tied = groupResults(index.search('e'));
    expect(tied.length).toBeGreaterThan(1);
  });
});
