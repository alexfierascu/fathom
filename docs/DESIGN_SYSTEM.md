# Design system

The visual language ported from the original prototype and grown with the product. The
authoritative implementation is `apps/web/src/styles/global.css`; this document explains the
intent behind it.

## Design principles

- **The chart is the hero.** Interface chrome stays dark, quiet, and monospaced-labeled so the
  map and the content carry the color.
- **Nautical, not nautical-kitsch.** The mood comes from depth (dark blues), instrument
  accents (teal, signal orange), and typographic discipline — never from clip-art.
- **Everything themed.** No component hard-codes a color; every surface reads from the theme
  custom properties so all four themes work by construction.
- **Selection over decoration.** Editorial features (chokepoints, tours, facts) curate real
  data; the design never dresses up an invented claim.

## Design tokens

Tokens are CSS custom properties on `:root`, overridden per theme via
`html[data-theme='…']`. Four themes ship: **abyss** (default), **parchment**, **midnight**,
and **daylight**.

### Color

| Token               | Role                                          | Abyss value              |
| ------------------- | --------------------------------------------- | ------------------------ |
| `--bg`              | Page background                               | `#0a1b2a`                |
| `--panel`           | Cards, headers, panels                        | `#122a3d`                |
| `--panel-2`         | Nested surfaces, hovers, inputs               | `#16324a`                |
| `--text`            | Primary text                                  | `#eaf2f5`                |
| `--text-muted`      | Secondary text, labels, eyebrows              | `#7c93a3`                |
| `--accent`          | Signal color (alerts, wrong answers, hovers)  | `#ff6b35`                |
| `--accent-2`        | Instrument color (links, active states, pins) | `#2fb8a6`                |
| `--border`          | Hairline borders                              | `rgba(234,242,245,0.08)` |
| `--accent-contrast` | Text on accent fills                          | `#0a1b2a`                |
| `--pin-ring`        | Map pin outline                               | `#eaf2f5`                |

### Typography

| Face              | Usage                                                       |
| ----------------- | ----------------------------------------------------------- |
| **Space Grotesk** | Display: wordmark, page titles, card headings               |
| **Inter**         | Body text                                                   |
| **IBM Plex Mono** | Instrument text: eyebrows, labels, coordinates, nav, badges |

Mono labels are uppercase with wide letter-spacing (`0.08–0.14em`) at small sizes
(`0.62–0.75rem`) — they read as chart annotations, not headings.

### Spacing and layout

- Content column: `max-width: 1200px` (`.wrap`).
- Card and section gaps step through 10 / 14 / 18 px; detail sections separate by 36 px.
- Grids are `auto-fit, minmax(…, 1fr)` so every layout is responsive without breakpoints;
  the single global breakpoint is `640px` for mobile adjustments.

### Elevation, radius, motion

- One radius token: `--radius: 8px` (pills and tiny controls derive from it).
- Elevation is used sparingly: cards lift 2 px with a soft shadow on hover only.
- Transitions are 150 ms ease on color/border/background; movement respects
  `prefers-reduced-motion`.

## Layout templates

Every screen is built from one of five templates — new pages pick one instead of
inventing a layout. All of them draw from the same tokens in `global.css`
(`--rail-col`, `--gap`, `--section-gap`, `--card-min`, `--tile-min`, `--fact-min`),
so proportions and rhythm match across the product.

| Template             | Structure                                                                                                          | Used by                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Hero + Split**     | Full-width hero, then `.chart-split`: story column + sticky `.chart-rail` holding the map and quick facts          | Straits, seas, countries, regions, ports, canals, crossings, islands |
| **Voyage cockpit**   | `.voyage`: viewport-fit story card (pinned actions, dot rail) + sticky chart. Same column geometry as Hero + Split | Journey Mode                                                         |
| **Index grid**       | Hero-lite header + card grids on `--card-min` / `--tile-min`                                                       | Journeys, Explore, Learn, tags, collections                          |
| **Fullscreen chart** | The map at near-viewport height, minimal chrome                                                                    | /map                                                                 |
| **Focus panel**      | One centered panel, `max-width: 640px`                                                                             | Quiz, search layer                                                   |

Rules: the rail is always `clamp(340px, 38%, 470px)` and always collapses to a
single column at 1020px; panel gaps are always `--gap`; sections breathe by
`--section-gap`. Deviations need a UX reason, not a whim.

## Components

The recurring vocabulary (all in `global.css`):

- **`.card`** — linkable summary tile: eyebrow, title, pills, note, coordinates.
- **`.pill`** — small bordered chip for entities; variants `--tag` (teal) and `--action`
  (dashed).
- **`.fact`** — label/value tile used in Quick Facts and Explore grids.
- **`.eyebrow`** — mono, uppercase, muted section label.
- **`.strait-hero`** — article header panel with a radial teal glow.
- **`.detail-section`** — labeled content block on detail pages.
- **`.timeline` / `.timeline-event`** — year-gutter chronology, `--compact` on articles.
- **Map chrome** — `.map-ctl-btn`, `.map-coords`, cluster and pin markers; all themed.

## Accessibility

- Every interactive element is a real `<a>` or `<button>` with a visible focus state.
- A skip link precedes the header; navigation moves focus to the `main` landmark.
- The lightbox traps focus and closes on Escape; controls carry `aria-label`s.
- Color is never the only signal (quiz answers pair color with disabled state and position).
- Reduced motion disables the card hover lift and smooth scrolling.
