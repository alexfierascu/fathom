import { useSyncExternalStore } from 'react';

import { Link } from 'react-router';

import { loadAllStraits, loadTags } from '@fathom/data';
import { loadJourneys } from '@fathom/discovery';

import { Section } from '../atlas/components/Section';
import { loadRecentlyViewed } from './recentlyViewed';

/**
 * The homepage's exploration sections. Everything here is an invitation
 * to go somewhere — all destinations come from the discovery engine and
 * the dataset, never from hardcoded lists.
 */

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
            viewTransition
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
        <Link viewTransition className="card" to="/journeys">
          <div className="eyebrow">{String(journeys.length)} voyages</div>
          <h3>Guided journeys</h3>
          <div className="note">Curated passages with a course to follow.</div>
        </Link>
        {tagCollections.map(({ tag, count }) => (
          <Link viewTransition key={tag.id} className="card" to={`/tags/${tag.id}`}>
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
          <Link viewTransition key={visit.entityId} className="pill" to={visit.path}>
            {visit.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}
