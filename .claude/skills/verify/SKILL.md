---
name: verify
description: Build, run, and visually verify the Fathom web app against the legacy prototype
---

# Verifying Fathom

## Build and serve

```bash
pnpm build                                      # tsc -b + vite build per package
cd apps/web && pnpm preview --port 4173 &       # serves the production build
# dev server alternative: pnpm dev (port 5173)
```

## Drive the UI

No Playwright in the repo. System Chrome + `puppeteer-core` (no browser download)
works well from a scratch directory:

```js
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
```

Wait ~1.5s after `networkidle2` for map tiles to settle before screenshots.

## Parity baseline

`legacy/fathom.html` (open via `file://`) is the Milestone 1 source of truth — drive
the same flows on both pages and compare. Flows worth driving: initial render, search
("turkey" → 2 results), Escape-to-clear, region chip (Europe → 12), theme swatch
(parchment → light tiles), card click (fly-to + popup after ~750ms), empty state
("atlantis"), clear button (refocuses input), reset view.

Pixel-diff pairs with `pngjs` (ImageMagick is not installed on this machine).
Expected noise: <0.05% of pixels from monospace glyph anti-aliasing; anything
structural shows up far larger.

## Gotchas

- `legacy/fathom.html` must never be modified — it is in `.prettierignore`; keep it out
  of any formatting or lint sweep.
- The app 404s `/favicon.ico` (the prototype has no favicon either) — expected console
  error, not a defect.
- Map tiles and Google Fonts need network access.
