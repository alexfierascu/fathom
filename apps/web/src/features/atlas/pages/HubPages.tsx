import { useEffect, useState } from 'react';

import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router';

import {
  entityId as canonicalId,
  getEntity,
  loadAllStraits,
  loadHistoricalEvents,
  loadImagesFor,
  loadStatisticsFor,
  loadWildlife,
} from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { Collections, ContinueReading } from '../../explore/HomeDiscovery';
import { mediaSrcSet, mediaUrl } from '../../media/media';
import { DiscoveryRail, type RailItem } from '../components/DiscoveryRail';
import { EditorialSection } from '../components/EditorialSection';
import { MapPanel } from '../components/MapPanel';
import { PageHero } from '../components/PageHero';
import { Section } from '../components/Section';
import { InterestingFacts } from '../components/HomeSections';
import { SeoTags } from '../components/SeoTags';

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

/** Tiles for a themed set of straits, showing each strait's region as context. */
const themeTiles = (list: readonly (typeof STRAITS)[number][]): RailItem[] =>
  list.map((strait) => straitTile(strait.id, strait.name, strait.region));

const metres = (m?: { value: number; unit: string }) =>
  m ? (m.unit === 'm' ? m.value : m.value * 1000) : Infinity;

const hasTag = (id: string) => (strait: (typeof STRAITS)[number]) => strait.tagIds?.includes(id);

// Straits seen through data, not entity lists: which appear in history, which
// shelter wildlife, which carry sourced energy flows.
const EVENT_STRAIT_IDS = new Set(
  loadHistoricalEvents().flatMap((event) =>
    event.involves.filter((ref) => ref.type === 'strait').map((ref) => ref.id),
  ),
);
const WILDLIFE_STRAIT_IDS = new Set(
  loadWildlife().flatMap((animal) =>
    animal.habitats.filter((habitat) => habitat.type === 'strait').map((habitat) => habitat.id),
  ),
);
const ENERGY_STRAIT_IDS = new Set(
  STRAITS.filter((strait) =>
    loadStatisticsFor({ type: 'strait', id: strait.id }).some((stat) =>
      stat.metric.includes('oil'),
    ),
  ).map((strait) => strait.id),
);

const FEATURED = STRAITS.filter((strait) => loadImagesFor({ type: 'strait', id: strait.id }).length)
  .slice(0, 14)
  .map((strait) => straitTile(strait.id, strait.name, strait.region));

const NARROWEST = [...STRAITS]
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

const LONGEST = [...STRAITS]
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

/**
 * The lenses through which straits are discovered. Every rail is a set of
 * straits seen from one angle — strategic, economic, historical, natural.
 * Nothing here navigates to a country or a port; the strait is always the
 * destination. Rails with fewer than two straits are simply not shown.
 */
const LENSES: readonly { eyebrow: string; title: string; items: readonly RailItem[] }[] = [
  { eyebrow: 'Start here', title: 'Featured straits', items: FEATURED },
  {
    eyebrow: 'By strategic importance',
    title: 'The great chokepoints',
    items: themeTiles(STRAITS.filter(hasTag('chokepoint'))),
  },
  {
    eyebrow: 'By energy',
    title: 'The oil arteries',
    items: themeTiles(STRAITS.filter((strait) => ENERGY_STRAIT_IDS.has(strait.id))),
  },
  {
    eyebrow: 'By trade & civilisation',
    title: 'Ancient trade routes',
    items: themeTiles(STRAITS.filter(hasTag('historic-trade'))),
  },
  { eyebrow: 'By width', title: 'The narrowest squeezes', items: NARROWEST },
  { eyebrow: 'By length', title: 'The longest passages', items: LONGEST },
  {
    eyebrow: 'By history',
    title: 'Where history turned',
    items: themeTiles(STRAITS.filter((strait) => EVENT_STRAIT_IDS.has(strait.id))),
  },
  {
    eyebrow: 'By wildlife',
    title: 'Life at the narrows',
    items: themeTiles(STRAITS.filter((strait) => WILDLIFE_STRAIT_IDS.has(strait.id))),
  },
  {
    eyebrow: 'By climate',
    title: 'Polar passages',
    items: themeTiles(STRAITS.filter(hasTag('polar'))),
  },
  {
    eyebrow: 'By crossing',
    title: 'Bridged & tunnelled',
    items: themeTiles(STRAITS.filter(hasTag('crossed'))),
  },
].filter((lens) => lens.items.length >= 2);

/**
 * Explore — the heart of the application, and a strait-first one. Not an
 * entity browser: a discovery experience where every rail reveals the
 * world's straits through a different lens. Search lives in the Chart Room.
 */
