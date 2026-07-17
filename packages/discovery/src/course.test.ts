import { describe, expect, it } from 'vitest';

import { loadJourneys } from './catalog';
import { courseLengthKm, journeyCourse } from './course';

describe('journeyCourse', () => {
  it('draws a precise lane for every leg of every starter journey', () => {
    for (const journey of loadJourneys()) {
      const course = journeyCourse(journey);
      const stops = course.filter((point) => point.stopIndex !== undefined);
      // Every located stop appears on the course, in travel order.
      expect(stops.length).toBeGreaterThanOrEqual(2);
      const order = stops.map((stop) => stop.stopIndex ?? -1);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      // Precision geometry: far more lane points than stops.
      expect(course.length).toBeGreaterThan(stops.length * 2);
    }
  });

  it('never jumps across the map — longitudes unwrap continuously', () => {
    for (const journey of loadJourneys()) {
      const course = journeyCourse(journey);
      for (let i = 1; i < course.length; i += 1) {
        const prev = course[i - 1];
        const curr = course[i];
        if (prev && curr) {
          expect(Math.abs(curr.lon - prev.lon)).toBeLessThanOrEqual(180);
        }
      }
    }
  });

  it('anchors stops exactly on the drawn line', () => {
    const journey = loadJourneys().find((j) => j.id === 'oil-to-europe');
    if (!journey) throw new Error('missing journey');
    const course = journeyCourse(journey);
    const hormuz = course.find((point) => point.name === 'Strait of Hormuz');
    expect(hormuz?.lat).toBeCloseTo(26.57);
    expect(hormuz?.lon).toBeCloseTo(56.25);
  });

  it('reports the charted length of precomputed courses', () => {
    const length = courseLengthKm('oil-to-europe');
    expect(length).not.toBeNull();
    // The Gulf to the North Sea via Suez is on the order of 11,000 km.
    expect(length ?? 0).toBeGreaterThan(9000);
    expect(length ?? 0).toBeLessThan(14000);
    expect(courseLengthKm('nonexistent')).toBeNull();
  });
});

describe('leg geometry', () => {
  it('reports charted leg lengths and compass words', async () => {
    const { legBetween, bearingWord } = await import('./course');
    expect(legBetween('oil-to-europe', 1, 2).km).toBeGreaterThan(2000);
    expect(legBetween('oil-to-europe', 0, 99).km).toBeNull();
    expect(bearingWord({ lat: 26.57, lon: 56.25 }, { lat: 12.58, lon: 43.33 })).toBe('south-west');
    expect(bearingWord({ lat: 35.95, lon: -5.59 }, { lat: 51, lon: 1.4 })).toBe('north');
  });
});

describe('chartChallengeFor', () => {
  it('builds a two-answer challenge with decoys for anchored straits', async () => {
    const { chartChallengeFor } = await import('./challenge');
    const challenge = chartChallengeFor({ type: 'strait', id: 'hormuz' });
    expect(challenge).not.toBeNull();
    const correct = challenge?.targets.filter((target) => target.correct).map((t) => t.id) ?? [];
    expect(correct.sort()).toEqual(['gulf-of-oman', 'persian-gulf']);
    expect(challenge?.targets.length).toBeGreaterThanOrEqual(3);
    expect(chartChallengeFor({ type: 'strait', id: 'hormuz' })).toEqual(challenge);
  });

  it('returns null for non-straits', async () => {
    const { chartChallengeFor } = await import('./challenge');
    expect(chartChallengeFor({ type: 'canal', id: 'suez-canal' })).toBeNull();
  });
});
