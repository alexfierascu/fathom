# Architecture

This document describes the repository layout, the conventions that keep it scalable, and
how to extend it. For the rationale behind individual tooling choices, see the records in
[docs/decisions](decisions/).

## Workspace layout

The repository is a pnpm workspace with two package roots:

- **`apps/*`** — deployable applications. Each app owns its build output and deployment
  concerns. `apps/web` (`@fathom/web`) is the Vite + React front end.
- **`packages/*`** — shared libraries consumed by apps and by other packages (for example
  a design system, API client, or shared domain types). Currently empty; the directory is
  reserved so shared code has an obvious home from day one.

All workspace packages are named under the `@fathom/` scope and marked `private`.

## Tooling: configured once, at the root

Cross-cutting tools live at the workspace root so every package shares one version and one
configuration:

- **TypeScript** — `tsconfig.base.json` holds the strict compiler settings
  (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, …). Packages extend it and
  add only environment specifics (DOM lib, JSX, includes). `apps/web` uses TypeScript
  project references to typecheck app code (`tsconfig.app.json`) and Node-context config
  files (`tsconfig.node.json`) separately.
- **ESLint** — a single flat config (`eslint.config.js`) with type-aware rules
  (`typescript-eslint` recommended + stylistic type-checked presets) plus the React Hooks
  and React Fast Refresh plugins. `eslint-config-prettier` is applied last so formatting
  is owned exclusively by Prettier.
- **Prettier** — `prettier.config.js` is the only formatting authority. ESLint does not
  enforce formatting rules.
- **Vitest** — configured per app (in `vite.config.ts`) so tests share the app's Vite
  pipeline. The web app runs in a `jsdom` environment with Testing Library and
  `jest-dom` matchers (`src/test/setup.ts`).

Root `package.json` scripts fan out to packages with `pnpm --recursive` or
`pnpm --filter`, so the root is the single entry point for every task locally and in CI.

## Application source conventions (`apps/web/src`)

The source tree is intentionally minimal right now: `main.tsx` bootstraps React into
`#root` and nothing else. As features land, organize code by feature rather than by
technical kind (avoid top-level `components/`, `hooks/`, `utils/` dumping grounds):

```
src/
├── app/        # App shell: providers, router, global error boundaries
├── features/   # One folder per product feature (components, hooks, state, tests)
├── shared/     # Genuinely cross-feature UI and utilities
└── test/       # Test setup and shared test helpers
```

Rules of thumb:

- A feature folder may import from `shared/` and its own files, never from another
  feature's internals.
- Code used by two or more features moves to `shared/`; code used by two or more apps
  moves to a `packages/*` library.
- Tests live next to the code they cover (`*.test.ts(x)`), sharing setup from `src/test/`.

## Adding a new workspace package

1. Create `packages/<name>/` with a `package.json` named `@fathom/<name>`
   (`"private": true`).
2. Add a `tsconfig.json` extending `../../tsconfig.base.json`.
3. Add `typecheck`, `test`, and (if it builds) `build` scripts — the root
   `--recursive` scripts pick them up automatically; no CI changes needed.
4. Depend on it from an app with `"@fathom/<name>": "workspace:*"`.

## Quality gates

CI (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request:

1. `pnpm install --frozen-lockfile` — dependencies must match the lockfile
2. `pnpm lint` — ESLint, type-aware
3. `pnpm format:check` — Prettier
4. `pnpm typecheck` — `tsc -b` in every package
5. `pnpm test` — Vitest in every package
6. `pnpm build` — production build must succeed

Run the same sequence locally before pushing; all six commands work from the root.
