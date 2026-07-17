import { Link, useOutletContext, useParams } from 'react-router';

import { getRelated, getStraitEntity, loadImagesFor } from '@fathom/data';
import { journeyVisits, loadJourneys } from '@fathom/discovery';

import { ContinueExploring } from '../../explore/ContinueExploring';
import { EntityGallery } from '../../media/MediaGallery';
import { mediaUrl } from '../../media/media';
import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ConnectsLine } from '../components/ConnectsLine';
import { EntityPills } from '../components/EntityPills';
import { SeoTags } from '../components/SeoTags';
import { Section } from '../components/Section';
import { SourcesList } from '../components/SourcesList';
import { StraitMap } from '../components/StraitMap';
import { StraitPager } from '../components/StraitPager';
import { formatDateValue, formatLat, formatLon } from '../lib/format';
import { findStraitBySlug, getAdjacentStraits } from '../lib/navigation';
import { breadcrumbsJsonLd, buildStraitSeo, placeJsonLd } from '../lib/seo';

/**
 * The strait article, ordered as a story: the hero (with imagery when
 * the strait has any), the chart, why it matters, the facts, its
 * history, its role in navigation, and then onward — the gallery,
 * exploration, and journeys that pass this way.
 */
export function StraitDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const strait = findStraitBySlug(slug);

  if (!strait) {
    return (
      <div className="empty">
        No strait charted at this address.{' '}
        <Link viewTransition to="/">
          Return to the chart.
        </Link>
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
  const tags = getRelated(entity, 'tags');
  const events = [...getRelated(entity, 'events')].sort(
    (a, b) =>
      (Number.parseInt(a.data.date.value, 10) || 0) - (Number.parseInt(b.data.date.value, 10) || 0),
  );
  const sources = getRelated(entity, 'sources');
  const heroImage = loadImagesFor({ type: 'strait', id: strait.id })[0];
  const journeys = loadJourneys().filter((journey) =>
    journeyVisits(journey, `strait:${strait.id}`),
  );
  const seo = buildStraitSeo(strait);

  const quickFacts = [
    { label: 'Region', value: regionName },
    { label: 'Coordinates', value: `${formatLat(strait.lat)}, ${formatLon(strait.lon)}` },
    { label: 'Countries', value: String(countries.length) },
    { label: 'Connected waters', value: String(Math.max(waterBodies.length, 1)) },
    ...(crossings.length > 0 ? [{ label: 'Crossings', value: String(crossings.length) }] : []),
    ...(routes.length > 0 ? [{ label: 'Routes through', value: String(routes.length) }] : []),
  ];

  const hasNavigation =
    routes.length > 0 || crossings.length > 0 || ports.length > 0 || islands.length > 0;

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
        <header className={heroImage ? 'strait-hero strait-hero--image' : 'strait-hero'}>
          {heroImage && (
            <div
              className="strait-hero-media"
              style={{ backgroundImage: `url(${mediaUrl(heroImage.file)})` }}
            />
          )}
          <div className="strait-hero-content">
            <div className="eyebrow">{regionName}</div>
            <h2 className="detail-title detail-title--hero">{strait.name}</h2>
            <EntityPills entities={countries} />
            <ConnectsLine strait={strait} />
            {tags.length > 0 && (
              <div className="pills pills--tags">
                {tags.map((tag) => (
                  <Link
                    viewTransition
                    key={tag.id}
                    className="pill pill--tag"
                    to={`/tags/${tag.id}`}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="chart-split">
          <aside className="chart-rail">
            <StraitMap strait={strait} tileStyle={tileStyle} />
            <Section label="Quick facts">
              <div className="facts facts--line">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="fact">
                    <div className="fact-label">{fact.label}</div>
                    <div className="fact-value fact-value--small">{fact.value}</div>
                  </div>
                ))}
              </div>
            </Section>
          </aside>
          <div className="chart-story">
            <Section label="Why it matters">
              <p className="note note--lede">{strait.note}</p>
            </Section>

            {events.length > 0 && (
              <Section label="History">
                <ol className="timeline timeline--compact">
                  {events.map((event) => (
                    <li key={event.id} className="timeline-event">
                      <div className="timeline-year">{formatDateValue(event.data.date)}</div>
                      <div className="timeline-body">
                        <h3>{event.name}</h3>
                        <p className="note">{event.data.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link viewTransition className="more-link" to="/timeline">
                  Full timeline →
                </Link>
              </Section>
            )}

            {hasNavigation && (
              <Section label="Its place in navigation">
                <div className="geo-groups">
                  {routes.length > 0 && (
                    <div>
                      <div className="geo-label">Shipping routes through</div>
                      <EntityPills entities={routes} />
                    </div>
                  )}
                  {crossings.length > 0 && (
                    <div>
                      <div className="geo-label">Crossings over and under</div>
                      <EntityPills entities={crossings} />
                    </div>
                  )}
                  {ports.length > 0 && (
                    <div>
                      <div className="geo-label">Ports on its shores</div>
                      <EntityPills entities={ports} />
                    </div>
                  )}
                  {islands.length > 0 && (
                    <div>
                      <div className="geo-label">Islands in the narrows</div>
                      <EntityPills entities={islands} />
                    </div>
                  )}
                </div>
              </Section>
            )}

            <EntityGallery entity={{ type: 'strait', id: strait.id }} />

            <ContinueExploring entityId={`strait:${strait.id}`} entityName={strait.name}>
              <Link viewTransition className="pill pill--action" to={`/compare/${strait.id}`}>
                Compare this strait ⇄
              </Link>
            </ContinueExploring>

            {journeys.length > 0 && (
              <Section label="Journeys that pass this way">
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

            <StraitPager previous={previous} next={next} />
          </div>
        </div>
      </article>
    </>
  );
}
