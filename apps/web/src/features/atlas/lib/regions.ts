import { STRAIT_REGIONS, type Strait } from '@fathom/data';

import type { RegionFilter } from './filtering';

export const REGION_FILTERS: readonly RegionFilter[] = ['All', ...STRAIT_REGIONS];

export function regionCount(straits: readonly Strait[], region: RegionFilter): number {
  return region === 'All'
    ? straits.length
    : straits.filter((strait) => strait.region === region).length;
}
