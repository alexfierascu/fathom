import { Link, useOutletContext, useParams } from 'react-router';

import { getRelated, getStraitEntity, loadImagesFor, loadSourcesFor } from '@fathom/data';
import { journeyVisits, loadJourneys } from '@fathom/discovery';

import type { LayoutContext } from '../../../app/RootLayout';
import { ContinueExploring } from '../../explore/ContinueExploring';
import { EntityGallery } from '../../media/MediaGallery';
import { mediaSrcSet, mediaUrl } from '../../media/media';
import { ConnectsLine } from '../components/ConnectsLine';
import { EditorialSection } from '../components/EditorialSection';
import { EntityPills } from '../components/EntityPills';
import { InteractiveSection } from '../components/InteractiveSection';
import { PageHero } from '../components/PageHero';
import { Section } from '../components/Section';
import { SeoTags } from '../components/SeoTags';
import { SourcesList } from '../components/SourcesList';
import { StraitMap } from '../components/StraitMap';
import { StraitPager } from '../components/StraitPager';
import { formatDateValue, formatLat, formatLon } from '../lib/format';
import { findStraitBySlug, getAdjacentStraits } from '../lib/navigation';
import { breadcrumbsJsonLd, buildStraitSeo, placeJsonLd } from '../lib/seo';

/**
 * The strait as an expedition, not a datasheet: a fullscreen hero, the
 * story of why it matters, its history, the chart itself with the
 * numbers alongside, then the waters, wildlife, images, and onward
 * journeys — each given room to breathe.
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
  const wildlife = getRelated(entity, 'wildlife');
  const sources = getRelated(entity, 'sources');
  const heroImage = loadImagesFor({ type: 'strait', id: strait.id })[0];
  const statistics = getRelated(entity, 'statistics');
  const journeys = loadJourneys().filter((journey) =>
    journeyVisits(journey, `strait:${strait.id}`),
  );
  const seo = buildStraitSeo(strait);

  const dims = strait.dimensions;
  const dimension = (m: { value: number; unit: string } | undefined, label: string) =>
    m ? [{ label, value: `${String(m.value)} ${m.unit}` }] : [];
  const quickFacts = [
    { label: 'Region', value: regionName },
    { label: 'Coordinates', value: `${formatLat(strait.lat)}, ${formatLon(strait.lon)}` },
    ...dimension(dims?.length, 'Length'),
    ...dimension(dims?.widthMin, 'Narrowest'),
    ...dimension(dims?.depthMin, 'Least depth'),
    { label: 'Countries', value: String(countries.length) },
    { label: 'Connected waters', value: String(Math.max(waterBodies.length, 1)) },
    ...(crossings.length > 0 ? [{ label: 'Crossings', value: String(crossings.length) }] : []),
    ...(routes.length > 0 ? [{ label: 'Routes through', value: String(routes.length) }] : []),
  ];

  const hasNavigation =
    routes.length > 0 || crossings.length > 0 || ports.length > 0 || islands.length > 0;
  const hasLongRead =
    Boolean(strait.summary && strait.summary !== strait.note) || Boolean(strait.description);

  return (
    <>
      <SeoTags
        title={seo.title}
        description={seo.description}
        path={seo.path}
        image={heroImage ? `/og/straits/${strait.id}.jpg` : undefined}
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

      <article className="strait-article">
        <PageHero
          eyebrow={regionName}
          title={strait.name}
          subtitle={strait.note}
          image={heroImage ? mediaUrl(heroImage.file) : undefined}
          imageSrcSet={heroImage ? mediaSrcSet(heroImage.file) : undefined}
          pills={
            <>
              <EntityPills entities={countries} />
              {tags.map((tag) => (
                <Link viewTransition key={tag.id} className="pill pill--tag" to={`/tags/${tag.id}`}>
                  {tag.name}
                </Link>
              ))}
            </>
          }
          actions={
            <>
              <a className="uc-btn uc-btn--primary" href="#chart">
                See it on the chart
              </a>
              <Link viewTransition className="uc-btn uc-btn--ghost" to={`/compare/${strait.id}`}>
                Compare this strait ⇄
              </Link>
            </>
          }
        >
          <ConnectsLine strait={strait} />
        </PageHero>

        <EditorialSection eyebrow="The story" title={`Why the ${strait.name} matters`}>
          <p className="lede">{strait.note}</p>
          {strait.summary && strait.summary !== strait.note && <p>{strait.summary}</p>}
          {strait.description
            ?.split('\n\n')
            .filter(Boolean)
            .map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          {!hasLongRead && countries.length > 0 && (
            <p>
              It runs between {countries.map((country) => country.name).join(' and ')}, one of the
              narrow waters where the map — and history — turns.
            </p>
          )}
        </EditorialSection>

        {events.length > 0 && (
          <EditorialSection eyebrow="History" title="Moments that turned here" wide>
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
              The full timeline →
            </Link>
          </EditorialSection>
        )}

        <InteractiveSection
          eyebrow="The chart"
          title={`${strait.name} on the water`}
          id="chart"
          aside={
            <>
              <div>
                <div className="geo-label">Quick facts</div>
                <div className="facts facts--line">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="fact">
                      <div className="fact-label">{fact.label}</div>
                      <div className="fact-value fact-value--small">{fact.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {statistics.length > 0 && (
                <div>
                  <div className="geo-label">Numbers that matter</div>
                  <div className="stat-cards">
                    {statistics.map((stat) => (
                      <div key={`${stat.metric}-${stat.period}`} className="stat-card">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-unit">{stat.unit}</div>
                        <div className="geo-label">
                          {stat.metric === 'oil-transit' ? 'Oil moved through' : stat.metric} ·{' '}
                          {stat.period} · {loadSourcesFor(stat)[0]?.publisher ?? 'sourced'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          }
        >
          <StraitMap strait={strait} tileStyle={tileStyle} />
        </InteractiveSection>

        {hasNavigation && (
          <EditorialSection
            eyebrow="Around the narrows"
            title="What moves through these waters"
            wide
          >
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
          </EditorialSection>
        )}

        {wildlife.length > 0 && (
          <EditorialSection eyebrow="Life at the narrows" title="Who else passes this way" wide>
            <div className="wildlife-rail">
              {wildlife.map((species) => (
                <article key={species.id} className="wildlife-card">
                  <div className="eyebrow">
                    {species.data.scientificName}
                    {species.data.conservationStatus ? ' · at risk' : ''}
                  </div>
                  <h3>{species.data.commonName}</h3>
                  <p className="note">{species.data.summary}</p>
                  {species.data.seasonality && (
                    <div className="coords">{species.data.seasonality}</div>
                  )}
                </article>
              ))}
            </div>
          </EditorialSection>
        )}

        <div className="strait-onward">
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
                      {String(journey.waypoints.length)} stops · ~{String(journey.estimatedMinutes)}{' '}
                      min
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
      </article>
    </>
  );
}
