import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId, getEntity, getRelated, type WaterBodyType } from '@fathom/data';

import { EntityGallery } from '../../media/MediaGallery';
import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EntityPills } from '../components/EntityPills';
import { Section } from '../components/Section';
import { SeoTags } from '../components/SeoTags';
import { SourcesList } from '../components/SourcesList';
import { StraitCard } from '../components/StraitCard';
import { StraitsMap } from '../components/StraitsMap';
import { findCountryBySlug } from '../lib/navigation';
import { breadcrumbsJsonLd, buildCountrySeo, placeJsonLd } from '../lib/seo';

const WATER_GROUPS: readonly { type: WaterBodyType; label: string }[] = [
  { type: 'ocean', label: 'Oceans' },
  { type: 'sea', label: 'Seas' },
  { type: 'channel', label: 'Channels' },
  { type: 'strait', label: 'Strait waters' },
  { type: 'gulf', label: 'Gulfs' },
  { type: 'bay', label: 'Bays' },
];

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
      ports: getRelated(node, 'ports'),
      canals: getRelated(node, 'canals'),
      islands: getRelated(node, 'islands'),
      crossings: getRelated(node, 'crossings'),
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

  const {
    straits,
    straitDocs,
    waterBodies,
    neighbors,
    ports,
    canals,
    islands,
    crossings,
    sources,
  } = related;
  const waterGroups = WATER_GROUPS.map((group) => ({
    ...group,
    bodies: waterBodies.filter((waterBody) => waterBody.data.type === group.type),
  })).filter((group) => group.bodies.length > 0);

  const seo = buildCountrySeo(country);

  const facts: readonly { label: string; value: string }[] = [
    {
      label: 'Coastline',
      value: country.coastline
        ? `${String(country.coastline.value)} ${country.coastline.unit}`
        : '—',
    },
    { label: 'EEZ', value: '—' },
    { label: 'Charted ports', value: String(ports.length) },
    { label: 'Connected straits', value: String(straits.length) },
  ];

  const infrastructure = [
    { label: 'Ports', entities: ports },
    { label: 'Canals', entities: canals },
    { label: 'Bridges & tunnels', entities: crossings },
    { label: 'Islands', entities: islands },
  ].filter((group) => group.entities.length > 0);

  return (
    <>
      <SeoTags
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={[
          placeJsonLd({ name: country.name, description: seo.description, path: seo.path }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            { name: country.name, path: seo.path },
          ]),
        ]}
      />

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

        <Section label={`Straits of ${country.name}`}>
          {straits.length > 0 ? (
            <div className="grid">
              {straits.map((strait) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          ) : (
            <div className="note">No charted straits touch {country.name}'s coasts yet.</div>
          )}
        </Section>

        {waterGroups.map((group) => (
          <Section key={group.type} label={group.label}>
            <EntityPills entities={group.bodies} />
          </Section>
        ))}

        {infrastructure.length > 0 ? (
          infrastructure.map((group) => (
            <Section key={group.label} label={group.label}>
              <EntityPills entities={group.entities} />
            </Section>
          ))
        ) : (
          <Section label="Infrastructure">
            <div className="note">No ports, canals, bridges, or tunnels charted yet.</div>
          </Section>
        )}

        <Section label="Statistics">
          <div className="facts">
            {facts.map((fact) => (
              <div key={fact.label} className="fact">
                <div className="fact-label">{fact.label}</div>
                <div className="fact-value">{fact.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {straitDocs.length > 0 && <StraitsMap straits={straitDocs} tileStyle={tileStyle} />}

        {neighbors.length > 0 && (
          <Section label="Neighbors across the water">
            <EntityPills entities={neighbors} />
          </Section>
        )}

        <EntityGallery entity={{ type: 'country', id: country.id }} />

        <SourcesList sources={sources} />
      </article>
    </>
  );
}
