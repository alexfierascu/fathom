import { beforeEach, describe, expect, it } from 'vitest';

import {
  ACHIEVEMENTS,
  achievementPoints,
  computeStreaks,
  EMPTY_STATS,
  evaluateAchievements,
  gatherStats,
  longestRun,
  RANKS,
  rankFor,
  totalXp,
  xpLedger,
  type VoyageStats,
} from './engine';
import { recordExploration, toggleFavourite } from './store';

const stats = (patch: Partial<VoyageStats>): VoyageStats => ({ ...EMPTY_STATS, ...patch });

describe('xp', () => {
  it('is zero for a fresh log', () => {
    expect(totalXp(EMPTY_STATS)).toBe(0);
    expect(xpLedger(EMPTY_STATS)).toEqual([]);
  });

  it('rewards distinct exploration, not repetition', () => {
    const once = stats({ visitedStraits: ['gibraltar'] });
    expect(totalXp(once)).toBe(15);
    // The same strait can only ever appear once — there is no way to
    // farm XP by revisiting; the ledger reads from a first-visit set.
    const learned = stats({ journeysFinished: ['oil-to-europe'], stopsTravelled: 8 });
    expect(totalXp(learned)).toBe(100 + 80);
  });

  it('itemises every source in the ledger', () => {
    const s = stats({
      visitedStraits: ['a', 'b'],
      honours: ['j'],
      quizBest: { pilot: 8 },
      activeDays: ['2026-07-15'],
    });
    const labels = xpLedger(s).map((line) => line.label);
    expect(labels).toEqual([
      'Straits explored',
      'Exams passed with honours',
      'Quiz best scores',
      'Days at sea',
    ]);
    expect(totalXp(s)).toBe(30 + 150 + 80 + 5);
  });
});

describe('ranks', () => {
  it('starts every mariner as Cadet', () => {
    const { rank, next, progress } = rankFor(0);
    expect(rank.title).toBe('Cadet');
    expect(next?.title).toBe('Deckhand');
    expect(progress).toBe(0);
  });

  it('is monotonic and ends at Grand Explorer', () => {
    const thresholds = RANKS.map((rank) => rank.atXp);
    expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds);
    const top = rankFor(999_999);
    expect(top.rank.title).toBe('Grand Explorer');
    expect(top.next).toBeNull();
    expect(top.progress).toBe(1);
  });

  it('reports progress toward the next rank', () => {
    const { rank, next, progress } = rankFor(175);
    expect(rank.title).toBe('Deckhand');
    expect(next?.title).toBe('Able Seaman');
    expect(progress).toBeCloseTo(0.5);
  });
});

describe('streaks', () => {
  it('counts a run ending today', () => {
    const s = stats({ activeDays: ['2026-07-13', '2026-07-14', '2026-07-15'] });
    expect(computeStreaks(s, '2026-07-15').current).toBe(3);
  });

  it('survives until a full day is missed', () => {
    const s = stats({ activeDays: ['2026-07-13', '2026-07-14'] });
    expect(computeStreaks(s, '2026-07-15').current).toBe(2);
    expect(computeStreaks(s, '2026-07-16').current).toBe(0);
  });

  it('tracks the longest run independently of today', () => {
    expect(longestRun(['2026-01-01', '2026-01-02', '2026-01-03', '2026-02-01'])).toBe(3);
    expect(longestRun([])).toBe(0);
  });

  it('derives the exploring streak from first-visit dates', () => {
    const s = stats({
      firstVisits: { 'strait:a': '2026-07-14', 'strait:b': '2026-07-15' },
    });
    expect(computeStreaks(s, '2026-07-15').exploring).toBe(2);
  });
});

describe('achievements', () => {
  it('all start unearned and have unique ids', () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(evaluateAchievements(EMPTY_STATS).every((a) => !a.isEarned)).toBe(true);
    expect(achievementPoints(EMPTY_STATS)).toBe(0);
  });

  it('earns First Landfall on the first completed journey', () => {
    const earned = evaluateAchievements(stats({ journeysFinished: ['oil-to-europe'] }));
    expect(earned.find((a) => a.id === 'first-landfall')?.isEarned).toBe(true);
    expect(earned.find((a) => a.id === 'five-voyages')?.isEarned).toBe(false);
  });

  it('specialist trophies key on real journey ids', () => {
    const earned = evaluateAchievements(
      stats({ journeysFinished: ['arctic-exploration', 'gateway-to-the-mediterranean'] }),
    );
    expect(earned.find((a) => a.id === 'arctic-explorer')?.isEarned).toBe(true);
    expect(earned.find((a) => a.id === 'mediterranean-specialist')?.isEarned).toBe(true);
    expect(earned.find((a) => a.id === 'chokepoint-master')?.isEarned).toBe(false);
  });
});

describe('gatherStats', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads journeys, logs, and the lifetime visited set', () => {
    window.localStorage.setItem(
      'fathom-journey-oil-to-europe',
      JSON.stringify({ finished: true, stop: 7 }),
    );
    window.localStorage.setItem(
      'fathom-journey-log-oil-to-europe',
      JSON.stringify({
        quiz: { '0:a': true, '1:b': false },
        challenges: { '2': true },
        exam: { passed: true },
      }),
    );
    window.localStorage.setItem(
      'fathom-journey-daily-2026-07-15',
      JSON.stringify({ finished: true }),
    );
    recordExploration('strait:gibraltar');
    recordExploration('strait:gibraltar');
    recordExploration('water-body:atlantic-ocean');
    toggleFavourite({
      entityId: 'strait:gibraltar',
      name: 'Gibraltar',
      path: '/straits/gibraltar',
    });

    const s = gatherStats();
    expect(s.journeysFinished).toEqual(['oil-to-europe']);
    expect(s.dailiesFinished).toBe(1);
    expect(s.honours).toEqual(['oil-to-europe']);
    expect(s.quizCorrect).toBe(1);
    expect(s.quizAnswered).toBe(2);
    expect(s.challengesCompleted).toBe(1);
    expect(s.visitedStraits).toEqual(['gibraltar']);
    expect(s.visitedSeas).toEqual(['atlantic-ocean']);
    expect(s.favourites).toHaveLength(1);
    expect(s.activeDays).toHaveLength(1);
  });

  it('unpins a favourite on the second toggle', () => {
    const place = { entityId: 'strait:hormuz', name: 'Hormuz', path: '/straits/hormuz' };
    expect(toggleFavourite(place)).toBe(true);
    expect(toggleFavourite(place)).toBe(false);
    expect(gatherStats().favourites).toEqual([]);
  });
});
