import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { getEntity, getRelated } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { ContinueExploring } from '../../explore/ContinueExploring';
import { EditorialSection } from '../components/EditorialSection';
import { EntityPills } from '../components/EntityPills';
import { InteractiveSection } from '../components/InteractiveSection';
import { PageHero } from '../components/PageHero';
import { SeoTags } from '../components/SeoTags';
import { StraitCard } from '../components/StraitCard';
import { StraitsMap } from '../components/StraitsMap';
import { breadcrumbsJsonLd, placeJsonLd } from '../lib/seo';

export function RegionDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();

  const region = useMemo(() => {
    if (!slug) return null;
    const node = getEntity(`region:${slug}`);
    if (node?.type !== 'region') return null;
    const straits = getRelated(node, 'straits');
    return {
      node,
      straits,
      straitDocs: straits.map((strait) => strait.data),
      waterBodies: getRelated(node, 'waterBodies'),
      countries: getRelated(node, 'countries'),
    };
  }, [slug]);

  if (!region) {
    return (
      <div className="empty">
        No region charted at this address.{' '}
        <Link viewTransition to="/">
          Return to the chart.
        </Link>
      </div>
    );
  }

  const { node, straits, straitDocs, waterBodies, countries } = region;

  // Everything on this page is computed from the atlas — regions carry no
  // authored prose of their own yet.
  const summary = `${String(straits.length)} straits charted between ${String(
    waterBodies.length,
  )} named waters, touching ${String(countries.length)} countries.`;

  const title = `${node.name} — Fathom`;
  const path = `/regions/${node.id}`;

  const facts = [
    { label: 'Straits', value: String(straits.length) },
    { label: 'Water bodies', value: String(waterBodies.length) },
    { label: 'Countries', value: String(countries.length) },
  ];

  return (
    <>
      <SeoTags
        title={title}
        description={`${node.name}: ${summary}`}
        path={path}
        jsonLd={[
          placeJsonLd({ name: node.name, description: summary, path }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            { name: node.name, path },
          ]),
        ]}
      />

      <article>
        <PageHero
          eyebrow="Region"
          title={node.name}
          subtitle={summary}
          actions={
            straitDocs.length > 0 ? (
              <a className="uc-btn uc-btn--primary" href="#chart">
                See the region on the chart
              </a>
            ) : undefined
          }
        />

        {straitDocs.length > 0 && (
          <InteractiveSection
            eyebrow="The chart"
            title={`${node.name} at a glance`}
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

        {(waterBodies.length > 0 || countries.length > 0) && (
          <EditorialSection eyebrow="The region" title="Its waters and coasts" wide>
            <div className="geo-groups">
              {waterBodies.length > 0 && (
                <div>
                  <div className="geo-label">Waters of the region</div>
                  <EntityPills entities={waterBodies} />
                </div>
              )}
              {countries.length > 0 && (
                <div>
                  <div className="geo-label">Countries</div>
                  <EntityPills entities={countries} />
                </div>
              )}
            </div>
          </EditorialSection>
        )}

        {straits.length > 0 && (
          <EditorialSection eyebrow="Its narrows" title={`Straits of ${node.name}`} wide>
            <div className="grid">
              {straits.map((strait) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          </EditorialSection>
        )}

        <div className="strait-onward">
          <ContinueExploring entityId={node.entityId} entityName={node.name} />
        </div>
      </article>
    </>
  );
}
