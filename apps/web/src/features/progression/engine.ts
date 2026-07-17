import { loadJourneys } from '@fathom/discovery';

import { loadActiveDays, loadFavourites, loadVisited, type FavouritePlace } from './store';

/**
 * The progression engine: pure functions over what the traveller has
 * actually done. XP rewards exploration and learning — first visits,
 * completed voyages, passed exams, best quiz scores — never repetition:
 * everything is counted from high-water marks and distinct sets, so
 * replaying grants nothing.
 *
 * Local-first: stats gather from the same browser storage the journeys
 * write. An account adds persistence and identity on top, not a
 * different model.
 */

export interface VoyageStats {
  journeysFinished: string[];
  honours: string[];
  stopsTravelled: number;
  challengesCompleted: number;
  quizBest: Partial<Record<'apprentice' | 'navigator' | 'pilot', number>>;
  quizCorrect: number;
  quizAnswered: number;
  dailiesFinished: number;
  visitedStraits: string[];
  visitedSeas: string[];
  visitedCountries: string[];
  /** Canonical id → first-explored date, for the exploration streak. */
  firstVisits: Record<string, string>;
  /** Distinct days the atlas was used, oldest first. */
  activeDays: string[];
  favourites: FavouritePlace[];
}

export const EMPTY_STATS: VoyageStats = {
  journeysFinished: [],
  honours: [],
  stopsTravelled: 0,
  challengesCompleted: 0,
  quizBest: {},
  quizCorrect: 0,
  quizAnswered: 0,
  dailiesFinished: 0,
  visitedStraits: [],
  visitedSeas: [],
  visitedCountries: [],
  firstVisits: {},
  activeDays: [],
  favourites: [],
};

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

/** Everything the browser remembers, as one stats object. */
export function gatherStats(): VoyageStats {
  const stats: VoyageStats = {
    ...EMPTY_STATS,
    journeysFinished: [],
    honours: [],
    quizBest: {},
    visitedStraits: [],
    visitedSeas: [],
    visitedCountries: [],
    firstVisits: {},
    activeDays: [],
    favourites: [],
  };
  try {
    const journeyIds = new Set(loadJourneys().map((journey) => journey.id));
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('fathom-journey-log-')) {
        const id = key.slice('fathom-journey-log-'.length);
        const log = read(key) as {
          quiz?: Record<string, boolean>;
          challenges?: Record<string, boolean>;
          exam?: { passed?: boolean };
        } | null;
        const answers = Object.values(log?.quiz ?? {});
        stats.quizCorrect += answers.filter(Boolean).length;
        stats.quizAnswered += answers.length;
        stats.challengesCompleted += Object.keys(log?.challenges ?? {}).length;
        if (log?.exam?.passed) stats.honours.push(id);
      } else if (key.startsWith('fathom-journey-')) {
        const id = key.slice('fathom-journey-'.length);
        const progress = read(key) as { finished?: boolean; stop?: number } | null;
        stats.stopsTravelled += (progress?.stop ?? 0) + (progress?.finished ? 1 : 0);
        if (progress?.finished) {
          if (id.startsWith('daily-')) stats.dailiesFinished += 1;
          else if (journeyIds.has(id)) stats.journeysFinished.push(id);
        }
      }
    }
  } catch {
    return stats;
  }
  const best = read('fathom-quiz-best') as VoyageStats['quizBest'] | null;
  if (best) stats.quizBest = best;
  stats.firstVisits = loadVisited();
  for (const canonicalId of Object.keys(stats.firstVisits)) {
    const [type, id] = canonicalId.split(':');
    if (!id) continue;
    if (type === 'strait') stats.visitedStraits.push(id);
    else if (type === 'water-body') stats.visitedSeas.push(id);
    else if (type === 'country') stats.visitedCountries.push(id);
  }
  stats.activeDays = loadActiveDays();
  stats.favourites = loadFavourites();
  return stats;
}

// ---------------------------------------------------------------------------
// Streaks

