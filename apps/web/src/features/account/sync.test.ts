import { describe, expect, it } from 'vitest';

import { isSyncableKey, mergeValue } from './sync';

describe('mergeValue', () => {
  it('takes whichever side exists', () => {
    expect(mergeValue('fathom-days', null, ['2026-07-01'])).toEqual(['2026-07-01']);
    expect(mergeValue('fathom-days', ['2026-07-01'], null)).toEqual(['2026-07-01']);
  });

  it('unions visited places, keeping the earlier first-visit date', () => {
    const merged = mergeValue(
      'fathom-visited',
      { 'strait:gibraltar': '2026-07-10', 'strait:hormuz': '2026-07-12' },
      { 'strait:gibraltar': '2026-07-01', 'strait:bosporus': '2026-07-05' },
    );
    expect(merged).toEqual({
      'strait:gibraltar': '2026-07-01',
      'strait:hormuz': '2026-07-12',
      'strait:bosporus': '2026-07-05',
    });
  });

  it('unions and sorts days at sea', () => {
    expect(
      mergeValue('fathom-days', ['2026-07-03', '2026-07-01'], ['2026-07-02', '2026-07-01']),
    ).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });

  it('unions favourites by place', () => {
    const merged = mergeValue(
      'fathom-favourites',
      [{ entityId: 'strait:a', name: 'A', path: '/a' }],
      [
        { entityId: 'strait:a', name: 'A (old)', path: '/a' },
        { entityId: 'strait:b', name: 'B', path: '/b' },
      ],
    ) as { entityId: string; name: string }[];
    expect(merged).toHaveLength(2);
    // The local copy of a shared favourite wins.
    expect(merged.find((p) => p.entityId === 'strait:a')?.name).toBe('A');
  });

  it('keeps the high-water quiz score per tier', () => {
    expect(
      mergeValue('fathom-quiz-best', { navigator: 6, pilot: 9 }, { navigator: 8, apprentice: 5 }),
    ).toEqual({ navigator: 8, pilot: 9, apprentice: 5 });
  });

  it('prefers the finished journey, then the further stop', () => {
    expect(
      mergeValue(
        'fathom-journey-oil-to-europe',
        { started: true, finished: false, stop: 3 },
        { started: true, finished: true, stop: 1, finishedOn: '2026-07-01' },
      ),
    ).toMatchObject({ finished: true, finishedOn: '2026-07-01' });
    expect(
      mergeValue(
        'fathom-journey-oil-to-europe',
        { started: true, stop: 5 },
        { started: true, stop: 2 },
      ),
    ).toMatchObject({ stop: 5 });
  });

  it('keeps the earliest completion date when both ships finished', () => {
    expect(
      mergeValue(
        'fathom-journey-x',
        { finished: true, stop: 7, finishedOn: '2026-07-10' },
        { finished: true, stop: 7, finishedOn: '2026-07-02' },
      ),
    ).toMatchObject({ finishedOn: '2026-07-02' });
  });

  it('unions journey logs and keeps the better exam', () => {
    const merged = mergeValue(
      'fathom-journey-log-x',
      { quiz: { '0:a': true }, challenges: { '1': true }, exam: { score: 6, total: 10, passed: false } },
      { quiz: { '2:b': false }, challenges: { '3': true }, exam: { score: 9, total: 10, passed: true } },
    );
    expect(merged).toEqual({
      quiz: { '0:a': true, '2:b': false },
      challenges: { '1': true, '3': true },
      exam: { score: 9, total: 10, passed: true },
    });
  });

  it('only syncs captain-log keys', () => {
    expect(isSyncableKey('fathom-journey-log-x')).toBe(true);
    expect(isSyncableKey('fathom-visited')).toBe(true);
    expect(isSyncableKey('fathom-locale')).toBe(false);
    expect(isSyncableKey('fathom-identity')).toBe(false);
  });
});
