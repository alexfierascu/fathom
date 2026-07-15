# @fathom/data

Shared domain data and types for Fathom.

## Layout

- `src/` — TypeScript source: types, loaders, and validated access to the datasets.
  The package entry point is `src/index.ts`.
- `straits/` — raw datasets (currently empty).

## Usage

This is an internal workspace package consumed as TypeScript source (no build step —
the app's bundler compiles it). Depend on it with:

```json
"@fathom/data": "workspace:*"
```

```ts
import { ... } from '@fathom/data';
```
