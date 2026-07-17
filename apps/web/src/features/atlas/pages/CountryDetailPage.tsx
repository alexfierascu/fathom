import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId, getEntity, getRelated, type WaterBodyType } from '@fathom/data';

import { ContinueExploring } from '../../explore/ContinueExploring';
import { EntityGallery } from '../../media/MediaGallery';
import type { LayoutContext } from '../../../app/RootLayout';
import { EditorialSection } from '../components/EditorialSection';
import { EntityPills } from '../components/EntityPills';
import { InteractiveSection } from '../components/InteractiveSection';
import { PageHero } from '../components/PageHero';
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
        No country charted at this address.{' '}
        <Link viewTransition to="/">
          Return to the chart.
        </Link>
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

      <article>
        <PageHero
          eyebrow="Country"
          title={country.name}
          subtitle={country.summary}
          actions={
            straitDocs.length > 0 ? (
              <a className="uc-btn uc-btn--primary" href="#chart">
                See its waters on the chart
              </a>
            ) : undefined
          }
        />

        {straitDocs.length > 0 && (
          <InteractiveSection
            eyebrow="The chart"
            title={`The waters of ${country.name}`}
            id="chart"
            aside={
              <div>
                <div className="geo-label">At a glance</div>
                <div className="facts facts--line">
                  {facts.map((fact) => (
                    <div key={fact.label} className="fact">
                      <div className="fact-label">{fact.label}</div>
                      <div className="fact-value fact-value--small">{fact.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <StraitsMap straits={straitDocs} tileStyle={tileStyle} />
          </InteractiveSection>
        )}

        {straits.length > 0 && (
          <EditorialSection eyebrow="Its narrows" title={`Straits of ${country.name}`} wide>
            <div className="grid">
              {straits.map((strait) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          </EditorialSection>
        )}

        {(waterGroups.length > 0 || neighbors.length > 0) && (
          <EditorialSection eyebrow="The waters" title="The seas it touches" wide>
            <div className="geo-groups">
              {waterGroups.map((group) => (
                <div key={group.type}>
                  <div className="geo-label">{group.label}</div>
                  <EntityPills entities={group.bodies} />
                </div>
              ))}
              {neighbors.length > 0 && (
                <div>
                  <div className="geo-label">Neighbors across the water</div>
                  <EntityPills entities={neighbors} />
                </div>
              )}
            </div>
          </EditorialSection>
        )}

        {infrastructure.length > 0 && (
          <EditorialSection eyebrow="Infrastructure" title="What it has built" wide>
            <div className="geo-groups">
              {infrastructure.map((group) => (
                <div key={group.label}>
                  <div className="geo-label">{group.label}</div>
                  <EntityPills entities={group.entities} />
                </div>
              ))}
            </div>
          </EditorialSection>
        )}

        <div className="strait-onward">
          <EntityGallery entity={{ type: 'country', id: country.id }} />
          <SourcesList sources={sources} />
          <ContinueExploring entityId={`country:${country.id}`} entityName={country.name} />
        </div>
      </article>
    </>
  );
}
