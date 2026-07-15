import {
  WaterBodiesIndexSchema,
  WaterBodySchema,
  type WaterBodiesIndex,
  type WaterBody,
} from './schema';

import rawIndex from './water-bodies/index.json';

import rawAdriaticSea from './water-bodies/adriatic-sea.json';
import rawAegeanSea from './water-bodies/aegean-sea.json';
import rawAndamanSea from './water-bodies/andaman-sea.json';
import rawArafuraSea from './water-bodies/arafura-sea.json';
import rawArcticOcean from './water-bodies/arctic-ocean.json';
import rawAtlanticOcean from './water-bodies/atlantic-ocean.json';
import rawBaffinBay from './water-bodies/baffin-bay.json';
import rawBalticApproaches from './water-bodies/baltic-approaches.json';
import rawBalticSea from './water-bodies/baltic-sea.json';
import rawBayOfBengal from './water-bodies/bay-of-bengal.json';
import rawBlackSea from './water-bodies/black-sea.json';
import rawCelebesSea from './water-bodies/celebes-sea.json';
import rawCoralSea from './water-bodies/coral-sea.json';
import rawEastChinaSea from './water-bodies/east-china-sea.json';
import rawEnglishChannel from './water-bodies/english-channel.json';
import rawGreenlandSea from './water-bodies/greenland-sea.json';
import rawGulfOfAden from './water-bodies/gulf-of-aden.json';
import rawGulfOfMexico from './water-bodies/gulf-of-mexico.json';
import rawGulfOfOman from './water-bodies/gulf-of-oman.json';
import rawGulfOfStLawrence from './water-bodies/gulf-of-st-lawrence.json';
import rawHudsonBay from './water-bodies/hudson-bay.json';
import rawIndianOcean from './water-bodies/indian-ocean.json';
import rawIonianSea from './water-bodies/ionian-sea.json';
import rawJavaSea from './water-bodies/java-sea.json';
import rawKaraSea from './water-bodies/kara-sea.json';
import rawKattegat from './water-bodies/kattegat.json';
import rawLabradorSea from './water-bodies/labrador-sea.json';
import rawLaptevSea from './water-bodies/laptev-sea.json';
import rawMalaccaStrait from './water-bodies/malacca-strait.json';
import rawMediterraneanSea from './water-bodies/mediterranean-sea.json';
import rawNorthSea from './water-bodies/north-sea.json';
import rawPacificOcean from './water-bodies/pacific-ocean.json';
import rawPalkBay from './water-bodies/palk-bay.json';
import rawPersianGulf from './water-bodies/persian-gulf.json';
import rawPhilippineSea from './water-bodies/philippine-sea.json';
import rawRedSea from './water-bodies/red-sea.json';
import rawSalishSea from './water-bodies/salish-sea.json';
import rawSeaOfAzov from './water-bodies/sea-of-azov.json';
import rawSeaOfJapan from './water-bodies/sea-of-japan.json';
import rawSeaOfMarmara from './water-bodies/sea-of-marmara.json';
import rawSeaOfOkhotsk from './water-bodies/sea-of-okhotsk.json';
import rawSkagerrak from './water-bodies/skagerrak.json';
import rawSouthChinaSea from './water-bodies/south-china-sea.json';
import rawSouthernOcean from './water-bodies/southern-ocean.json';
import rawTasmanSea from './water-bodies/tasman-sea.json';
import rawTyrrhenianSea from './water-bodies/tyrrhenian-sea.json';

/**
 * Every water body document ships with the package and is imported
 * statically, mirroring the straits loader. Adding a water body means
 * adding its JSON file, an index.json entry, and one import here.
 */
const RAW_WATER_BODY_DOCUMENTS: readonly unknown[] = [
  rawAdriaticSea,
  rawAegeanSea,
  rawAndamanSea,
  rawArafuraSea,
  rawArcticOcean,
  rawAtlanticOcean,
  rawBaffinBay,
  rawBalticApproaches,
  rawBalticSea,
  rawBayOfBengal,
  rawBlackSea,
  rawCelebesSea,
  rawCoralSea,
  rawEastChinaSea,
  rawEnglishChannel,
  rawGreenlandSea,
  rawGulfOfAden,
  rawGulfOfMexico,
  rawGulfOfOman,
  rawGulfOfStLawrence,
  rawHudsonBay,
  rawIndianOcean,
  rawIonianSea,
  rawJavaSea,
  rawKaraSea,
  rawKattegat,
  rawLabradorSea,
  rawLaptevSea,
  rawMalaccaStrait,
  rawMediterraneanSea,
  rawNorthSea,
  rawPacificOcean,
  rawPalkBay,
  rawPersianGulf,
  rawPhilippineSea,
  rawRedSea,
  rawSalishSea,
  rawSeaOfAzov,
  rawSeaOfJapan,
  rawSeaOfMarmara,
  rawSeaOfOkhotsk,
  rawSkagerrak,
  rawSouthChinaSea,
  rawSouthernOcean,
  rawTasmanSea,
  rawTyrrhenianSea,
];

interface LoadedWaterBodies {
  index: WaterBodiesIndex;
  byId: ReadonlyMap<string, WaterBody>;
  all: readonly WaterBody[];
}

let cache: LoadedWaterBodies | null = null;

/**
 * Validates the index and every document with Zod (once, memoized),
 * cross-checks consistency, and verifies that every parentId resolves.
 */
function load(): LoadedWaterBodies {
  if (cache) return cache;

  const index = WaterBodiesIndexSchema.parse(rawIndex);

  const byId = new Map<string, WaterBody>();
  for (const raw of RAW_WATER_BODY_DOCUMENTS) {
    const waterBody = WaterBodySchema.parse(raw);
    if (byId.has(waterBody.id)) {
      throw new Error(`Duplicate water body document for id "${waterBody.id}"`);
    }
    byId.set(waterBody.id, waterBody);
  }

  if (index.length !== byId.size) {
    throw new Error(
      `Index lists ${String(index.length)} water bodies but ${String(byId.size)} documents exist`,
    );
  }

  const all = index.map((entry) => {
    const waterBody = byId.get(entry.id);
    if (!waterBody) {
      throw new Error(`Index entry "${entry.id}" has no water body document`);
    }
    return waterBody;
  });

  for (const waterBody of all) {
    if (waterBody.parentId !== undefined && !byId.has(waterBody.parentId)) {
      throw new Error(`Water body "${waterBody.id}" has unknown parent "${waterBody.parentId}"`);
    }
  }

  cache = { index, byId, all };
  return cache;
}

/** The lightweight index of all water bodies, in canonical order. */
export function loadWaterBodiesIndex(): WaterBodiesIndex {
  return load().index;
}

/** One full water body document by id. Throws for unknown ids. */
export function loadWaterBody(id: string): WaterBody {
  const waterBody = load().byId.get(id);
  if (!waterBody) {
    throw new Error(`Unknown water body id "${id}"`);
  }
  return waterBody;
}

/** All full water body documents, in canonical (index) order. */
export function loadAllWaterBodies(): readonly WaterBody[] {
  return load().all;
}
