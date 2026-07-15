import { useMemo, useRef, useState } from 'react';

import { STRAITS } from '@fathom/data';

import { AtlasFooter } from '../features/atlas/components/AtlasFooter';
import { AtlasHeader } from '../features/atlas/components/AtlasHeader';
import { MapPanel, type MapPanelHandle } from '../features/atlas/components/MapPanel';
import { RegionChips } from '../features/atlas/components/RegionChips';
import { ResultsGrid } from '../features/atlas/components/ResultsGrid';
import { SearchBar } from '../features/atlas/components/SearchBar';
import { filterStraits, isFiltering, type RegionFilter } from '../features/atlas/lib/filtering';
import { ThemeSwitcher } from '../features/theme/ThemeSwitcher';
import { THEMES } from '../features/theme/themes';
import { useTheme } from '../features/theme/useTheme';

export function App() {
  const { theme, setTheme } = useTheme();
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
    <div className="wrap">
      <AtlasHeader straitCount={STRAITS.length}>
        <ThemeSwitcher theme={theme} onChange={setTheme} />
      </AtlasHeader>

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
        tileStyle={THEMES[theme].tile}
      />

      <ResultsGrid
        straits={filtered}
        totalCount={STRAITS.length}
        query={query}
        onSelect={(id) => mapRef.current?.focusStrait(id)}
        onHover={setHoveredId}
      />

      <AtlasFooter straitCount={STRAITS.length} />
    </div>
  );
}
