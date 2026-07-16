import { useMemo, useState } from 'react';

import { useOutletContext, useSearchParams } from 'react-router';

import { loadAllStraits } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { MapPanel } from '../components/MapPanel';
import { GlobalSearch } from '../../search/GlobalSearch';
import {
  Chokepoints,
  ExploreSections,
  InterestingFacts,
  RecentlyCharted,
} from '../components/HomeSections';
import { SeoTags } from '../components/SeoTags';
import { RegionChips } from '../components/RegionChips';
import { ResultsGrid } from '../components/ResultsGrid';
import { filterStraits, isFiltering, type RegionFilter } from '../lib/filtering';
import { REGION_FILTERS } from '../lib/regions';

const STRAITS = loadAllStraits();

export function HomePage() {
  const { tileStyle } = useOutletContext<LayoutContext>();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  // Region search results land on /?region=…; adopt it as the active filter,
  // both on first load and when it changes. State is adjusted during render
  // (not in an effect) per React guidance.
  const regionParam = searchParams.get('region');
  const validRegion = (value: string | null): value is RegionFilter =>
    value !== null && (REGION_FILTERS as readonly string[]).includes(value);
  const [activeRegion, setActiveRegion] = useState<RegionFilter>(
    validRegion(regionParam) ? regionParam : 'All',
  );
  const [adoptedParam, setAdoptedParam] = useState(regionParam);
  if (regionParam !== adoptedParam) {
    setAdoptedParam(regionParam);
    if (validRegion(regionParam)) {
      setActiveRegion(regionParam);
    }
  }
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
      <SeoTags
        title="Fathom — The Definitive Atlas of the World's Straits"
        description="The definitive interactive atlas of the world's straits — the narrow waters where oceans meet and history turns. Searchable, mapped, and sourced."
        path="/"
        ogType="website"
      />

      <div className="controls">
        <GlobalSearch query={query} onQueryChange={setQuery} />
        <RegionChips
          straits={STRAITS}
          activeRegion={activeRegion}
          onRegionChange={setActiveRegion}
        />
      </div>

      <Chokepoints />

      <MapPanel
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
        onHover={setHoveredId}
      />

      <ExploreSections />
      <InterestingFacts />
      <RecentlyCharted />
    </>
  );
}
