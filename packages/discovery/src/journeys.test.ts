import { describe, expect, it } from 'vitest';

import { findJourney, loadJourneys } from './catalog';
import {
  journeyBetween,
  journeyFromRoute,
  journeyVisits,
  locatedStops,
  relatedJourneys,
  straitQuiz,
  validateJourney,
} from './journeys';

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

describe('starter journeys', () => {
  it('every catalog journey is valid — all stops resolve, no duplicates', () => {
    const journeys = loadJourneys();
    expect(journeys.length).toBeGreaterThanOrEqual(7);
    for (const journey of journeys) {
      expect(validateJourney(journey)).toEqual([]);
      expect(journey.estimatedMinutes).toBeGreaterThan(0);
      expect(journey.waypoints.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('finds journeys by slug', () => {
    expect(findJourney('oil-to-europe')?.title).toBe('Oil to Europe');
    expect(findJourney('atlantis')).toBeUndefined();
  });

  it('plots located stops for the map', () => {
    const journey = findJourney('the-worlds-great-chokepoints');
    expect(journey).toBeDefined();
    if (!journey) return;
    const located = locatedStops(journey);
    expect(located.length).toBe(6);
    for (const stop of located) {
      expect(Number.isFinite(stop.lat)).toBe(true);
      expect(Number.isFinite(stop.lon)).toBe(true);
    }
  });

  it('relates journeys through shared stops and tags', () => {
    const subject = findJourney('oil-to-europe');
    if (!subject) throw new Error('missing journey');
    const related = relatedJourneys(subject, loadJourneys());
    expect(related.length).toBeGreaterThan(0);
    expect(related.map((journey) => journey.id)).not.toContain('oil-to-europe');
  });

  it('knows which journeys visit an entity', () => {
    const journey = findJourney('arctic-exploration');
    if (!journey) throw new Error('missing journey');
    expect(journeyVisits(journey, 'strait:bering')).toBe(true);
    expect(journeyVisits(journey, 'strait:gibraltar')).toBe(false);
  });
});

describe('journey generation', () => {
  it('builds a journey from a charted maritime route', () => {
    const journey = journeyFromRoute('europe-asia-via-suez');
    expect(journey).not.toBeNull();
    if (!journey) return;
    expect(validateJourney(journey)).toEqual([]);
    expect(journey.waypoints.map((w) => w.entity.id)).toContain('suez-canal');
  });

  it('generates a passage between two straits via the graph', () => {
    const journey = journeyBetween('gibraltar', 'bosporus');
    expect(journey).not.toBeNull();
    if (!journey) return;
    expect(journey.waypoints[0]?.entity.id).toBe('gibraltar');
    expect(journey.waypoints[journey.waypoints.length - 1]?.entity.id).toBe('bosporus');
    expect(validateJourney(journey)).toEqual([]);
  });

  it('returns null when no passage exists', () => {
    expect(journeyBetween('gibraltar', 'nonexistent')).toBeNull();
  });
});

describe('straitQuiz', () => {
  it('derives question and answer from the document', () => {
    const quiz = straitQuiz('gibraltar', seeded(5));
    expect(quiz).not.toBeNull();
    expect(quiz?.prompt).toContain('Atlantic Ocean');
    expect(quiz?.prompt).toContain('Mediterranean Sea');
    expect(quiz?.answer).toBe('Strait of Gibraltar');
    expect(quiz?.options).toContain('Strait of Gibraltar');
    expect(new Set(quiz?.options).size).toBe(4);
  });

  it('is deterministic for a fixed seed', () => {
    expect(straitQuiz('hormuz', seeded(9))).toEqual(straitQuiz('hormuz', seeded(9)));
  });
});
