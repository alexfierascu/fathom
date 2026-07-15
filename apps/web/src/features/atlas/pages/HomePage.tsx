import { useMemo, useRef, useState } from 'react';

import { useOutletContext } from 'react-router';

import { loadAllStraits } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { MapPanel, type MapPanelHandle } from '../components/MapPanel';
import { RegionChips } from '../components/RegionChips';
import { ResultsGrid } from '../components/ResultsGrid';
import { SearchBar } from '../components/SearchBar';
import { filterStraits, isFiltering, type RegionFilter } from '../lib/filtering';

const STRAITS = loadAllStraits();

export function HomePage() {
  const { tileStyle } = useOutletContext<LayoutContext>();
  const [query, setQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<RegionFilter>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mapRef = useRef<MapPanelHandle>(null);

  const filtered = useMemo(
    () => filterStraits(STRAITS, activeRegion, query),
    [activeRegion, query],
  );
  const filtering = isFiltering(activeRegion, query);
  const filteredIds = useMemo(
    () => (filtering ? new Set(filtered.map((strait) => strait.id)) : null),
    [filtering, filtered],
  );

  return (
    <>
      <div className="controls">
        <SearchBar query={query} onQueryChange={setQuery} />
        <RegionChips
          straits={STRAITS}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
        />
      </div>

      <MapPanel
        ref={mapRef}
        straits={STRAITS}
        filteredIds={filteredIds}
        hoveredId={hoveredId}
        visibleCount={filtering ? filtered.length : STRAITS.length}
        tileStyle={tileStyle}
      />

      <ResultsGrid
        straits={filtered}
        totalCount={STRAITS.length}
        query={query}
        onSelect={(id) => mapRef.current?.focusStrait(id)}
        onHover={setHoveredId}
      />
    </>
  );
}
