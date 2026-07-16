import { findTour, TOURS, tourStraits } from './tours';

describe('tours', () => {
  it('every stop on every tour resolves to a charted strait', () => {
    for (const tour of TOURS) {
      const stops = tourStraits(tour);
      expect(stops).toHaveLength(tour.straitIds.length);
      for (const stop of stops) expect(stop.name).toBeTruthy();
    }
  });

  it('has no duplicate stops within a tour', () => {
    for (const tour of TOURS) {
      expect(new Set(tour.straitIds).size).toBe(tour.straitIds.length);
    }
  });

  it('finds tours by slug and rejects unknown slugs', () => {
    expect(findTour('oil-chokepoints')?.title).toBe('The Oil Chokepoints');
    expect(findTour('atlantis')).toBeUndefined();
    expect(findTour(undefined)).toBeUndefined();
  });
});
