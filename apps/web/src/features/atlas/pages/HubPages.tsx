import { useEffect, useState } from 'react';

import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router';

import {
  entityId as canonicalId,
  getEntity,
  loadAllStraits,
  loadImagesFor,
  loadWildlife,
  slugifyName,
} from '@fathom/data';
import { randomEntity } from '@fathom/discovery';

import type { LayoutContext } from '../../../app/RootLayout';
import { Collections, ContinueReading } from '../../explore/HomeDiscovery';
import { mediaSrcSet, mediaUrl } from '../../media/media';
import { DiscoveryRail, type RailItem } from '../components/DiscoveryRail';
import { MapPanel } from '../components/MapPanel';
import { PageHero } from '../components/PageHero';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Section } from '../components/Section';
import { InterestingFacts } from '../components/HomeSections';
import { SeoTags } from '../components/SeoTags';
import { entityPath } from '../lib/entityPaths';

const STRAITS = loadAllStraits();

function straitTile(id: string, name: string, meta?: string): RailItem {
  const image = loadImagesFor({ type: 'strait', id })[0];
  return {
    key: id,
    name,
    to: `/straits/${id}`,
    image: image ? mediaUrl(image.file) : undefined,
    imageSrcSet: image ? mediaSrcSet(image.file) : undefined,
    meta,
  };
}

const metres = (m?: { value: number; unit: string }) =>
  m ? (m.unit === 'm' ? m.value : m.value * 1000) : Infinity;

const FEATURED: readonly RailItem[] = STRAITS.filter(
  (strait) => loadImagesFor({ type: 'strait', id: strait.id }).length > 0,
)
  .slice(0, 14)
  .map((strait) => straitTile(strait.id, strait.name, strait.region));

const CHOKEPOINTS: readonly RailItem[] = STRAITS.filter((strait) =>
  strait.tagIds?.includes('chokepoint'),
).map((strait) => straitTile(strait.id, strait.name, 'Chokepoint'));

const LONGEST: readonly RailItem[] = [...STRAITS]
  .filter((strait) => strait.dimensions?.length)
  .sort((a, b) => (b.dimensions?.length?.value ?? 0) - (a.dimensions?.length?.value ?? 0))
  .slice(0, 10)
  .map((strait) =>
    straitTile(
      strait.id,
      strait.name,
      `${String(strait.dimensions?.length?.value)} ${strait.dimensions?.length?.unit ?? ''}`,
    ),
  );

const NARROWEST: readonly RailItem[] = [...STRAITS]
  .filter((strait) => strait.dimensions?.widthMin)
  .sort((a, b) => metres(a.dimensions?.widthMin) - metres(b.dimensions?.widthMin))
  .slice(0, 10)
  .map((strait) =>
    straitTile(
      strait.id,
      strait.name,
      `${String(strait.dimensions?.widthMin?.value)} ${strait.dimensions?.widthMin?.unit ?? ''}`,
    ),
  );

const REGIONS: readonly RailItem[] = [...new Set(STRAITS.map((strait) => strait.region))]
  .sort()
  .map((region) => ({
    key: region,
    name: region,
    to: `/regions/${slugifyName(region)}`,
    meta: `${String(STRAITS.filter((strait) => strait.region === region).length)} straits`,
  }));

/**
 * Explore — the atlas as a place to browse, not a directory to filter.
 * A calm hero, then rails of immersive tiles: featured waters, the great
 * chokepoints, the longest and narrowest, the collections, and the
 * regions. Search itself lives in the Chart Room.
 */
export function ExplorePage() {
  const { openSearch } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

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
      <article>
        <PageHero
          eyebrow="Explore"
          title="The world's waterways"
          subtitle="Every strait, sea, port and coastline — gathered into collections to wander through. Open the Chart Room to search by name, or let the tide decide."
          actions={
            <>
              <button type="button" className="uc-btn uc-btn--primary" onClick={openSearch}>
                Open the Chart Room
              </button>
              <button type="button" className="uc-btn uc-btn--ghost" onClick={surprise}>
                Let the tide decide ⚄
              </button>
            </>
          }
        />

        <DiscoveryRail eyebrow="Start here" title="Featured waters" items={FEATURED} />
        <DiscoveryRail
          eyebrow="Where the world funnels"
          title="The great chokepoints"
          items={CHOKEPOINTS}
        />
        <DiscoveryRail eyebrow="By the numbers" title="The longest passages" items={LONGEST} />
        <DiscoveryRail eyebrow="By the numbers" title="The narrowest squeezes" items={NARROWEST} />
        <DiscoveryRail eyebrow="By place" title="Browse by region" items={REGIONS} />

        <div className="strait-onward">
          <Collections />
          <ContinueReading />
        </div>
      </article>
    </>
  );
}

/**
 * Map — the chart, nearly fullscreen. One question: "what is nearby?"
 */
