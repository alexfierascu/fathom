# @fathom/data

Shared domain data and types for Fathom.

## Layout

- `src/straits/` — the straits dataset: one JSON document per strait, plus
  `index.json` holding lightweight metadata (id, name, region, countries,
  coordinates) for every strait in canonical order.
- `src/schema.ts` — Zod schemas describing the documents; the TypeScript types
  are inferred from them.
- `src/loader.ts` — validated access to the dataset.

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
