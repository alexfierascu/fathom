import type { DateValue } from '@fathom/data';

/** "1915–1916", "c. 1520", or "1869" — however precise the record is. */
export function formatDateValue(date: DateValue): string {
  const value = date.end ? `${date.value}–${date.end}` : date.value;
  return date.approximate ? `c. ${value}` : value;
}

export function formatLat(lat: number): string {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
}

export function formatLon(lon: number): string {
  return `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
}