export function MapPage() {
  const { tileStyle } = useOutletContext<LayoutContext>();
  const [searchParams] = useSearchParams();
  const [lanes, setLanes] = useState(true);
  const [seaLabels, setSeaLabels] = useState(true);
  const [plot, setPlot] = useState(false);
  const [drift, setDrift] = useState(searchParams.get('drift') === '1');

  useEffect(() => {
    if (!drift) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrift(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [drift]);

  return (
    <>
      <SeoTags
        title="Map — Fathom"
        description="Every charted strait on one interactive map."
        path="/map"
      />
      <div className="map-page">
        <div className="map-toggles">
          <button
            type="button"
            className={lanes ? 'chip chip--on' : 'chip'}
            aria-pressed={lanes}
            onClick={() => {
              setLanes((state) => !state);
            }}
          >
            Trade lanes {lanes ? '✓' : ''}
          </button>
          <button
            type="button"
            className={seaLabels ? 'chip chip--on' : 'chip'}
            aria-pressed={seaLabels}
            onClick={() => {
              setSeaLabels((state) => !state);
            }}
          >
            Seas {seaLabels ? '✓' : ''}
          </button>
          <button
            type="button"
            className={plot ? 'chip chip--on' : 'chip'}
            aria-pressed={plot}
            onClick={() => {
              setPlot((state) => !state);
            }}
          >
            Plot a course
          </button>
          <button
            type="button"
            className={drift ? 'chip chip--on' : 'chip'}
            aria-pressed={drift}
            onClick={() => {
              setDrift((state) => !state);
            }}
          >
            {drift ? 'Drop anchor' : 'Set adrift ⚓'}
          </button>
        </div>
        <MapPanel
          straits={STRAITS}
          filteredIds={null}
          hoveredId={null}
          visibleCount={STRAITS.length}
          lanes={lanes}
          seaLabels={seaLabels}
          plot={plot}
          base="bathymetry"
          drift={drift}
          onDriftStop={() => {
            setDrift(false);
          }}
          tileStyle={tileStyle}
        />
        <p className="map-page-hint note">
          Click any marker to open its strait — every pin is a place to start exploring. Gold rings
          scale with sourced oil flow (EIA 2023).
        </p>
      </div>
    </>
  );
}

/** Records drawn only from straits with sourced dimensions. */
function Records() {
  const measured = STRAITS.filter((strait) => strait.dimensions);
  if (measured.length === 0) return null;
  const narrowest = [...measured]
    .filter((strait) => strait.dimensions?.widthMin)
    .sort((a, b) => {
      const metres = (m?: { value: number; unit: string }) =>
        m ? (m.unit === 'm' ? m.value : m.value * 1000) : Infinity;
      return metres(a.dimensions?.widthMin) - metres(b.dimensions?.widthMin);
    })[0];
  const longest = [...measured]
    .filter((strait) => strait.dimensions?.length)
    .sort((a, b) => (b.dimensions?.length?.value ?? 0) - (a.dimensions?.length?.value ?? 0))[0];

  return (
    <Section label="Records — among straits with charted dimensions">
      <div className="grid">
        {narrowest?.dimensions?.widthMin && (
          <Link viewTransition className="card" to={`/straits/${narrowest.id}`}>
            <div className="eyebrow">Narrowest charted</div>
            <h3>{narrowest.name}</h3>
            <div className="note">
              {String(narrowest.dimensions.widthMin.value)} {narrowest.dimensions.widthMin.unit} at
              its narrowest.
            </div>
          </Link>
        )}
        {longest?.dimensions?.length && (
          <Link viewTransition className="card" to={`/straits/${longest.id}`}>
            <div className="eyebrow">Longest charted</div>
            <h3>{longest.name}</h3>
            <div className="note">
              {String(longest.dimensions.length.value)} {longest.dimensions.length.unit} from end to
              end.
            </div>
          </Link>
        )}
      </div>
    </Section>
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
          <Link viewTransition className="explore-tile" to="/quiz">
            <div className="explore-tile-glyph">?</div>
            <h3>Know your narrows</h3>
            <p>A quiz generated from the charts themselves — never the same twice.</p>
          </Link>
          <Link viewTransition className="explore-tile" to="/timeline">
            <div className="explore-tile-glyph">⌛</div>
            <h3>Travel through time</h3>
            <p>Every event the atlas records, in order, each grounded in its sources.</p>
          </Link>
          <Link viewTransition className="explore-tile" to="/compare">
            <div className="explore-tile-glyph">⇄</div>
            <h3>Compare straits</h3>
            <p>Two narrows side by side — geography, countries, and crossings.</p>
          </Link>
          <Link viewTransition className="explore-tile" to="/daily">
            <div className="explore-tile-glyph">⚓</div>
            <h3>Daily Expedition</h3>
            <p>A new generated passage every day — same course for everyone.</p>
          </Link>
          <Link viewTransition className="explore-tile" to="/six-degrees">
            <div className="explore-tile-glyph">⛓</div>
            <h3>Six Degrees of Sea</h3>
            <p>Reach a far strait using only the atlas's own connections.</p>
          </Link>
          <Link viewTransition className="explore-tile" to="/profile">
            <div className="explore-tile-glyph">★</div>
            <h3>Captain's Log</h3>
            <p>Your rank, voyages, trophies, and everything learned at sea.</p>
          </Link>
        </div>

        <Records />

        <Collections />
        <InterestingFacts />
      </article>
    </>
  );
}

/** Wildlife of the narrows — the corridor species, each with its waters. */
export function WildlifePage() {
  const species = loadWildlife();
  return (
    <>
      <SeoTags
        title="Wildlife of the narrows — Fathom"
        description="The documented species that migrate, hunt, and winter in the world's straits."
        path="/wildlife"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wildlife' }]} />
      <article className="detail">
        <header className="hub-header">
          <h2 className="detail-title detail-title--hero">Wildlife of the narrows</h2>
          <p className="note note--lede">
            Straits concentrate life as much as shipping — every species here is documented in its
            cited source.
          </p>
        </header>
        <div className="grid">
          {species.map((animal) => {
            const habitat = animal.habitats[0];
            const node = habitat ? getEntity(canonicalId(habitat.type, habitat.id)) : null;
            return (
              <div key={animal.id} className="card" style={{ cursor: 'default' }}>
                <div className="eyebrow">{animal.scientificName}</div>
                <h3>{animal.commonName}</h3>
                <div className="note">{animal.summary}</div>
                {node && habitat && (
                  <div className="pills" style={{ marginTop: 12 }}>
                    <Link viewTransition className="pill pill--tag" to={`/straits/${habitat.id}`}>
                      {node.name}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </article>
    </>
  );
}
