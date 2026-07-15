import { StraitSchema, StraitsIndexSchema, type Strait, type StraitsIndex } from './schema';

import rawIndex from './straits/index.json';

import rawBabElMandeb from './straits/bab-el-mandeb.json';
import rawBass from './straits/bass.json';
import rawBelleisle from './straits/belleisle.json';
import rawBering from './straits/bering.json';
import rawBonifacio from './straits/bonifacio.json';
import rawBosporus from './straits/bosporus.json';
import rawCook from './straits/cook.json';
import rawDardanelles from './straits/dardanelles.json';
import rawDavis from './straits/davis.json';
import rawDenmark from './straits/denmark.json';
import rawDover from './straits/dover.json';
import rawFlorida from './straits/florida.json';
import rawGeorgia from './straits/georgia.json';
import rawGibraltar from './straits/gibraltar.json';
import rawHormuz from './straits/hormuz.json';
import rawHudson from './straits/hudson.json';
import rawJuandefuca from './straits/juandefuca.json';
import rawKarimata from './straits/karimata.json';
import rawKattegat from './straits/kattegat.json';
import rawKerch from './straits/kerch.json';
import rawKorea from './straits/korea.json';
import rawLaperouse from './straits/laperouse.json';
import rawLombok from './straits/lombok.json';
import rawLuzon from './straits/luzon.json';
import rawMagellan from './straits/magellan.json';
import rawMakassar from './straits/makassar.json';
import rawMalacca from './straits/malacca.json';
import rawMessina from './straits/messina.json';
import rawMozambique from './straits/mozambique.json';
import rawNares from './straits/nares.json';
import rawNorthumberland from './straits/northumberland.json';
import rawOresund from './straits/oresund.json';
import rawOtranto from './straits/otranto.json';
import rawPalk from './straits/palk.json';
import rawSingapore from './straits/singapore.json';
import rawSkagerrak from './straits/skagerrak.json';
import rawSolent from './straits/solent.json';
import rawSunda from './straits/sunda.json';
import rawTaiwan from './straits/taiwan.json';
import rawTorres from './straits/torres.json';
import rawTsugaru from './straits/tsugaru.json';
import rawVilkitsky from './straits/vilkitsky.json';

/**
 * Every strait document ships with the package and is imported statically so
 * the loader works under any bundler and in Node without filesystem access.
 * Adding a strait means adding its JSON file, an index.json entry, and one
 * import here.
 */
const RAW_STRAIT_DOCUMENTS: readonly unknown[] = [
  rawBabElMandeb,
  rawBass,
  rawBelleisle,
  rawBering,
  rawBonifacio,
  rawBosporus,
  rawCook,
  rawDardanelles,
  rawDavis,
  rawDenmark,
  rawDover,
  rawFlorida,
  rawGeorgia,
  rawGibraltar,
  rawHormuz,
  rawHudson,
  rawJuandefuca,
  rawKarimata,
  rawKattegat,
  rawKerch,
  rawKorea,
  rawLaperouse,
  rawLombok,
  rawLuzon,
  rawMagellan,
  rawMakassar,
  rawMalacca,
  rawMessina,
  rawMozambique,
  rawNares,
  rawNorthumberland,
  rawOresund,
  rawOtranto,
  rawPalk,
  rawSingapore,
  rawSkagerrak,
  rawSolent,
  rawSunda,
  rawTaiwan,
  rawTorres,
  rawTsugaru,
  rawVilkitsky,
];

interface LoadedData {
  index: StraitsIndex;
  byId: ReadonlyMap<string, Strait>;
  all: readonly Strait[];
}

let cache: LoadedData | null = null;

/**
 * Validates the index and every strait document with Zod (once, memoized) and
 * cross-checks that the index and the documents agree. Throws on any invalid
 * or inconsistent data — a broken dataset should fail loudly, not render.
 */
function load(): LoadedData {
  if (cache) return cache;

  const index = StraitsIndexSchema.parse(rawIndex);

  const byId = new Map<string, Strait>();
  for (const raw of RAW_STRAIT_DOCUMENTS) {
    const strait = StraitSchema.parse(raw);
    if (byId.has(strait.id)) {
      throw new Error(`Duplicate strait document for id "${strait.id}"`);
    }
    byId.set(strait.id, strait);
  }

  if (index.length !== byId.size) {
    throw new Error(
      `Index lists ${String(index.length)} straits but ${String(byId.size)} documents exist`,
    );
  }

  // The index defines the canonical ordering of the atlas.
  const all = index.map((entry) => {
    const strait = byId.get(entry.id);
    if (!strait) {
      throw new Error(`Index entry "${entry.id}" has no strait document`);
    }
    return strait;
  });

  cache = { index, byId, all };
  return cache;
}

/** The lightweight index of all straits, in canonical order. */
export function loadStraitsIndex(): StraitsIndex {
  return load().index;
}

/** One full strait document by id. Throws for unknown ids. */
export function loadStrait(id: string): Strait {
  const strait = load().byId.get(id);
  if (!strait) {
    throw new Error(`Unknown strait id "${id}"`);
  }
  return strait;
}

/** All full strait documents, in canonical (index) order. */
export function loadAllStraits(): readonly Strait[] {
  return load().all;
}
