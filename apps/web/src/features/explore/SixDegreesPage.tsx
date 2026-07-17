import { useState } from 'react';

import { Link, useSearchParams } from 'react-router';

import { loadAllStraits } from '@fathom/data';
import { getMaritimeGraph, recommendationsFor, shortestPath } from '@fathom/discovery';

import { Breadcrumbs } from '../atlas/components/Breadcrumbs';
import { Section } from '../atlas/components/Section';
import { SeoTags } from '../atlas/components/SeoTags';
import { entityPath } from '../atlas/lib/entityPaths';

/**
 * Six Degrees of Sea: reach the target strait using only the discovery
 * engine's Continue Exploring suggestions. Par is the graph's own
 * shortest path — the game only exists because the atlas is a graph.
 */

interface Pair {
  fromId: string;
  toId: string;
  par: number;
}

function pairFor(seed: number): Pair | null {
  const graph = getMaritimeGraph();
  const straits = loadAllStraits();
  const count = straits.length;
  for (let attempt = 0; attempt < count; attempt += 1) {
    const from = straits[(seed * 11 + attempt) % count];
    const to = straits[(seed * 17 + attempt * 5 + 9) % count];
    if (!from || !to || from.id === to.id) continue;
    const path = shortestPath(graph, `strait:${from.id}`, `strait:${to.id}`);
    if (path && path.length >= 4 && path.length <= 9) {
      return { fromId: `strait:${from.id}`, toId: `strait:${to.id}`, par: path.length - 1 };
    }
  }
  return null;
}

const nameOf = (entityId: string) => getMaritimeGraph().nodes.get(entityId)?.name ?? entityId;

export function SixDegreesPage() {
  const [searchParams] = useSearchParams();
  const [day] = useState(() => Math.floor(Date.now() / 86_400_000));
  const crossingParam = Number.parseInt(searchParams.get('crossing') ?? '', 10);
  const [seed, setSeed] = useState(Number.isFinite(crossingParam) ? crossingParam : day);
  const [trail, setTrail] = useState<string[]>([]);
  const [surrendered, setSurrendered] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareCrossing = (pairInfo: Pair, hopCount: number) => {
    const text = [
      `Six Degrees of Sea — ${nameOf(pairInfo.fromId)} → ${nameOf(pairInfo.toId)}`,
      `⚓ ${String(hopCount)} hops (par ${String(pairInfo.par)}) ${'🌊'.repeat(Math.min(hopCount, 10))}`,
      `${window.location.origin}/six-degrees?crossing=${String(seed)}`,
    ].join('\n');
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    });
  };

  const pair = pairFor(seed);
  if (!pair) {
    return <div className="empty">The chart offers no crossing today.</div>;
  }
  const current = trail[trail.length - 1] ?? pair.fromId;
  const won = current === pair.toId;
  const hops = trail.length;

  const groups = recommendationsFor(current);
  const seen = new Set([current]);
  const choices = groups
    .flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })))
    .filter((item) => {
      if (seen.has(item.entityId)) return false;
      seen.add(item.entityId);
      return true;
    })
    .slice(0, 14);

  const optimal = shortestPath(getMaritimeGraph(), pair.fromId, pair.toId) ?? [];
  const restart = (nextSeed: number) => {
    setSeed(nextSeed);
    setTrail([]);
    setSurrendered(false);
  };

  return (
    <>
      <SeoTags
        title="Six Degrees of Sea — Fathom"
        description="Navigate from strait to strait using only the atlas's own connections."
        path="/six-degrees"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Six Degrees of Sea' }]} />
      <article className="detail">
        <header className="hub-header">
          <h2 className="detail-title detail-title--hero">Six Degrees of Sea</h2>
          <p className="note note--lede">
            Get from <b>{nameOf(pair.fromId)}</b> to <b>{nameOf(pair.toId)}</b> using only the
            connections the atlas itself suggests. Par for today's crossing:{' '}
            <b>{String(pair.par)}</b> hops.
          </p>
        </header>

        <div className="six-board">
          <div className="six-trail">
            <div className="geo-label">Your course · {String(hops)} hops</div>
            <div className="pills" style={{ marginTop: 8 }}>
              <span className="pill pill--tag">{nameOf(pair.fromId)}</span>
              {trail.map((id, index) => (
                <span key={`${id}-${String(index)}`} className="pill">
                  {nameOf(id)}
                </span>
              ))}
              {!won && <span className="pill pill--action">… {nameOf(pair.toId)} ?</span>}
            </div>
          </div>

          {won || surrendered ? (
            <div className="six-result">
              <div className="geo-label">{won ? 'Landfall!' : 'The revealed course'}</div>
              {won ? (
                <p className="note note--lede">
                  {nameOf(pair.toId)} in {String(hops)} hops — par was {String(pair.par)}.{' '}
                  {hops <= pair.par
                    ? 'A navigator’s line.'
                    : hops <= pair.par + 2
                      ? 'A sound crossing.'
                      : 'The scenic route has its charms.'}
                </p>
              ) : (
                <p className="note">
                  The shortest crossing ran: {optimal.map((id) => nameOf(id)).join(' → ')}
                </p>
              )}
              <div className="journey-actions">
                <button
                  type="button"
                  className="journey-btn journey-btn--primary"
                  onClick={() => {
                    restart(seed + 1000003);
                  }}
                >
                  New crossing
                </button>
                <button
                  type="button"
                  className="journey-btn"
                  onClick={() => {
                    restart(day);
                  }}
                >
                  Retry today's
                </button>
                {won && (
                  <button
                    type="button"
                    className="journey-btn"
                    onClick={() => {
                      shareCrossing(pair, hops);
                    }}
                  >
                    {copied ? 'Copied ✓' : 'Share crossing'}
                  </button>
                )}
                {won && (
                  <Link
                    viewTransition
                    className="journey-btn"
                    to={entityPath({ type: 'strait', id: pair.toId.split(':')[1] ?? '' }) ?? '/'}
                  >
                    Visit {nameOf(pair.toId)}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <Section label={`From ${nameOf(current)} you can reach`}>
              <div className="xp-cards">
                {choices.map((choice) => (
                  <button
                    key={choice.entityId}
                    type="button"
                    className="xp-card"
                    title={choice.reason}
                    onClick={() => {
                      setTrail((state) => [...state, choice.entityId]);
                    }}
                  >
                    <span className="xp-card-kind">{choice.group}</span>
                    <b>{choice.name}</b>
                    <span className="xp-card-reason">{choice.reason}</span>
                  </button>
                ))}
              </div>
              <div className="journey-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="journey-btn"
                  onClick={() => {
                    setSurrendered(true);
                  }}
                >
                  Reveal the course
                </button>
                {trail.length > 0 && (
                  <button
                    type="button"
                    className="journey-btn"
                    onClick={() => {
                      setTrail((state) => state.slice(0, -1));
                    }}
                  >
                    ← Back one hop
                  </button>
                )}
              </div>
            </Section>
          )}
        </div>
      </article>
    </>
  );
}
