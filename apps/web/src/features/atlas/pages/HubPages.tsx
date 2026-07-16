import { useMemo, useState } from 'react';

import { Link, useNavigate, useOutletContext } from 'react-router';

import { loadAllStraits } from '@fathom/data';
import { randomEntity } from '@fathom/discovery';

import type { LayoutContext } from '../../../app/RootLayout';
import { Collections, ContinueReading, PopularTags } from '../../explore/HomeDiscovery';
import { GlobalSearch } from '../../search/GlobalSearch';
import { MapPanel } from '../components/MapPanel';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Chokepoints,
  ExploreSections,
  InterestingFacts,
  RecentlyCharted,
} from '../components/HomeSections';
import { RegionChips } from '../components/RegionChips';
import { ResultsGrid } from '../components/ResultsGrid';
import { SeoTags } from '../components/SeoTags';
import { entityPath } from '../lib/entityPaths';
import { filterStraits, isFiltering, type RegionFilter } from '../lib/filtering';

const STRAITS = loadAllStraits();

/**
 * Explore — the browse hub. Everything the atlas can list lives here:
 * search, the region-filtered index, and the directories. One page, one
 * question: "what should I explore?"
 */
export function ExplorePage() {
  const [query, setQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<RegionFilter>('All');
  const navigate = useNavigate();

  const filtered = useMemo(
    () => filterStraits(STRAITS, activeRegion, query),
    [activeRegion, query],
  );
  const filtering = isFiltering(activeRegion, query);

  const surprise = () => {
    const pick = randomEntity();
    const path = pick ? entityPath(pick) : null;
    if (path) void navigate(path);
  };

  return (
    <>
      <SeoTags
        title="Explore — Fathom"
        description="Browse the world's straits, seas, countries, and maritime structures."
        path="/explore"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Explore' }]} />
      <article className="detail">
        <header className="hub-header">
          <h2 className="detail-title detail-title--hero">Explore</h2>
          <p className="note note--lede">
            Browse the world's waterways — or{' '}
            <button type="button" className="link-button" onClick={surprise}>
              let the tide decide ⚄
            </button>
            .
          </p>
        </header>

        <div className="controls">
          <GlobalSearch query={query} onQueryChange={setQuery} />
          <RegionChips
            straits={STRAITS}
            activeRegion={activeRegion}
            onRegionChange={setActiveRegion}
          />
        </div>

        <ResultsGrid straits={filtered} totalCount={STRAITS.length} query={query} />

        {!filtering && (
          <>
            <Chokepoints />
            <ExploreSections />
            <PopularTags />
            <ContinueReading />
            <RecentlyCharted />
          </>
        )}
      </article>
    </>
  );
}

/**
 * Map — the chart, nearly fullscreen. One question: "what is nearby?"
 */
export function MapPage() {
  const { tileStyle } = useOutletContext<LayoutContext>();
  return (
    <>
      <SeoTags
        title="Map — Fathom"
        description="Every charted strait on one interactive map."
        path="/map"
      />
      <div className="map-page">
        <MapPanel
          straits={STRAITS}
          filteredIds={null}
          hoveredId={null}
          visibleCount={STRAITS.length}
          tileStyle={tileStyle}
        />
        <p className="map-page-hint note">
          Click any marker to open its strait — every pin is a place to start exploring.
        </p>
      </div>
    </>
  );
}

/**
 * Learn — the educational shelf: quizzes, the timeline, collections, and
 * the comparison tool. One question: "what did I learn?"
 */
export function LearnPage() {
  return (
    <>
      <SeoTags
        title="Learn — Fathom"
        description="Quizzes, history, collections, and stories from the world's straits."
        path="/learn"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Learn' }]} />
      <article className="detail">
        <header className="hub-header">
          <h2 className="detail-title detail-title--hero">Learn</h2>
          <p className="note note--lede">
            The atlas as a teacher — test yourself, travel through time, and follow the themes that
            connect the narrows.
          </p>
        </header>

        <div className="explore-tiles">
          <Link className="explore-tile" to="/quiz">
            <div className="explore-tile-glyph">?</div>
            <h3>Know your narrows</h3>
            <p>A quiz generated from the charts themselves — never the same twice.</p>
          </Link>
          <Link className="explore-tile" to="/timeline">
            <div className="explore-tile-glyph">⌛</div>
            <h3>Travel through time</h3>
            <p>Every event the atlas records, in order, each grounded in its sources.</p>
          </Link>
          <Link className="explore-tile" to="/compare">
            <div className="explore-tile-glyph">⇄</div>
            <h3>Compare straits</h3>
            <p>Two narrows side by side — geography, countries, and crossings.</p>
          </Link>
        </div>

        <Collections />
        <InterestingFacts />
      </article>
    </>
  );
}
