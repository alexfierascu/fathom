import { Link, useOutletContext, useParams } from 'react-router';

import { getRelated, getStraitEntity, nearestStraits } from '@fathom/data';

import { EntityGallery } from '../../media/MediaGallery';
import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ConnectsLine } from '../components/ConnectsLine';
import { EntityPills } from '../components/EntityPills';
import { SeoTags } from '../components/SeoTags';
import { Section } from '../components/Section';
import { SourcesList } from '../components/SourcesList';
import { StraitCard } from '../components/StraitCard';
import { StraitMap } from '../components/StraitMap';
import { StraitPager } from '../components/StraitPager';
import { relatedStraits } from '../lib/discovery';
import { formatLat, formatLon } from '../lib/format';
import { findStraitBySlug, getAdjacentStraits } from '../lib/navigation';
import { breadcrumbsJsonLd, buildStraitSeo, placeJsonLd } from '../lib/seo';

export function StraitDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const strait = findStraitBySlug(slug);

  if (!strait) {
    return (
      <div className="empty">
        No strait charted at this address. <Link to="/">Return to the chart.</Link>
      </div>
    );
  }

  const { previous, next } = getAdjacentStraits(strait.id);
  const entity = getStraitEntity(strait);
  const region = getRelated(entity, 'region');
  const countries = getRelated(entity, 'countries');
  const waterBodies = getRelated(entity, 'waterBodies');
  const regionName = region?.name ?? strait.region;
  const crossings = getRelated(entity, 'crossings');
  const islands = getRelated(entity, 'islands');
  const ports = getRelated(entity, 'ports');
  const routes = getRelated(entity, 'routes');
  const sources = getRelated(entity, 'sources');
  const nearby = nearestStraits(strait.lat, strait.lon, { limit: 5, excludeId: strait.id });
  const continueExploring = relatedStraits(strait, 3);
  const seo = buildStraitSeo(strait);

  const quickFacts = [
    { label: 'Region', value: regionName },
    { label: 'Coordinates', value: `${formatLat(strait.lat)}, ${formatLon(strait.lon)}` },
    { label: 'Countries', value: String(countries.length) },
    { label: 'Connected waters', value: String(Math.max(waterBodies.length, 1)) },
    ...(crossings.length > 0 ? [{ label: 'Crossings', value: String(crossings.length) }] : []),
    ...(routes.length > 0 ? [{ label: 'Routes through', value: String(routes.length) }] : []),
  ];

  return (
    <>
      <SeoTags
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={[
          placeJsonLd({
            name: strait.name,
            description: seo.description,
            path: seo.path,
            lat: strait.lat,
            lon: strait.lon,
          }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            ...(region ? [{ name: region.name, path: `/regions/${region.id}` }] : []),
            { name: strait.name, path: seo.path },
          ]),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          region ? { label: region.name, to: `/regions/${region.id}` } : { label: regionName },
          { label: strait.name },
        ]}
      />

      <article className="detail strait-article">
        <header className="strait-hero">
          <div className="eyebrow">{regionName}</div>
          <h2 className="detail-title detail-title--hero">{strait.name}</h2>
          <EntityPills entities={countries} />
          <ConnectsLine strait={strait} />
        </header>

        <Section label="Quick facts">
          <div className="facts">
            {quickFacts.map((fact) => (
              <div key={fact.label} className="fact">
                <div className="fact-label">{fact.label}</div>
                <div className="fact-value fact-value--small">{fact.value}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Overview">
          <p className="note note--lede">{strait.note}</p>
        </Section>

        <StraitMap strait={strait} tileStyle={tileStyle} />

        {(islands.length > 0 || ports.length > 0 || crossings.length > 0) && (
          <Section label="Geography">
            <div className="geo-groups">
              {islands.length > 0 && (
                <div>
                  <div className="geo-label">Islands</div>
                  <EntityPills entities={islands} />
                </div>
              )}
              {ports.length > 0 && (
                <div>
                  <div className="geo-label">Ports</div>
                  <EntityPills entities={ports} />
                </div>
              )}
              {crossings.length > 0 && (
                <div>
                  <div className="geo-label">Crossings</div>
                  <EntityPills entities={crossings} />
                </div>
              )}
            </div>
          </Section>
        )}

        {routes.length > 0 && (
          <Section label="Routes through">
            <EntityPills entities={routes} />
          </Section>
        )}

        {nearby.length > 0 && (
          <Section label="Nearby straits">
            <div className="pills">
              {nearby.map((neighbor) => (
                <Link key={neighbor.id} className="pill" to={`/straits/${neighbor.id}`}>
                  {neighbor.name}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <EntityGallery entity={{ type: 'strait', id: strait.id }} />

        <SourcesList sources={sources} />

        <StraitPager previous={previous} next={next} />

        {continueExploring.length > 0 && (
          <Section label="Continue exploring">
            <div className="grid">
              {continueExploring.map((suggestion) => (
                <StraitCard key={suggestion.id} strait={suggestion} />
              ))}
            </div>
          </Section>
        )}
      </article>
    </>
  );
}
