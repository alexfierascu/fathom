import { formatLat, formatLon } from './format';

describe('formatLat', () => {
  it('formats northern and southern latitudes like the prototype', () => {
    expect(formatLat(35.95)).toBe('35.95°N');
    expect(formatLat(-53.5)).toBe('53.50°S');
    expect(formatLat(0)).toBe('0.00°N');
  });
});

describe('formatLon', () => {
  it('formats eastern and western longitudes like the prototype', () => {
    expect(formatLon(56.25)).toBe('56.25°E');
    expect(formatLon(-5.59)).toBe('5.59°W');
    expect(formatLon(0)).toBe('0.00°E');
  });
});