export function ExplorePage() {
  const { openSearch } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const surprise = () => {
    const pick = STRAITS[Math.floor(Math.random() * STRAITS.length)];
    if (pick) void navigate(`/straits/${pick.id}`, { viewTransition: true });
  };

  return (
    <>
      <SeoTags
        title="Explore the world's straits — Fathom"
        description="Discover the world's straits through the lenses that matter — chokepoints, the narrows, trade routes, and the waters where history turned."
        path="/explore"
      />
      <article>
        <PageHero
          eyebrow="Explore"
          title="The world's straits"
          subtitle="Discover them through the lenses that matter — the chokepoints, the narrows, the trade routes, and the waters where history turned. Open the Chart Room to search, or let the tide decide."
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

        {LENSES.map((lens) => (
          <DiscoveryRail
            key={lens.title}
            eyebrow={lens.eyebrow}
            title={lens.title}
            items={lens.items}
          />
        ))}

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
        title="Chart Room — Fathom"
        description="Every charted strait on one interactive world map — trade lanes, seas, and oil-flow rings."
        path="/map"
      />
      <div className="map-page">
        <header className="map-intro">
          <div className="geo-label">Chart Room</div>
          <h1 className="map-intro-title">The world on one chart</h1>
          <p className="map-intro-sub">
            Every charted strait, plotted on the open sea. Trace the trade lanes, name the
            surrounding waters, or set the globe adrift — then open any pin to sail in.
          </p>
        </header>
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
 * Academy — the educational shelf, rebuilt as a set of course modules:
 * quizzes, the timeline, the comparison tool, and the games. Every
 * module is a place to practice against the charts themselves.
 */
interface LearnPath {
  to: string;
  glyph: string;
  chapter: string;
  title: string;
  blurb: string;
}

const LEARN_PATHS: readonly LearnPath[] = [
  {
    to: '/quiz',
    glyph: '?',
    chapter: 'Practice',
    title: 'Know your narrows',
    blurb: 'A quiz generated from the charts themselves — never the same twice.',
  },
  {
    to: '/timeline',
    glyph: '⌛',
    chapter: 'History',
    title: 'Travel through time',
    blurb: 'Every event the atlas records, in order, each grounded in its sources.',
  },
  {
    to: '/compare',
    glyph: '⇄',
    chapter: 'Analysis',
    title: 'Compare straits',
    blurb: 'Two narrows side by side — geography, countries, and crossings.',
  },
  {
    to: '/daily',
    glyph: '⚓',
    chapter: 'Daily',
    title: 'Daily Expedition',
    blurb: 'A new generated passage every day — the same course for everyone.',
  },
  {
    to: '/six-degrees',
    glyph: '⛓',
    chapter: 'Challenge',
    title: 'Six Degrees of Sea',
    blurb: "Reach a far strait using only the atlas's own connections.",
  },
  {
    to: '/profile',
    glyph: '★',
    chapter: 'Your log',
    title: "Captain's Log",
    blurb: 'Your rank, voyages, trophies, and everything learned at sea.',
  },
];

export function LearnPage() {
  return (
    <>
      <SeoTags
        title="Academy — Fathom"
        description="Quizzes, history, comparisons, and games drawn from the world's straits."
        path="/learn"
      />
      <article className="detail">
        <PageHero
          eyebrow="Academy"
          title="Learn the sea"
          subtitle="The atlas as a teacher — test yourself against the charts, travel through time, and follow the themes that connect the world's narrows."
        />

        <section className="reveal learn-shelf">
          <div className="learn-head">
            <div className="geo-label">Course modules</div>
            <h2 className="editorial-title">Where to begin</h2>
          </div>
          <div className="learn-paths">
            {LEARN_PATHS.map((path, index) => (
              <Link viewTransition key={path.to} className="learn-path" to={path.to}>
                <span className="learn-path-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="learn-path-glyph" aria-hidden="true">
                  {path.glyph}
                </span>
                <span className="learn-path-chapter">{path.chapter}</span>
                <h3>{path.title}</h3>
                <p>{path.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="strait-onward">
          <Records />
          <Collections />
          <InterestingFacts />
        </div>
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
      <article className="detail">
        <PageHero
          eyebrow="Wildlife"
          title="Wildlife of the narrows"
          subtitle="Straits concentrate life as much as shipping — the species that migrate, hunt, and winter in the world's channels, each grounded in its cited source."
        />

        <EditorialSection
          eyebrow="The corridor species"
          title="Creatures of the world's straits"
          wide
        >
          <div className="wildlife-rail">
            {species.map((animal) => {
              const habitat = animal.habitats[0];
              const node = habitat ? getEntity(canonicalId(habitat.type, habitat.id)) : null;
              return (
                <div key={animal.id} className="wildlife-card">
                  <div className="geo-label">{animal.scientificName}</div>
                  <h3>{animal.commonName}</h3>
                  <p className="note">{animal.summary}</p>
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
        </EditorialSection>
      </article>
    </>
  );
}
