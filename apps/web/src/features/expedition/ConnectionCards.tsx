import { useState } from 'react';

import { Link } from 'react-router';

import { entityId as canonicalId, getEntity } from '@fathom/data';
import { recommendationsFor, type Recommendation } from '@fathom/discovery';

import { entityPath } from '../atlas/lib/entityPaths';

const GROUPS_SHOWN = [
  'connected-seas',
  'connected-straits',
  'nearby-straits',
  'neighbouring-countries',
  'straits',
  'adjacent-seas',
  'countries',
  'routes',
  'hierarchy',
];

function factOf(item: Recommendation): string | null {
  const node = getEntity(canonicalId(item.type, item.id));
  if (!node) return null;
  const data = node.data as { note?: unknown; summary?: unknown };
  if (typeof data.note === 'string') return data.note;
  if (typeof data.summary === 'string') return data.summary;
  return null;
}

/**
 * The stop's world, as cards: what these waters touch, drawn live from
 * the discovery engine. A rotating "from the nearby chart" fact keeps
 * every visit a little different.
 */
export function ConnectionCards({ entityKey }: { entityKey: string }) {
  const groups = recommendationsFor(entityKey).filter((group) => GROUPS_SHOWN.includes(group.key));
  const items = groups.flatMap((group) => group.items.slice(0, 3)).slice(0, 6);
  const facts = items
    .map((item) => ({ name: item.name, fact: factOf(item) }))
    .filter((entry): entry is { name: string; fact: string } => entry.fact !== null);
  const [factIndex, setFactIndex] = useState(0);

  if (items.length === 0) return null;
  const fact = facts[factIndex % Math.max(facts.length, 1)];

  return (
    <div>
      <div className="xp-cards">
        {items.map((item) => {
          const path = entityPath(item);
          if (!path) return null;
          return (
            <Link viewTransition key={item.entityId} className="xp-card" to={path}>
              <span className="xp-card-kind">{item.type.replace('-', ' ')}</span>
              <b>{item.name}</b>
              <span className="xp-card-reason">{item.reason}</span>
            </Link>
          );
        })}
      </div>
      {fact && (
        <div className="xp-fact">
          <div>
            <div className="geo-label">From the nearby chart · {fact.name}</div>
            <p>{fact.fact}</p>
          </div>
          {facts.length > 1 && (
            <button
              type="button"
              className="xp-fact-next"
              aria-label="Another fact"
              onClick={() => {
                setFactIndex((index) => index + 1);
              }}
            >
              ⚄
            </button>
          )}
        </div>
      )}
    </div>
  );
}
