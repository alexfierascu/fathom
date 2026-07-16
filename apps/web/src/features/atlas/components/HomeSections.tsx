import { Link } from 'react-router';

import {
  entityId,
  getEntity,
  getRelated,
  loadAllCountries,
  loadAllStraits,
  loadAllWaterBodies,
  loadStrait,
  slugifyName,
} from '@fathom/data';

import { Section } from './Section';
import { StraitCard } from './StraitCard';

/**
 * Editorial curation for the homepage. Selection is editorial; every fact
 * shown comes from the documents themselves.
 */
const CHOKEPOINT_IDS = ['hormuz', 'malacca', 'bab-el-mandeb', 'bosporus', 'dover', 'gibraltar'];
const FACT_STRAIT_IDS = ['hormuz', 'malacca', 'denmark'];

const straitsByCount = <T extends { id: string; name: string }>(
  entities: readonly T[],
  count: (entity: T) => number,
  take: number,
) =>
  entities
    .map((entity) => ({ entity, straits: count(entity) }))
    .filter((entry) => entry.straits > 0)
    .sort((a, b) => b.straits - a.straits || a.entity.name.localeCompare(b.entity.name))
    .slice(0, take);

export function Chokepoints() {
  const straits = CHOKEPOINT_IDS.map((id) => loadStrait(id));
  return (
    <Section label="Major maritime chokepoints">
      <div className="card-row">
        {straits.map((strait) => (
          <StraitCard key={strait.id} strait={strait} />
        ))}
      </div>
    </Section>
  );
}

export function ExploreSections() {
  const straits = loadAllStraits();

  const regions = [...new Set(straits.map((strait) => strait.region))].map((region) => ({
    name: region,
    id: slugifyName(region),
    count: straits.filter((strait) => strait.region === region).length,
  }));

  const seas = straitsByCount(
    loadAllWaterBodies(),
    (waterBody) => {
      const node = getEntity(entityId('water-body', waterBody.id));
      return node?.type === 'water-body' ? getRelated(node, 'straits').length : 0;
    },
    8,
  );

  const countries = straitsByCount(
    loadAllCountries(),
    (country) => {
      const node = getEntity(entityId('country', country.id));
      return node?.type === 'country' ? getRelated(node, 'straits').length : 0;
    },
    10,
  );

  return (
    <>
      <div id="explore-regions">
        <Section label="Explore by region">
          <div className="facts">
            {regions.map((region) => (
              <Link key={region.name} className="fact fact--link" to={`/regions/${region.id}`}>
                <div className="fact-label">{region.name}</div>
                <div className="fact-value">
                  {region.count} strait{region.count === 1 ? '' : 's'}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>

      <div id="explore-seas">
        <Section label="Explore by sea">
          <div className="facts">
            {seas.map(({ entity, straits: count }) => (
              <Link key={entity.id} className="fact fact--link" to={`/water-bodies/${entity.id}`}>
                <div className="fact-label">{entity.name}</div>
                <div className="fact-value">
                  {count} strait{count === 1 ? '' : 's'}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>

      <div id="explore-countries">
        <Section label="Explore by country">
          <div className="facts">
            {countries.map(({ entity, straits: count }) => (
              <Link key={entity.id} className="fact fact--link" to={`/countries/${entity.id}`}>
                <div className="fact-label">{entity.name}</div>
                <div className="fact-value">
                  {count} strait{count === 1 ? '' : 's'}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

export function InterestingFacts() {
  const facts = FACT_STRAIT_IDS.map((id) => loadStrait(id));
  return (
    <Section label="From the chart">
      <div className="fact-quotes">
        {facts.map((strait) => (
          <blockquote key={strait.id} className="fact-quote">
            <p>{strait.note}</p>
            <footer>
              — <Link to={`/straits/${strait.id}`}>{strait.name}</Link>
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}

export function RecentlyCharted() {
  const recent = [...loadAllStraits()].slice(-6).reverse();
  return (
    <Section label="Recently charted">
      <div className="pills">
        {recent.map((strait) => (
          <Link key={strait.id} className="pill" to={`/straits/${strait.id}`}>
            {strait.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}