export interface Streaks {
  /** Consecutive days at sea, ending today or yesterday. */
  current: number;
  longest: number;
  /** Consecutive days on which something new was explored. */
  exploring: number;
}

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso}T00:00Z`) / DAY_MS);

function runEndingNow(days: readonly string[], todayIso: string): number {
  const numbers = [...new Set(days.map(dayNumber))].filter(Number.isFinite).sort((a, b) => a - b);
  const now = dayNumber(todayIso);
  let run = 0;
  let expected = now;
  for (let i = numbers.length - 1; i >= 0; i -= 1) {
    const day = numbers[i]!;
    // A streak survives until a full day is missed, so it may end yesterday.
    if (run === 0 && day === now - 1) expected = now - 1;
    if (day !== expected) break;
    run += 1;
    expected -= 1;
  }
  return run;
}

export function longestRun(days: readonly string[]): number {
  const numbers = [...new Set(days.map(dayNumber))].filter(Number.isFinite).sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let previous = Number.NaN;
  for (const day of numbers) {
    run = day === previous + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return longest;
}

export function computeStreaks(stats: VoyageStats, todayIso: string): Streaks {
  return {
    current: runEndingNow(stats.activeDays, todayIso),
    longest: longestRun(stats.activeDays),
    exploring: runEndingNow(Object.values(stats.firstVisits), todayIso),
  };
}

// ---------------------------------------------------------------------------
// XP

export interface XpLine {
  label: string;
  xp: number;
}

/** The ledger: every XP source, itemised. */
export function xpLedger(stats: VoyageStats): XpLine[] {
  const lines: XpLine[] = [];
  const add = (label: string, xp: number) => {
    if (xp > 0) lines.push({ label, xp });
  };
  add('Straits explored', stats.visitedStraits.length * 15);
  add('Seas explored', stats.visitedSeas.length * 10);
  add('Countries explored', stats.visitedCountries.length * 5);
  add('Journey stops travelled', stats.stopsTravelled * 10);
  add('Journeys completed', stats.journeysFinished.length * 100);
  add('Daily expeditions completed', stats.dailiesFinished * 60);
  add('Exams passed with honours', stats.honours.length * 150);
  add('Chart challenges completed', stats.challengesCompleted * 40);
  const quizXp = Object.values(stats.quizBest).reduce((sum, score) => sum + (score ?? 0) * 10, 0);
  add('Quiz best scores', quizXp);
  add('Days at sea', stats.activeDays.length * 5);
  return lines;
}

export function totalXp(stats: VoyageStats): number {
  return xpLedger(stats).reduce((sum, line) => sum + line.xp, 0);
}

// ---------------------------------------------------------------------------
// Ranks

export interface Rank {
  id: string;
  title: string;
  atXp: number;
  /** The privilege line shown when a rank unlocks something. */
  unlocks?: string;
}

export const RANKS: readonly Rank[] = [
  { id: 'cadet', title: 'Cadet', atXp: 0 },
  { id: 'deckhand', title: 'Deckhand', atXp: 100 },
  { id: 'able-seaman', title: 'Able Seaman', atXp: 250 },
  { id: 'helmsman', title: 'Helmsman', atXp: 500 },
  { id: 'boatswain', title: 'Boatswain', atXp: 800 },
  { id: 'second-officer', title: 'Second Officer', atXp: 1200 },
  { id: 'navigator', title: 'Navigator', atXp: 1700, unlocks: 'Custom portrait' },
  { id: 'first-officer', title: 'First Officer', atXp: 2300 },
  { id: 'captain', title: 'Captain', atXp: 3000 },
  { id: 'commodore', title: 'Commodore', atXp: 4000 },
  { id: 'admiral', title: 'Admiral', atXp: 5500 },
  { id: 'grand-explorer', title: 'Grand Explorer', atXp: 7500 },
];

/** The XP at which the custom-portrait privilege unlocks. */
export const CUSTOM_AVATAR_XP = 1700;

export interface RankState {
  rank: Rank;
  next: Rank | null;
  /** 0..1 of the way from this rank to the next. */
  progress: number;
}

export function rankFor(xp: number): RankState {
  let rank = RANKS[0]!;
  let next: Rank | null = null;
  for (const candidate of RANKS) {
    if (xp >= candidate.atXp) rank = candidate;
    else {
      next = candidate;
      break;
    }
  }
  const progress = next ? Math.min(1, Math.max(0, (xp - rank.atXp) / (next.atXp - rank.atXp))) : 1;
  return { rank, next, progress };
}

// ---------------------------------------------------------------------------
// Achievements — a declarative, extensible framework

export type TrophyKind =
  | 'compass'
  | 'sextant'
  | 'anchor'
  | 'wheel'
  | 'star'
  | 'flag'
  | 'insignia'
  | 'medal'
  | 'map'
  | 'knot'
  | 'lighthouse'
  | 'telescope';

export interface AchievementSpec {
  id: string;
  name: string;
  line: string;
  trophy: TrophyKind;
  points: number;
  earned: (stats: VoyageStats) => boolean;
}

const OCEAN_IDS = ['atlantic-ocean', 'pacific-ocean', 'indian-ocean', 'arctic-ocean'];

export const ACHIEVEMENTS: readonly AchievementSpec[] = [
  {
    id: 'first-landfall',
    name: 'First Landfall',
    line: 'Complete any journey',
    trophy: 'anchor',
    points: 10,
    earned: (s) => s.journeysFinished.length + s.dailiesFinished >= 1,
  },
  {
    id: 'five-voyages',
    name: 'Five Voyages',
    line: 'Complete five journeys',
    trophy: 'wheel',
    points: 30,
    earned: (s) => s.journeysFinished.length + s.dailiesFinished >= 5,
  },
  {
    id: 'around-the-world',
    name: 'Around the World',
    line: 'Complete every charted journey',
    trophy: 'map',
    points: 60,
    earned: (s) => s.journeysFinished.length >= 7,
  },
  {
    id: 'chokepoint-master',
    name: 'Master of Chokepoints',
    line: "Complete The World's Great Chokepoints",
    trophy: 'insignia',
    points: 25,
    earned: (s) => s.journeysFinished.includes('the-worlds-great-chokepoints'),
  },
  {
    id: 'arctic-explorer',
    name: 'Arctic Explorer',
    line: 'Complete Arctic Exploration',
    trophy: 'star',
    points: 25,
    earned: (s) => s.journeysFinished.includes('arctic-exploration'),
  },
  {
    id: 'mediterranean-specialist',
    name: 'Mediterranean Specialist',
    line: 'Complete Gateway to the Mediterranean',
    trophy: 'flag',
    points: 25,
    earned: (s) => s.journeysFinished.includes('gateway-to-the-mediterranean'),
  },
  {
    id: 'examiner',
    name: 'Examiner',
    line: 'Pass any journey exam with honours',
    trophy: 'medal',
    points: 30,
    earned: (s) => s.honours.length >= 1,
  },
  {
    id: 'history-expert',
    name: 'History Expert',
    line: 'Pass three journey exams',
    trophy: 'telescope',
    points: 50,
    earned: (s) => s.honours.length >= 3,
  },
  {
    id: 'quiz-champion',
    name: 'Quiz Champion',
    line: 'Answer 25 quiz questions correctly',
    trophy: 'sextant',
    points: 30,
    earned: (s) => s.quizCorrect >= 25,
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    line: 'Score 10 of 10 on any quiz tier',
    trophy: 'star',
    points: 40,
    earned: (s) => Object.values(s.quizBest).some((score) => (score ?? 0) >= 10),
  },
  {
    id: 'pilots-ticket',
    name: "Pilot's Ticket",
    line: 'Score 8 or more on the Pilot tier',
    trophy: 'compass',
    points: 35,
    earned: (s) => (s.quizBest.pilot ?? 0) >= 8,
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    line: 'Complete five chart challenges',
    trophy: 'compass',
    points: 25,
    earned: (s) => s.challengesCompleted >= 5,
  },
  {
    id: 'tide-follower',
    name: 'Tide Follower',
    line: 'Complete three daily expeditions',
    trophy: 'knot',
    points: 20,
    earned: (s) => s.dailiesFinished >= 3,
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    line: 'Explore 25 different straits',
    trophy: 'map',
    points: 40,
    earned: (s) => s.visitedStraits.length >= 25,
  },
  {
    id: 'ocean-walker',
    name: 'Visited Every Ocean',
    line: 'Read the pages of all four charted oceans',
    trophy: 'wheel',
    points: 30,
    earned: (s) => OCEAN_IDS.every((id) => s.visitedSeas.includes(id)),
  },
  {
    id: 'keeper-of-the-light',
    name: 'Keeper of the Light',
    line: 'Save five favourite places',
    trophy: 'lighthouse',
    points: 15,
    earned: (s) => s.favourites.length >= 5,
  },
  {
    id: 'watchkeeper',
    name: 'Watchkeeper',
    line: 'Seven consecutive days at sea',
    trophy: 'flag',
    points: 25,
    earned: (s) => longestRun(s.activeDays) >= 7,
  },
];

export interface EarnedAchievement extends AchievementSpec {
  isEarned: boolean;
}

export function evaluateAchievements(stats: VoyageStats): EarnedAchievement[] {
  return ACHIEVEMENTS.map((spec) => ({ ...spec, isEarned: spec.earned(stats) }));
}

export function achievementPoints(stats: VoyageStats): number {
  return evaluateAchievements(stats)
    .filter((achievement) => achievement.isEarned)
    .reduce((sum, achievement) => sum + achievement.points, 0);
}
