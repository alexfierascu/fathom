# Fathom

Fathom is a web application built as a pnpm workspace monorepo. This repository currently
contains the project foundation only — tooling, structure, and CI — with no application
features yet.

## Tech stack

- **pnpm workspaces** — monorepo package management
- **Vite** — build tool and dev server
- **React 19** + **TypeScript** — application framework and language
- **ESLint** (type-aware, flat config) + **Prettier** — linting and formatting
- **Vitest** + Testing Library — unit and component testing
- **GitHub Actions** — continuous integration

## Prerequisites

- Node.js ≥ 22.12 (see `.nvmrc` — currently Node 24)
- pnpm 11 (pinned via the `packageManager` field; enable with `corepack enable`)

## Getting started

```sh
pnpm install
pnpm dev
```

## Scripts

All scripts run from the repository root.

| Script              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Start the web app dev server                    |
| `pnpm build`        | Typecheck and build all packages for production |
| `pnpm preview`      | Preview the production build locally            |
| `pnpm lint`         | Lint the whole repository                       |
| `pnpm lint:fix`     | Lint and auto-fix                               |
| `pnpm format`       | Format the whole repository with Prettier       |
| `pnpm format:check` | Verify formatting (used in CI)                  |
| `pnpm typecheck`    | Typecheck all packages                          |
| `pnpm test`         | Run all test suites once                        |
| `pnpm test:watch`   | Run tests in watch mode                         |

## Repository structure

```
fathom/
├── apps/
│   └── web/              # Vite + React application (@fathom/web)
│       ├── public/       # Static assets served as-is
│       └── src/          # Application source
├── packages/             # Shared libraries (empty for now)
├── docs/                 # Architecture docs and decision records
├── .github/workflows/    # CI pipeline
├── eslint.config.js      # Shared ESLint flat config
├── prettier.config.js    # Shared Prettier config
├── tsconfig.base.json    # Shared strict TypeScript settings
└── pnpm-workspace.yaml   # Workspace package globs
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the reasoning behind this layout and
the conventions to follow when adding code.

## Continuous integration

Every push to `main` and every pull request runs the full quality gate in GitHub Actions:
install → lint → format check → typecheck → test → build. See
[.github/workflows/ci.yml](.github/workflows/ci.yml).
