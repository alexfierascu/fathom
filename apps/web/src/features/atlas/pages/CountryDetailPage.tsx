import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId, getEntity, getRelated, type WaterBodyType } from '@fathom/data';

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

        {waterGroups.map((group) => (
          <Section key={group.type} label={group.label}>
            <EntityPills entities={group.bodies} />
          </Section>
        ))}

        <Section label="Infrastructure">
          <div className="facts">
            {INFRASTRUCTURE_LABELS.map((label) => (
              <div key={label} className="fact">
                <div className="fact-label">{label}</div>
                <div className="fact-value">—</div>
              </div>
            ))}
          </div>
        </Section>

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

        <StraitsMap straits={straitDocs} tileStyle={tileStyle} />

        {straits.length > 0 && (
          <Section label={`Straits of ${country.name}`}>
            <div className="grid">
              {straits.map((strait) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          </Section>
        )}

        {neighbors.length > 0 && (
          <Section label="Neighbors across the water">
            <EntityPills entities={neighbors} />
          </Section>
        )}

        <SourcesList sources={sources} />
      </article>
    </>
  );
}
