import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Link } from 'react-router';

import { parseEntityId } from '@fathom/data';
import { recommendationsFor } from '@fathom/discovery';

import { prefetchEntityPage } from '../../app/prefetch';
import { Section } from '../atlas/components/Section';
import { entityPath } from '../atlas/lib/entityPaths';
import { isFavourite, toggleFavourite } from '../progression/store';
import { recordVisit } from './recentlyViewed';

interface ContinueExploringProps {
  /** Canonical id (`strait:gibraltar`). */
  entityId: string;
  entityName: string;
  /** Extra page-specific pills (e.g. the compare tool link). */
  children?: ReactNode;
}

/**
 * The exploration footer on every entity page. All recommendations come
 * from @fathom/discovery — this component only renders them. Mounting it
 * also records the visit for the homepage's Continue Reading trail.
 */
export function ContinueExploring({ entityId, entityName, children }: ContinueExploringProps) {
  // Deterministic groups are cached inside the engine; the random pick
  // changes per navigation, which is exactly what a discovery hook wants.
  const groups = useMemo(() => recommendationsFor(entityId), [entityId]);
  const [pinned, setPinned] = useState(() => isFavourite(entityId));

  const [pinnedFor, setPinnedFor] = useState(entityId);
  if (pinnedFor !== entityId) {
    setPinnedFor(entityId);
    setPinned(isFavourite(entityId));
  }

  const path = useMemo(() => {
    const parsed = parseEntityId(entityId);
    return parsed ? entityPath({ type: parsed.type, id: parsed.token }) : null;
  }, [entityId]);

  useEffect(() => {
    if (path) recordVisit({ entityId, name: entityName, path });
  }, [entityId, entityName, path]);

  if (groups.length === 0 && !children) return null;

  return (
    <Section label="Continue exploring">
      {path && (
        <button
          type="button"
          className={pinned ? 'favourite-toggle is-pinned' : 'favourite-toggle'}
          aria-pressed={pinned}
          onClick={() => {
            setPinned(toggleFavourite({ entityId, name: entityName, path }));
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M8 1.5c.5 2.7 3.3 5.5 6 6-2.7.5-5.5 3.3-6 6-.5-2.7-3.3-5.5-6-6 2.7-.5 5.5-3.3 6-6z"
              fill={pinned ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          {pinned ? 'In your log' : 'Save to log'}
        </button>
      )}
      <div className="explore-groups">
        {groups.map((group) => (
          <div key={group.key} className="explore-group">
            <div className="geo-label">{group.title}</div>
            <div className="pills">
              {group.items.map((item) => {
                const path = entityPath(item);
                if (!path) return null;
                const surprise = group.key === 'random-discovery';
                return (
                  <Link
                    viewTransition
                    key={item.entityId}
                    className={surprise ? 'pill pill--surprise' : 'pill'}
                    to={path}
                    title={item.reason}
                    onMouseEnter={() => {
                      prefetchEntityPage(item.type);
                    }}
                  >
                    {surprise ? `${item.name} ⚄` : item.name}
                  </Link>
                );
              })}
              {group.key === 'random-discovery' && children}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
