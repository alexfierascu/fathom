# Contributing

Fathom is an open atlas: contributions of data, corrections, code, and translations are all
welcome. This guide covers how to get set up and what we expect of a change.

## Prerequisites

- **Node.js 24** and **pnpm 11** (`corepack enable` activates the pinned version)
- A modern browser for verifying map behavior

## Getting started

```bash
git clone <repository-url> fathom
cd fathom
pnpm install
pnpm dev        # http://localhost:5173
```

The workspace is a pnpm monorepo:

| Package             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `apps/web`          | The atlas web app (Vite + React)                   |
| `packages/data`     | Entity documents, schemas, loaders, and the engine |
| `packages/search`   | The search engine                                  |
| `packages/pipeline` | The data-ingestion pipeline and its adapters       |

## Development workflow

1. Branch from `main` (`feature/…` or `fix/…`).
2. Make the change, with tests where behavior changes.
3. Run the quality gates (below) before opening a pull request.

## Contributing data

Fathom's cardinal rule: **do not invent facts.** Every factual claim must trace to an
authoritative source.

- Entity documents live in `packages/data/src/` — one JSON file per strait, water body, and
  country; array files for maritime structures and knowledge records.
- Every document that asserts facts carries `sourceIds` pointing at records in
  `knowledge/sources.json`. Add the source first, then cite it.
- Zod schemas in `packages/data/src/schema/` are the codified form of
  [DATA_MODEL.md](./DATA_MODEL.md); `pnpm test` validates every document against them.
- Bulk imports go through the pipeline (`packages/pipeline`), which writes documents with
  `"status": "draft"`. Review drafts with `pnpm --filter @fathom/pipeline exec tsx src/cli.ts review`
  and publish them with `… promote` once verified.
- Images need a license, a credit, and a source record — see `knowledge/images.json`.

Spotted an error? Open a data correction issue with the correct value and an authoritative
source — the template asks for both.

## Quality gates

All five must pass; CI runs the same set.

```bash
pnpm format:check   # Prettier
pnpm lint           # ESLint (type-aware)
pnpm typecheck      # tsc -b across the workspace
pnpm test           # Vitest across the workspace
pnpm build          # production build + sitemap + static API
```

`pnpm format` fixes formatting in place.

## Commit conventions

- Small, logical commits; each should leave the tree green.
- Imperative subject line ("Add Kerch Strait crossing"), body explaining _why_ when it isn't
  obvious.
- Never modify `legacy/fathom.html` — it is the preserved historical prototype.

## Pull requests

- Describe what changed and how you verified it (for data: which sources).
- Keep unrelated changes out; open a second PR instead.
- New UI chrome strings go through the i18n dictionary
  (`apps/web/src/features/i18n/strings.ts`) with entries for every locale.
