# @fathom/pipeline

The data ingestion pipeline: imports maritime entities from authoritative
public datasets into Fathom's JSON structure, so the atlas grows from real
data instead of manually authored files.

## Stages

1. **Import** — provider adapters fetch raw records
2. **Normalize** — canonical names, slugs, cross-provider merging
3. **Validate** — record-level checks (names, slugs)
4. **Enrich** — optional enrichers fill gaps (Wikipedia summaries, cited)
5. **Resolve relationships** — countries, connected waters, region assignment
6. **Generate entity JSON** — exact Fathom schema shape, Zod-validated
7. **Generate indexes** — index entries for per-file collections
8. **Generate search index** — search documents over existing + staged content
9. **Report** — counts, issues, duplicates, and broken references

Every staged document is marked `status: "draft"` and carries the sources
it came from. Nothing enters `packages/data` without a reviewed `apply`.

## Adapters

| Adapter         | Provides                               | Notes                                           |
| --------------- | -------------------------------------- | ----------------------------------------------- |
| `wikidata`      | straits, canals, islands, ports, seas  | SPARQL; CC0                                     |
| `wikipedia`     | curated title lists + summary enricher | REST API; CC BY-SA, cited per article           |
| `osm`           | straits                                | Overpass API; ODbL                              |
| `natural-earth` | straits, water bodies                  | GeoJSON via `NATURAL_EARTH_FILE`; public domain |
| `geonames`      | straits, islands, ports, canals        | needs `GEONAMES_USERNAME`; CC BY                |

Adding a source means implementing one `ProviderAdapter` — the core
pipeline has no provider-specific logic.

## Usage

```sh
# Stage an import (writes to packages/pipeline/out/, never to the app)
pnpm --filter @fathom/pipeline import -- --adapters wikidata --types strait --limit 25

# Review out/report.json, prune out/staged.json if needed, then:
pnpm --filter @fathom/pipeline apply

# Afterwards
pnpm format && pnpm test
```

The validation report covers duplicates (in-batch and against the atlas),
missing coordinates, summaries, and sources (rejected with reasons),
unresolved relationships (warnings), invalid slugs, and broken references
across existing + staged content via the data package's integrity checker.

## Review findings that shape usage

- **Import waters before straits.** A strait's `connects` names become
  water-body references; staging straits whose waters are uncharted leaves
  broken references in the report until the waters are imported.
- **Slug dedup misses name variants** ("Strait of Kerch" vs the charted
  `kerch`). Review the staged list against the atlas before applying;
  coordinate-proximity duplicate detection is a planned improvement.
- **Coarse region assignment is reviewable by design** — every assignment
  carries a warning, and Arctic-adjacent Russian straits are the known
  weak spot of the current boxes.
