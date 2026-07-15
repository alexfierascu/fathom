import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId, getEntity, getRelated, type EntityNode, type WaterBodyType } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { StraitCard } from '../components/StraitCard';
import { StraitsMap } from '../components/StraitsMap';
import { findCountryBySlug } from '../lib/navigation';
import { buildCountrySeo } from '../lib/seo';

const WATER_GROUPS: readonly { type: WaterBodyType; label: string }[] = [
  { type: 'ocean', label: 'Oceans' },
  { type: 'sea', label: 'Seas' },
  { type: 'channel', label: 'Channels' },
  { type: 'strait', label: 'Strait waters' },
  { type: 'gulf', label: 'Gulfs' },
  { type: 'bay', label: 'Bays' },
];

const INFRASTRUCTURE_LABELS = ['Ports', 'Canals', 'Bridges', 'Tunnels'];

export function CountryDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const country = findCountryBySlug(slug);

  const related = useMemo(() => {
    if (!country) return null;
    const node = getEntity(entityId('country', country.id));
    if (node?.type !== 'country') return null;
    const straits = getRelated(node, 'straits');
    return {
      straits,
      straitDocs: straits.map((strait) => strait.data),
      waterBodies: getRelated(node, 'waterBodies'),
      neighbors: getRelated(node, 'neighbors'),
      sources: getRelated(node, 'sources'),
    };
  }, [country]);

  if (!country || !related) {
    return (
      <div className="empty">
        No country charted at this address. <Link to="/">Return to the chart.</Link>
      </div>
    );
  }

  const { straits, straitDocs, waterBodies, neighbors, sources } = related;
  const waterGroups = WATER_GROUPS.map((group) => ({
    ...group,
    bodies: waterBodies.filter((waterBody) => waterBody.data.type === group.type),
  })).filter((group) => group.bodies.length > 0);

  const seo = buildCountrySeo(country);
  const canonical = new URL(seo.path, window.location.origin).href;

  const facts: readonly { label: string; value: string }[] = [
    {
      label: 'Coastline',
      value: country.coastline
        ? `${String(country.coastline.value)} ${country.coastline.unit}`
        : '—',
    },
    { label: 'EEZ', value: '—' },
    { label: 'Charted ports', value: '0' },
    { label: 'Connected straits', value: String(straits.length) },
  ];

  return (
    <>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Fathom" />

      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: country.name }]} />

      <article className="detail">
        <div className="eyebrow">Country</div>
        <div className="detail-title-row">
          <span className="flag-chip" title={`Flag of ${country.name} (placeholder)`}>
            {country.code ?? '⚑'}
          </span>
          <h2 className="detail-title">{country.name}</h2>
        </div>
        <div className="note">{country.summary}</div>

        {waterGroups.map((group) => (
          <section key={group.type} className="detail-section">
            <div className="eyebrow">{group.label}</div>
            <div className="pills">
              {group.bodies.map((waterBody) => (
                <Link key={waterBody.id} className="pill" to={`/water-bodies/${waterBody.id}`}>
                  {waterBody.name}
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="detail-section">
          <div className="eyebrow">Infrastructure</div>
          <div className="facts">
            {INFRASTRUCTURE_LABELS.map((label) => (
              <div key={label} className="fact">
                <div className="fact-label">{label}</div>
                <div className="fact-value">—</div>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <div className="eyebrow">Statistics</div>
          <div className="facts">
            {facts.map((fact) => (
              <div key={fact.label} className="fact">
                <div className="fact-label">{fact.label}</div>
                <div className="fact-value">{fact.value}</div>
              </div>
            ))}
          </div>
        </section>

        <StraitsMap straits={straitDocs} tileStyle={tileStyle} />

        {straits.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Straits of {country.name}</div>
            <div className="grid">
              {straits.map((strait: EntityNode<'strait'>) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          </section>
        )}

        {neighbors.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Neighbors across the water</div>
            <div className="pills">
              {neighbors.map((neighbor) => (
                <Link key={neighbor.id} className="pill" to={`/countries/${neighbor.id}`}>
                  {neighbor.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {sources.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Sources</div>
            <ul className="sources">
              {sources.map((source) => (
                <li key={source.id}>
                  {source.data.title} — {source.data.publisher}
                  {source.data.publishedOn ? ` (${source.data.publishedOn})` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
