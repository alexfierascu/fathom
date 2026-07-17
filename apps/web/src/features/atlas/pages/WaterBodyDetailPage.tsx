import { useEffect, useMemo, useState } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId, getEntity, getRelated } from '@fathom/data';
import { journeyVisits, loadJourneys } from '@fathom/discovery';

import { ContinueExploring } from '../../explore/ContinueExploring';
import { EntityGallery } from '../../media/MediaGallery';
import { FlowDiagram } from '../components/FlowDiagram';
import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs';
import { EntityPills } from '../components/EntityPills';
import { Section } from '../components/Section';
import { SeoTags } from '../components/SeoTags';
import { SourcesList } from '../components/SourcesList';
import { StraitCard } from '../components/StraitCard';
import { StraitsMap } from '../components/StraitsMap';
import { findWaterBodyBySlug } from '../lib/navigation';
import { breadcrumbsJsonLd, buildWaterBodySeo, placeJsonLd } from '../lib/seo';

const TYPE_LABELS: Record<string, string> = {
  ocean: 'Ocean',
  sea: 'Sea',
  channel: 'Channel',
  strait: 'Strait',
  gulf: 'Gulf',
  bay: 'Bay',
};

export function WaterBodyDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const waterBody = findWaterBodyBySlug(slug);

  const related = useMemo(() => {
    if (!waterBody) return null;
    const node = getEntity(entityId('water-body', waterBody.id));
    if (node?.type !== 'water-body') return null;
    const straits = getRelated(node, 'straits');
    return {
      parent: getRelated(node, 'parent'),
      children: getRelated(node, 'children'),
      straits,
      straitDocs: straits.map((strait) => strait.data),
      countries: getRelated(node, 'countries'),
      routes: getRelated(node, 'routes'),
      canals: getRelated(node, 'canals'),
      islands: getRelated(node, 'islands'),
      ports: getRelated(node, 'ports'),
      sources: getRelated(node, 'sources'),
    };
  }, [waterBody]);

  if (!waterBody || !related) {
    return (
      <div className="empty">
        No waters charted at this address.{' '}
        <Link viewTransition to="/">
          Return to the chart.
        </Link>
      </div>
    );
  }

  const {
    parent,
    children,
    straits,
    straitDocs,
    countries,
    routes,
    canals,
    islands,
    ports,
    sources,
  } = related;

  const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }];
  if (parent) crumbs.push({ label: parent.name, to: `/water-bodies/${parent.id}` });
  crumbs.push({ label: waterBody.name });

  const seo = buildWaterBodySeo(waterBody);
  const journeys = loadJourneys().filter((journey) =>
    journeyVisits(journey, `water-body:${waterBody.id}`),
  );

  return (
    <>
      <SeoTags
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={[
          placeJsonLd({ name: waterBody.name, description: seo.description, path: seo.path }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            ...(parent ? [{ name: parent.name, path: `/water-bodies/${parent.id}` }] : []),
            { name: waterBody.name, path: seo.path },
          ]),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <article className="detail">
        <div className="eyebrow">{TYPE_LABELS[waterBody.type] ?? waterBody.type}</div>
        <h2 className="detail-title">{waterBody.name}</h2>
        <div className="note">{waterBody.summary}</div>

        {parent && (
          <div className="connects">
            Part of{' '}
            <Link viewTransition to={`/water-bodies/${parent.id}`}>
              {parent.name}
            </Link>
          </div>
        )}

        <ThreadBar waterId={waterBody.id} waterName={waterBody.name} />

        <FlowDiagram waterBodyId={waterBody.id} name={waterBody.name} />

        <div className="chart-split">
          <aside className="chart-rail">
            <StraitsMap straits={straitDocs} tileStyle={tileStyle} />
          </aside>
          <div className="chart-story">
            <Section label="Straits linking these waters to the world">
              {straits.length > 0 ? (
                <div className="grid">
                  {straits.map((strait) => (
                    <StraitCard key={strait.id} strait={strait.data} />
                  ))}
                </div>
              ) : (
                <div className="note">No charted straits connect these waters yet.</div>
              )}
            </Section>

            {routes.length > 0 && (
              <Section label="Routes through these waters">
                <EntityPills entities={routes} />
              </Section>
            )}

            {children.length > 0 && (
              <Section label="Contains">
                <EntityPills entities={children} />
              </Section>
            )}

            {countries.length > 0 && (
              <Section label="Bordered by">
                <EntityPills entities={countries} />
              </Section>
            )}

            {canals.length > 0 && (
              <Section label="Canals">
                <EntityPills entities={canals} />
              </Section>
            )}

            {islands.length > 0 && (
              <Section label="Islands">
                <EntityPills entities={islands} />
              </Section>
            )}

            {ports.length > 0 && (
              <Section label="Ports">
                <EntityPills entities={ports} />
              </Section>
            )}

            <EntityGallery entity={{ type: 'water-body', id: waterBody.id }} />

            {journeys.length > 0 && (
              <Section label="Journeys through these waters">
                <div className="grid">
                  {journeys.map((journey) => (
                    <Link
                      viewTransition
                      key={journey.id}
                      className="card"
                      to={`/journeys/${journey.id}`}
                    >
                      <div className="eyebrow">
                        {String(journey.waypoints.length)} stops · ~
                        {String(journey.estimatedMinutes)} min
                      </div>
                      <h3>{journey.title}</h3>
                      <div className="note">{journey.subtitle}</div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            <SourcesList sources={sources} />

            <ContinueExploring
              entityId={`water-body:${waterBody.id}`}
              entityName={waterBody.name}
            />
          </div>
        </div>
      </article>
    </>
  );
}

interface ThreadEntry {
  id: string;
  name: string;
}

function readThread(): ThreadEntry[] {
  try {
    const raw = window.sessionStorage.getItem('fathom-thread');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ThreadEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Walk the Thread: as the reader steps from sea to sea through the flow
 * diagrams, their route accumulates here — a wake through the session.
 */
function ThreadBar({ waterId, waterName }: { waterId: string; waterName: string }) {
  const [, bump] = useState(0);
  const stored = readThread();
  const display = [
    ...stored.filter((entry) => entry.id !== waterId),
    { id: waterId, name: waterName },
  ];

  useEffect(() => {
    try {
      window.sessionStorage.setItem('fathom-thread', JSON.stringify(display.slice(-12)));
    } catch {
      // Session storage unavailable — the thread simply isn't kept.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterId]);

  if (display.length < 2) return null;
  return (
    <div className="thread-bar">
      <span className="geo-label">Your thread</span>
      <div className="pills">
        {display.map((entry, index) => (
          <span key={entry.id} style={{ display: 'contents' }}>
            {index > 0 && <span className="thread-link" aria-hidden="true" />}
            {entry.id === waterId ? (
              <span className="pill pill--tag">{entry.name}</span>
            ) : (
              <Link viewTransition className="pill" to={`/water-bodies/${entry.id}`}>
                {entry.name}
              </Link>
            )}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="link-button"
        onClick={() => {
          try {
            window.sessionStorage.removeItem('fathom-thread');
          } catch {
            /* noop */
          }
          bump((n) => n + 1);
        }}
      >
        Cut the thread
      </button>
    </div>
  );
}
