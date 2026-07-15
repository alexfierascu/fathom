# @fathom/data

Shared domain data and types for Fathom.

## Layout

- `src/straits/` — the straits dataset: one JSON document per strait, plus
  `index.json` holding lightweight metadata (id, name, region, countries,
  coordinates) for every strait in canonical order.
- `src/knowledge/` — knowledge-layer collections (sources, images, historical
  events, wildlife, statistics, tags). Empty until real, sourced data arrives.
- `src/schema/` — Zod schemas, the code form of `docs/DATA_MODEL.md`: the
  shared entity foundation (`common.ts`), the knowledge entities
  (`knowledge.ts`), and the strait document (`strait.ts`). TypeScript types
  are inferred from the schemas.
- `src/loader.ts` — validated access to the straits dataset.
- `src/entities.ts` — validated loaders for the knowledge collections.
- `src/resolve.ts` — relationship resolution (`resolveRef`) and attachment
  lookups (`loadSourcesFor`, `loadImagesFor`, `loadStatisticsFor`).
- `src/validate.ts` — `validateEntity`, non-throwing validation with readable
  issues.
- `src/derived.ts` — Country, Water Body, and Region registries derived from
  the strait documents (countries arrays, region fields, and "A ↔ B"
  connects values); nothing is stored twice.
- `src/engine.ts` — the relationship engine: `getEntity(id)` for canonical
  ids (`strait:gibraltar`, `country:spain`), strongly typed
  `getRelated(entity, relationship)` single-hop traversal, and the
  `getChildren`/`getParents` containment hierarchy. Because every lookup is
  one hop, circular references can never loop the engine.
- `src/integrity.ts` — `findBrokenReferences()`, a flat (cycle-safe) scan of
  every reference in the dataset, distinguishing unknown ids from types that
  have no collection yet.

The strait document keeps its prototype core (required) and adds the
canonical expansion from `docs/DATA_MODEL.md` as optional fields — names,
summary, relationships, sourced dimensions, and knowledge attachments — so
existing documents remain valid while the model grows. Measurements and
knowledge entities require sources by schema; nothing unsourced can enter
the dataset.

## Usage

```ts
import { loadAllStraits, loadStrait, loadStraitsIndex } from '@fathom/data';

const index = loadStraitsIndex(); // lightweight entries, canonical order
const all = loadAllStraits(); // full documents, canonical order
const hormuz = loadStrait('hormuz'); // one document; throws on unknown ids
```

Every JSON file is validated with Zod on first load (memoized), and the loader
cross-checks that the index and the documents agree — invalid data fails loudly
at load time rather than rendering wrong.

## Adding a strait

1. Create `src/straits/<id>.json` matching `StraitSchema`.
2. Append an entry to `src/straits/index.json` (position defines its place in
   the canonical order).
3. Add the corresponding import to `src/loader.ts`.
4. `pnpm --filter @fathom/data test` verifies schema validity and
   index/document consistency.

This is an internal workspace package consumed as TypeScript source (no build
step — the app's bundler compiles it). Depend on it with
`"@fathom/data": "workspace:*"`.
