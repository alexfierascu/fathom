import type { Strait } from '@fathom/data';

import type { RegionFilter } from '../lib/filtering';
import { REGION_FILTERS, regionCount } from '../lib/regions';

interface RegionChipsProps {
  straits: readonly Strait[];
  activeRegion: RegionFilter;
  onRegionChange: (region: RegionFilter) => void;
}

export function RegionChips({ straits, activeRegion, onRegionChange }: RegionChipsProps) {
  return (
    <div className="chips" role="group" aria-label="Filter by region">
      {REGION_FILTERS.map((region) => (
        <button
          key={region}
          type="button"
          className="chip"
          aria-pressed={region === activeRegion}
          onClick={() => {
            onRegionChange(region);
          }}
        >
          {region} <span className="chip-count">{regionCount(straits, region)}</span>
        </button>
      ))}
    </div>
  );
}
