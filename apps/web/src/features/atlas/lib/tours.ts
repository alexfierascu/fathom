import { loadStrait, type Strait } from '@fathom/data';

/**
 * Curated journeys through the atlas. Selection and ordering are
 * editorial; every fact shown at a stop comes from the strait's own
 * document — tours add framing, never new claims.
 */
export interface Tour {
  id: string;
  title: string;
  tagline: string;
  /** Editorial framing only — must not assert facts absent from the data. */
  intro: string;
  straitIds: readonly string[];
}

export const TOURS: readonly Tour[] = [
  {
    id: 'oil-chokepoints',
    title: 'The Oil Chokepoints',
    tagline: 'Four narrow waters the world economy squeezes through',
    intro:
      'Follow the pressure points of global shipping, from the Persian Gulf to the Black Sea. Each stop is a strait the atlas tags as a chokepoint — waters narrow enough that what happens there is felt everywhere.',
    straitIds: ['hormuz', 'bab-el-mandeb', 'malacca', 'bosporus'],
  },
  {
    id: 'arctic-passages',
    title: 'Arctic Passages',
    tagline: 'The high-latitude gates of the polar seas',
    intro:
      'A sweep across the top of the world: the straits that link the Pacific, Atlantic, and Arctic oceans through ice-bound waters, from the Bering Strait to the channels of the Russian Arctic.',
    straitIds: ['bering', 'davis', 'nares', 'fram-strait', 'vilkitsky'],
  },
  {
    id: 'mediterranean-gates',
    title: 'Gates of the Mediterranean',
    tagline: 'From the Pillars of Hercules to the Black Sea',
    intro:
      'Trace the Mediterranean from its Atlantic entrance to its far northeastern exit — the sequence of narrows that made this sea the crossroads of the ancient and modern worlds.',
    straitIds: ['gibraltar', 'messina', 'bonifacio', 'otranto', 'dardanelles', 'bosporus'],
  },
];

export function findTour(slug: string | undefined): Tour | undefined {
  return TOURS.find((tour) => tour.id === slug);
}

export function tourStraits(tour: Tour): readonly Strait[] {
  return tour.straitIds.map((id) => loadStrait(id));
}
