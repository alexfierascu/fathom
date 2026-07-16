import { useSyncExternalStore } from 'react';

import { Link, useNavigate } from 'react-router';

import { loadAllStraits, loadTags } from '@fathom/data';
import { loadJourneys, randomEntity } from '@fathom/discovery';

import { Section } from '../atlas/components/Section';
import { entityPath } from '../atlas/lib/entityPaths';
import { loadRecentlyViewed } from './recentlyViewed';

/**
 * The homepage's exploration sections. Everything here is an invitation
 * to go somewhere — all destinations come from the discovery engine and
 * the dataset, never from hardcoded lists.
 */

/** Deterministic daily pick from the journey catalog. */
function journeyOfTheDay() {
  const journeys = loadJourneys();
  const day = Math.floor(Date.now() / 86_400_000);
  return journeys[day % journeys.length];
}

export function StartExploring() {
  const navigate = useNavigate();
  const surprise = () => {
    const pick = randomEntity();
    const path = pick ? entityPath(pick) : null;
    if (path) void navigate(path);
  };

  return (
    <Section label="Start exploring">
      <div className="explore-tiles">
        <Link className="explore-tile" to="/journeys">
          <div className="explore-tile-glyph">⛵</div>
          <h3>Take a journey</h3>
          <p>Guided voyages, stop by stop, across the maritime world.</p>
        </Link>
        <button type="button" className="explore-tile" onClick={surprise}>
          <div className="explore-tile-glyph">⚄</div>
          <h3>Surprise me</h3>
          <p>A random strait, sea, port, or passage — wherever the tide goes.</p>
        </button>
        <Link className="explore-tile" to="/quiz">
          <div className="explore-tile-glyph">?</div>
          <h3>Know your narrows</h3>
          <p>A quiz drawn from the charts themselves.</p>
        </Link>
        <Link className="explore-tile" to="/timeline">
          <div className="explore-tile-glyph">⌛</div>
          <h3>Travel through time</h3>
          <p>The history the straits have carried, in order.</p>
        </Link>
      </div>
    </Section>
  );
}

export function FeaturedJourney() {
  const journey = journeyOfTheDay();
  if (!journey) return null;
  return (
    <Section label="Featured journey">
      <Link className="card feature-card journey-feature" to={`/journeys/${journey.id}`}>
        <div className="eyebrow">
          {String(journey.waypoints.length)} stops · ~{String(journey.estimatedMinutes)} min
        </div>
        <h3>{journey.title}</h3>
        <div className="note">{journey.subtitle}</div>
        <div className="connects">Start the journey →</div>
      </Link>
    </Section>
  );
}

export function PopularTags() {
  const straits = loadAllStraits();
  const tags = loadTags()
    .map((tag) => ({
      tag,
      count: straits.filter((strait) => strait.tagIds?.includes(tag.id)).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  if (tags.length === 0) return null;
  return (
    <Section label="Popular tags">
      <div className="pills">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag.id}
            className="pill pill--tag"
            to={`/tags/${tag.id}`}
            title={tag.definition}
          >
            {tag.label} · {count}
          </Link>
        ))}
      </div>
    </Section>
  );
}

export function Collections() {
  const journeys = loadJourneys();
  const straits = loadAllStraits();
  const tagCollections = loadTags()
    .map((tag) => ({
      tag,
      count: straits.filter((strait) => strait.tagIds?.includes(tag.id)).length,
    }))
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <Section label="Collections">
      <div className="grid">
        <Link className="card" to="/journeys">
          <div className="eyebrow">{String(journeys.length)} voyages</div>
          <h3>Guided journeys</h3>
          <div className="note">Curated passages with a course to follow.</div>
        </Link>
        {tagCollections.map(({ tag, count }) => (
          <Link key={tag.id} className="card" to={`/tags/${tag.id}`}>
            <div className="eyebrow">
              {String(count)} strait{count === 1 ? '' : 's'}
            </div>
            <h3>{tag.label}</h3>
            <div className="note">{tag.definition}</div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// Recently-viewed lives in localStorage; subscribe so the section stays
// accurate without a reload (visits happen on other pages).
const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
  };
};
let trailCache: { raw: string; value: ReturnType<typeof loadRecentlyViewed> } | null = null;
const trailSnapshot = () => {
  const raw = window.localStorage.getItem('fathom-recently-viewed') ?? '[]';
  if (trailCache?.raw !== raw) {
    trailCache = { raw, value: loadRecentlyViewed() };
  }
  return trailCache.value;
};

export function ContinueReading() {
  const trail = useSyncExternalStore(subscribe, trailSnapshot);
  if (trail.length === 0) return null;
  return (
    <Section label="Continue reading">
      <div className="pills">
        {trail.map((visit) => (
          <Link key={visit.entityId} className="pill" to={visit.path}>
            {visit.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}
