export type DistanceUnits = 'km' | 'nm';

export function getUnits(): DistanceUnits {
  try {
    return window.localStorage.getItem('fathom-units') === 'nm' ? 'nm' : 'km';
  } catch {
    return 'km';
  }
}

export function setUnits(units: DistanceUnits): void {
  try {
    window.localStorage.setItem('fathom-units', units);
  } catch {
    // Preference simply isn't kept.
  }
}

/** Formats a kilometre figure in the reader's preferred unit. */
export function formatDistance(km: number): string {
  if (getUnits() === 'nm') {
    return `${Math.round(km * 0.539957).toLocaleString()} nm`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}
