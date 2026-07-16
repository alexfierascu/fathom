import {
  difficultyFor,
  estimateMinutes,
  straitQuiz,
  type Journey,
  type JourneyWaypoint,
} from './journeys';

/**
 * The starter journeys: curated voyages assembled purely from charted
 * entities. Waypoint summaries frame each leg of the trip; every fact a
 * traveller reads at a stop comes from the stop's own document, rendered
 * by the journey page. Selection and ordering are editorial.
 */

/** Deterministic PRNG so generated quizzes are stable across sessions. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const stop = (
  type: JourneyWaypoint['entity']['type'],
  id: string,
  summary: string,
  extras?: Partial<Omit<JourneyWaypoint, 'entity' | 'summary'>>,
): JourneyWaypoint => ({ entity: { type, id }, summary, ...extras });

function journey(
  spec: Omit<Journey, 'difficulty' | 'estimatedMinutes'> &
    Partial<Pick<Journey, 'difficulty' | 'estimatedMinutes'>>,
): Journey {
  return {
    difficulty: spec.difficulty ?? difficultyFor(spec.waypoints.length),
    estimatedMinutes: spec.estimatedMinutes ?? estimateMinutes(spec.waypoints.length),
    ...spec,
  };
}

let cached: readonly Journey[] | null = null;

export function loadJourneys(): readonly Journey[] {
  if (cached) return cached;
  const random = seeded(1010);
  const quiz = (straitId: string) => straitQuiz(straitId, random) ?? undefined;

  cached = [
    journey({
      id: 'oil-to-europe',
      title: 'Oil to Europe',
      subtitle: 'A tanker passage from the Persian Gulf to the North Sea',
      description:
        'Follow the water a cargo follows: out of the Persian Gulf, down the Red Sea, through the canal, and across the Mediterranean to the ports of northern Europe — a voyage that threads four of the narrowest passages in world trade.',
      coverImageId: 'hormuz-satellite',
      tags: ['chokepoint', 'historic-trade'],
      waypoints: [
        stop(
          'port',
          'shahid-rajai-port',
          'The voyage loads at the gateway port of the Persian Gulf.',
        ),
        stop('strait', 'hormuz', 'Out through the narrow exit of the Persian Gulf.', {
          challenge: 'On the map, find the two waters this strait joins.',
          quiz: quiz('hormuz'),
        }),
        stop('strait', 'bab-el-mandeb', 'Into the Red Sea through its southern gate.', {
          via: [
            { lat: 24.8, lon: 58.5 },
            { lat: 15.0, lon: 61.0 },
            { lat: 12.3, lon: 48.0 },
          ],
        }),
        stop('water-body', 'red-sea', 'North along the full length of the Red Sea.'),
        stop(
          'canal',
          'suez-canal',
          'Through the canal that joins the Red Sea to the Mediterranean.',
        ),
        stop('water-body', 'mediterranean-sea', 'West across the Mediterranean.'),
        stop('strait', 'gibraltar', 'Out into the Atlantic between two continents.', {
          quiz: quiz('gibraltar'),
          via: [{ lat: 37.2, lon: 9.5 }],
        }),
        stop('strait', 'dover', 'The final narrows before the North Sea ports.', {
          via: [
            { lat: 36.8, lon: -9.7 },
            { lat: 43.3, lon: -9.8 },
            { lat: 48.6, lon: -5.6 },
          ],
        }),
      ],
    }),
    journey({
      id: 'gateway-to-the-mediterranean',
      title: 'Gateway to the Mediterranean',
      subtitle: 'From the Pillars of Hercules to the Black Sea',
      description:
        'Cross the Mediterranean the long way: enter from the Atlantic, weave through its island narrows, and leave by the twin straits that guard the Black Sea.',
      coverImageId: 'gibraltar-satellite',
      tags: ['historic-trade', 'chokepoint'],
      waypoints: [
        stop('strait', 'gibraltar', 'Enter the Mediterranean by its only Atlantic door.', {
          quiz: quiz('gibraltar'),
        }),
        stop('water-body', 'mediterranean-sea', 'East into the ancient middle sea.'),
        stop('strait', 'messina', 'Through the narrows between Sicily and the mainland.'),
        stop('strait', 'otranto', 'Past the gate of the Adriatic.'),
        stop('water-body', 'aegean-sea', 'North through the island-studded Aegean.', {
          via: [{ lat: 36.2, lon: 22.3 }],
        }),
        stop('strait', 'dardanelles', 'Into the first of the Black Sea straits.', {
          challenge: 'Check the History section of this strait for the 1915 campaign.',
        }),
        stop('water-body', 'sea-of-marmara', 'Across the small sea between the two straits.'),
        stop('strait', 'bosporus', 'The last narrows — a city on both shores.', {
          quiz: quiz('bosporus'),
        }),
        stop('water-body', 'black-sea', 'Journey’s end on the Black Sea.'),
      ],
    }),
    journey({
      id: 'around-europe-by-sea',
      title: 'Around Europe by Sea',
      subtitle: 'Gibraltar to the Baltic without crossing land',
      description:
        'The long way north: from the Mediterranean gate, up the Atlantic seaboard, through the Channel narrows, and around Denmark into the Baltic.',
      tags: ['historic-trade'],
      waypoints: [
        stop('strait', 'gibraltar', 'Depart the Mediterranean for the open Atlantic.'),
        stop('strait', 'dover', 'Thread the busiest narrows in the world.', {
          quiz: quiz('dover'),
          via: [
            { lat: 36.8, lon: -9.7 },
            { lat: 43.3, lon: -9.8 },
            { lat: 48.6, lon: -5.6 },
          ],
        }),
        stop('water-body', 'north-sea', 'North across the shallow North Sea.'),
        stop('strait', 'skagerrak', 'Turn east around the top of Denmark.'),
        stop('strait', 'kattegat', 'South through the Kattegat.'),
        stop('strait', 'oresund', 'The bridge-crossed sound into the Baltic.', {
          challenge: 'Find the crossing charted over this strait.',
        }),
        stop('water-body', 'baltic-sea', 'Arrive in the brackish Baltic.'),
        stop('canal', 'kiel-canal', 'The shortcut home: the canal across the Jutland peninsula.', {
          via: [{ lat: 54.4, lon: 12.2 }],
        }),
      ],
    }),
    journey({
      id: 'the-worlds-great-chokepoints',
      title: "The World's Great Chokepoints",
      subtitle: 'Six narrows the global economy depends on',
      description:
        'A world tour of the straits the atlas tags as chokepoints — waters so narrow and so trafficked that events there echo through every market.',
      coverImageId: 'bosporus-satellite',
      tags: ['chokepoint'],
      waypoints: [
        stop('strait', 'hormuz', 'The Persian Gulf’s single exit.', { quiz: quiz('hormuz') }),
        stop('strait', 'malacca', 'The main street between the Indian and Pacific oceans.', {
          quiz: quiz('malacca'),
          via: [
            { lat: 24.8, lon: 58.5 },
            { lat: 10.0, lon: 65.0 },
            { lat: 5.8, lon: 80.3 },
            { lat: 5.5, lon: 95.0 },
          ],
        }),
        stop('strait', 'bab-el-mandeb', 'The southern gate of the Red Sea and Suez route.', {
          via: [
            { lat: 5.5, lon: 95.0 },
            { lat: 5.8, lon: 80.3 },
            { lat: 12.3, lon: 48.0 },
          ],
        }),
        stop('strait', 'bosporus', 'The Black Sea’s only outlet, through a city.', {
          via: [
            { lat: 20.5, lon: 38.5 },
            { lat: 30.45, lon: 32.35 },
            { lat: 33.5, lon: 29.0 },
            { lat: 35.0, lon: 26.5 },
            { lat: 38.0, lon: 25.5 },
            { lat: 40.15, lon: 26.4 },
            { lat: 40.72, lon: 28.2 },
          ],
        }),
        stop('strait', 'gibraltar', 'The Mediterranean’s Atlantic door.', {
          challenge: 'Compare this strait with Hormuz using the compare tool.',
          via: [
            { lat: 40.72, lon: 28.2 },
            { lat: 40.15, lon: 26.4 },
            { lat: 37.5, lon: 24.5 },
            { lat: 36.0, lon: 18.0 },
            { lat: 37.2, lon: 9.5 },
          ],
        }),
        stop('strait', 'dover', 'Europe’s busiest seaway.', {
          via: [
            { lat: 36.8, lon: -9.7 },
            { lat: 43.3, lon: -9.8 },
            { lat: 48.6, lon: -5.6 },
          ],
        }),
      ],
    }),
    journey({
      id: 'arctic-exploration',
      title: 'Arctic Exploration',
      subtitle: 'The high-latitude passages of the polar seas',
      description:
        'Trace the top of the world from the Pacific side to the Atlantic side, through the straits that link the Arctic Ocean to everything below it.',
      tags: ['polar'],
      waypoints: [
        stop('strait', 'bering', 'Enter the Arctic between two continents.', {
          quiz: quiz('bering'),
        }),
        stop('water-body', 'chukchi-sea', 'East along the Siberian Arctic coast.'),
        stop('strait', 'vilkitsky', 'The coldest narrows of the Northern Sea Route.', {
          via: [
            { lat: 71.5, lon: 178.0 },
            { lat: 73.0, lon: 165.0 },
            { lat: 75.0, lon: 140.0 },
            { lat: 77.0, lon: 120.0 },
          ],
        }),
        stop('strait', 'kara-strait', 'Between the Kara and Barents seas.', {
          via: [
            { lat: 76.0, lon: 85.0 },
            { lat: 73.0, lon: 68.0 },
          ],
        }),
        stop('strait', 'fram-strait', 'The deep gateway between Greenland and Svalbard.', {
          via: [
            { lat: 75.0, lon: 45.0 },
            { lat: 76.5, lon: 20.0 },
          ],
        }),
        stop('strait', 'nares', 'North of Baffin Bay, the channel toward the pole.', {
          via: [
            { lat: 81.0, lon: -5.0 },
            { lat: 83.5, lon: -30.0 },
            { lat: 83.2, lon: -55.0 },
          ],
        }),
        stop('strait', 'davis', 'South again between Greenland and Canada.', {
          via: [
            { lat: 77.0, lon: -73.0 },
            { lat: 72.0, lon: -63.0 },
          ],
        }),
      ],
    }),
    journey({
      id: 'the-silk-road-by-sea',
      title: 'The Silk Road by Sea',
      subtitle: 'The maritime trade artery between Asia and Europe',
      description:
        'Sail the modern course of an ancient exchange: from the South China Sea through the Malacca and Singapore narrows, across the Indian Ocean, and up through Suez to the Mediterranean.',
      tags: ['historic-trade'],
      waypoints: [
        stop('water-body', 'south-china-sea', 'Depart the manufacturing coasts of East Asia.'),
        stop('strait', 'singapore', 'Through the port-lined Singapore narrows.'),
        stop('strait', 'malacca', 'The long funnel into the Indian Ocean.', {
          quiz: quiz('malacca'),
        }),
        stop('water-body', 'indian-ocean', 'West across the Indian Ocean.'),
        stop('strait', 'bab-el-mandeb', 'Into the Red Sea by its southern gate.'),
        stop('canal', 'suez-canal', 'The 1869 shortcut between two seas.'),
        stop('water-body', 'mediterranean-sea', 'Arrive in the Mediterranean.'),
        stop('strait', 'gibraltar', 'And out, for the Atlantic ports of Europe.', {
          via: [{ lat: 37.2, lon: 9.5 }],
        }),
      ],
    }),
    journey({
      id: 'the-pacific-gateways',
      title: 'The Pacific Gateways',
      subtitle: 'The straits that ring the western Pacific',
      description:
        'Island-hop the western rim of the Pacific from south to north, through the passages that separate its seas from the open ocean.',
      tags: [],
      waypoints: [
        stop('strait', 'torres', 'Begin between Australia and New Guinea.'),
        stop('strait', 'luzon', 'North past the Philippines.', {
          quiz: quiz('luzon'),
          via: [
            { lat: -9.5, lon: 135.0 },
            { lat: -4.0, lon: 128.0 },
            { lat: 2.0, lon: 126.0 },
            { lat: 10.0, lon: 124.5 },
          ],
        }),
        stop('strait', 'taiwan', 'Through the strait between Taiwan and the mainland.', {
          via: [{ lat: 21.6, lon: 119.8 }],
        }),
        stop('strait', 'korea', 'Between Korea and Japan.'),
        stop('strait', 'tsugaru', 'The tunnel-crossed narrows between Honshu and Hokkaido.', {
          challenge: 'Find the crossing charted under this strait.',
        }),
        stop('strait', 'laperouse', 'North of Hokkaido toward the Sea of Okhotsk.'),
        stop('strait', 'bering', 'Journey’s end at the Arctic gateway.', {
          via: [
            { lat: 47.0, lon: 152.0 },
            { lat: 51.0, lon: 160.0 },
            { lat: 56.0, lon: 168.0 },
            { lat: 60.0, lon: 176.0 },
          ],
        }),
      ],
    }),
  ];
  return cached;
}

export function findJourney(slug: string | undefined): Journey | undefined {
  return loadJourneys().find((candidate) => candidate.id === slug);
}
