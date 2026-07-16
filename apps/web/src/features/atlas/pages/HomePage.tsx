import { useOutletContext } from 'react-router';

import { loadAllStraits } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import {
  FeaturedJourneyCinematic,
  FeaturedStrait,
  HomeHero,
  ModeCards,
  OneFact,
} from '../../explore/HomeShowcase';
import { MapPanel } from '../components/MapPanel';
import { SeoTags } from '../components/SeoTags';
import { Section } from '../components/Section';

const STRAITS = loadAllStraits();

/**
 * The homepage answers one question — "what should I explore?" — in six
 * calm moments. Browsing, filtering, and the directories live on
 * /explore; the chart on /map; the educational shelf on /learn.
 */
export function HomePage() {
  const { tileStyle } = useOutletContext<LayoutContext>();

  return (
    <>
      <SeoTags
        title="Fathom — The Interactive Atlas of the World's Straits"
        description="The definitive interactive atlas of the world's straits — the narrow waters where oceans meet and history turns. Explorable, mapped, and sourced."
        path="/"
        ogType="website"
      />

      <HomeHero />
      <ModeCards />
      <FeaturedJourneyCinematic />
      <FeaturedStrait />

      <Section label="The world's straits">
        <MapPanel
          straits={STRAITS}
          filteredIds={null}
          hoveredId={null}
          visibleCount={STRAITS.length}
          tileStyle={tileStyle}
        />
      </Section>

      <OneFact />
    </>
  );
}
