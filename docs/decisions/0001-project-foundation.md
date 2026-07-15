# ADR 0001: Project foundation

- **Status:** accepted
- **Date:** 2026-07-15

## Context

Fathom is being built from scratch and needs a foundation that can grow into a production
application: multiple deployables, shared libraries, strict quality gates, and CI from the
first commit.

## Decisions

- **pnpm workspace monorepo** with `apps/*` (deployables) and `packages/*` (shared
  libraries), rather than a single-package repo. This costs little now and avoids a
  disruptive restructure the moment a second app or shared library appears.
- **Vite + React + TypeScript** for the web app (`@fathom/web`).
- **Strict TypeScript everywhere** via a shared `tsconfig.base.json`
  (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`). TypeScript is pinned to
  6.0.x — TypeScript 7 (the native compiler) is not yet supported by `typescript-eslint`
  (supported range `<6.1.0`). Revisit when support lands.
- **ESLint 10 flat config with type-aware linting** at the root, one config for the whole
  workspace. Formatting is delegated entirely to **Prettier**
  (`eslint-config-prettier` applied last).
- **Vitest** configured inside each app's `vite.config.ts` so tests run through the same
  pipeline as the build; `jsdom` + Testing Library for the web app.
- **Single CI workflow** (GitHub Actions) running lint → format check → typecheck →
  test → build on pushes to `main` and all pull requests, with the Node version taken
  from `.nvmrc` and pnpm from the `packageManager` field.
- **Tool versions pinned at the root**: one TypeScript, ESLint, and Prettier version for
  the whole workspace to prevent drift between packages.

## Consequences

- New packages get the full toolchain by adding three scripts and extending the base
  tsconfig — no per-package tool configuration.
- Type-aware lint rules make linting slower than syntax-only rules; acceptable at this
  size, revisit (e.g. per-package lint sharding) if it becomes a bottleneck.
- Until TypeScript 7 is supported by the lint toolchain, the workspace stays on 6.0.x.
