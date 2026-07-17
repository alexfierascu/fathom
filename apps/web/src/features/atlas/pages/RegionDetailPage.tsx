import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { getEntity, getRelated } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { ContinueExploring } from '../../explore/ContinueExploring';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EntityPills } from '../components/EntityPills';
import { Section } from '../components/Section';
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

      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: node.name }]} />

      <article className="detail">
        <div className="eyebrow">Region</div>
        <h2 className="detail-title">{node.name}</h2>
        <div className="note">{summary}</div>

        <div className="chart-split">
          <aside className="chart-rail">
            <StraitsMap straits={straitDocs} tileStyle={tileStyle} />
            <Section label="Statistics">
              <div className="facts facts--line">
                {facts.map((fact) => (
                  <div key={fact.label} className="fact">
                    <div className="fact-label">{fact.label}</div>
                    <div className="fact-value fact-value--small">{fact.value}</div>
                  </div>
                ))}
              </div>
            </Section>
          </aside>
          <div className="chart-story">
            {waterBodies.length > 0 && (
              <Section label="Waters of the region">
                <EntityPills entities={waterBodies} />
              </Section>
            )}

            {countries.length > 0 && (
              <Section label="Countries">
                <EntityPills entities={countries} />
              </Section>
            )}

            {straits.length > 0 && (
              <Section label={`Straits of ${node.name}`}>
                <div className="grid">
                  {straits.map((strait) => (
                    <StraitCard key={strait.id} strait={strait.data} />
                  ))}
                </div>
              </Section>
            )}

            <ContinueExploring entityId={node.entityId} entityName={node.name} />
          </div>
        </div>
      </article>
    </>
  );
}
