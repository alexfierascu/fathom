# Fathom Design System — V2

**Status:** Draft specification · 2026-07-18 · supersedes `docs/DESIGN_SYSTEM.md` (V1, now stale).
**Purpose:** the single source of truth for Fathom's visual and interaction language going forward. Every new component and every fix from `UX_AUDIT.md` must consume the tokens and follow the rules defined here. Where V1 described _intent_, V2 defines _contracts_.
**Authoritative implementation:** `apps/web/src/styles/global.css` (`:root` + `html[data-theme]`). This document defines what belongs there; it is not itself loaded at runtime.

> V2's job is to turn Fathom's _design language_ (consistent by taste) into a _design system_ (consistent by construction). The audit found only one radius token, no spacing/motion/elevation scale, and two of three fonts hardcoded. V2 fixes that at the root.

---

## 1. First principles

1. **The strait is the main character.** Every screen either _is_ about a strait (Documentary) or exists to _explain_ a strait (Context). Nothing else earns a documentary.
2. **A museum, not a website.** Calm, cinematic, minimal, editorial. Users move between rooms; they do not scroll walls.
3. **Themed by construction.** No component hardcodes a color, radius, duration, or shadow. All read tokens, so all four themes and all accessibility modes work automatically.
4. **Motion is continuity.** Everything glides; nothing bounces; nothing is playful. Motion communicates that you moved _within one place_, not to a new site.
5. **Selection over decoration.** Curate real, sourced data. Never dress up an invented claim (no fake metrics, no dead controls).
6. **Glass over dark water.** Depth (deep navy), instrument accents (gold forward, teal fleet), typographic discipline. Never nautical kitsch, never emoji.

---

## 2. Tokens

All tokens live on `:root` and are overridden per theme. **Existing tokens are kept; V2 adds the missing scales.** Additions are non-breaking.

### 2.1 Color (kept — this is the live palette; V1's table is wrong)

| Token               | Role                                                             | Abyss (default)         |
| ------------------- | ---------------------------------------------------------------- | ----------------------- |
| `--bg`              | Page background                                                  | `#071e3d`               |
| `--panel`           | Cards, panels                                                    | `#0d2b4e`               |
| `--panel-2`         | Nested surfaces, inputs, hovers                                  | `#123560`               |
| `--text`            | Primary text                                                     | `#f5f1e8`               |
| `--text-muted`      | Secondary text, labels                                           | `rgba(245,241,232,0.6)` |
| `--accent`          | Coral signal (alerts, danger, wrong)                             | `#e0654f`               |
| `--accent-2`        | **Gold — the way forward** (primary action, links, pins, active) | `#e7b75f`               |
| `--teal`            | The fleet (secondary highlight, routes)                          | `#2faea0`               |
| `--ok`              | Success                                                          | `#3fbf87`               |
| `--bad`             | Error                                                            | `#e05252`               |
| `--border`          | Hairline                                                         | `rgba(245,241,232,0.1)` |
| `--accent-contrast` | Text on gold fills                                               | `#14243d`               |
| `--pin-ring`        | Map pin outline                                                  | `#041427`               |

Themes: **abyss** (default), **parchment** (light), **midnight**, **daylight**. Each redefines the block above; components never branch on theme.

### 2.2 Semantic surfaces (new — stop hand-mixing)

Standardize the three tint strengths the code currently improvises (observed: 8/10/12/14/24/26/40/45/55%).

```
--surface-glass: color-mix(in srgb, var(--bg) 82%, transparent);   /* nav, cabin, overlays */
--surface-1:     var(--panel);
--surface-2:     var(--panel-2);
--hairline:      var(--border);

--tint-gold-weak:   color-mix(in srgb, var(--accent-2) 10%, transparent);
--tint-gold-med:    color-mix(in srgb, var(--accent-2) 24%, transparent);
--tint-gold-strong: color-mix(in srgb, var(--accent-2) 45%, transparent);
--tint-teal-weak:   color-mix(in srgb, var(--teal) 12%, transparent);
```

Rule: components use these three strengths only. No new arbitrary `color-mix` percentages.

### 2.3 Spacing (new — 4px base)

```
--s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px; --s-5: 20px;
--s-6: 24px; --s-8: 32px; --s-10: 40px; --s-12: 48px; --s-16: 64px; --s-20: 80px;
--section-gap: clamp(40px, 7vh, 80px);   /* between page sections */
--wrap: 1180px;                          /* the shared content column */
```

Deprecate `--gap: 18px` (off-grid) → migrate call sites to `--s-4`/`--s-5`. Rule: no raw px spacing in new code; use the scale.

### 2.4 Radius (new — replaces the lone `--radius: 8px`)

```
--r-xs: 6px;    /* chips, dots, small controls */
--r-sm: 10px;   /* buttons, inputs, small cards */
--r-md: 14px;   /* cards, media tiles, journey cards */
--r-lg: 18px;   /* panels, drawers, large surfaces */
--r-xl: 22px;   /* hero-scale containers */
--r-pill: 999px;
```

`--radius` remains as a legacy alias (= `--r-sm`) until call sites migrate. Rule: pick a step; never a raw px radius.

### 2.5 Typography (new — tokenize all three families)

```
--font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; /* titles, editorial */
--font-sans:    'Inter', system-ui, sans-serif;                                    /* body */
--font-mono:    'IBM Plex Mono', monospace;                                        /* labels, eyebrows, metrics — replaces 89 literals */
--font-wordmark:'Space Grotesk', sans-serif;                                       /* FATHOM wordmark, nav, panel titles */
```

**Type scale (named, clamp-based):**

| Token / class | Font    | Size                               | Use                           |
| ------------- | ------- | ---------------------------------- | ----------------------------- |
| `display-1`   | display | `clamp(2.4rem, 6vw, 4.6rem)`       | Hero titles                   |
| `display-2`   | display | `clamp(1.8rem, 4vw, 2.9rem)`       | Section/editorial titles      |
| `title`       | display | `clamp(1.3rem, 3vw, 1.6rem)`       | Card/panel titles             |
| `body`        | sans    | `1rem / 1.7`                       | Prose                         |
| `body-lg`     | sans    | `clamp(1rem, 1.4vw, 1.16rem)`      | Ledes, subtitles              |
| `label`       | mono    | `0.6rem`, `0.14–0.22em`, uppercase | Eyebrows, geo-labels, metrics |

Mono labels are always uppercase, wide-tracked, small — they read as chart annotations, never headings.

### 2.6 Elevation (new)

```
--elev-1: 0 8px 24px -16px rgba(0,0,0,0.5);    /* hover cards */
--elev-2: 0 20px 44px -22px rgba(0,0,0,0.6);   /* raised panels, journey cards */
--elev-3: 0 30px 74px -28px rgba(0,0,0,0.72);  /* drawers, overlays */
```

Rule: three elevations only. No bespoke `box-shadow`.

### 2.7 Glass / blur (new)

```
--blur-1: 8px;   /* subtle (backdrops) */
--blur-2: 16px;  /* controls, chips-on-media */
--blur-3: 26px;  /* nav, cabin, search overlay */
```

`.glass` utility: `background: var(--surface-glass); backdrop-filter: blur(var(--blur-3)) saturate(1.15); border: 1px solid var(--hairline);`. Nav, cabin, and search consume it instead of redefining `backdrop-filter` each time.

### 2.8 Motion (new — the pivot's "everything glides")

```
--dur-fast:  150ms;  /* hovers, small state */
--dur-base:  250ms;  /* the default — buttons, cards, disclosure */
--dur-slow:  350ms;  /* drawers, overlays, panel expand */
--dur-enter: 500ms;  /* first-reveal / staggered entrances */

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);    /* the default ease-in-out */
--ease-enter:    cubic-bezier(0.22, 0.61, 0.36, 1); /* entrances (the app's existing curve) */
--ease-exit:     cubic-bezier(0.4, 0, 1, 1);       /* dismissals */

--lift: -2px;    /* standard hover translateY */
--nudge: 3px;    /* standard arrow translateX on hover */
```

Rules: interaction transitions use `--dur-base --ease-standard`; entrances use `--dur-enter --ease-enter`; dismissals use `--dur-slow --ease-exit`. Reduced-motion (media query **or** the manual toggle) stills all of the above. No raw durations/easings in new code.

### 2.9 Z-index (new — name the stack)

```
--z-base: 1; --z-nav: 40; --z-scrim: 150; --z-drawer: 151; --z-search: 200; --z-toast: 300;
```

---

## 3. Components

Each entry: **anatomy → variants → tokens → rules.** Consolidations replace the idioms named in the audit (§8).

### 3.1 Button (replaces `uc-btn`, `journey-btn`, `cabin-btn`, `nav-random`, `link-button`)

- **Variants:** `primary` (gold fill, `--accent-contrast` text), `ghost` (hairline, muted→text on hover), `quiet` (text-only, gold), `danger` (coral, hover only). **Sizes:** `sm`, `md`.
- **Tokens:** radius `--r-sm`; padding from spacing scale; transition `--dur-base --ease-standard`; hover `translateY(var(--lift))`.
- **Rules:** exactly one `primary` per view. Gold is for _actions_; when gold is also a nearby label color, use `ghost` to keep the CTA distinct.

### 3.2 Card (three archetypes replace 13 idioms)

- **MediaTile** (rail, journey, explore, `cr-card`): image or gradient fallback, bottom-anchored text, `--r-md`, hover `--lift` + `--elev-1` + image scale. One component, `aspect` + `size` props.
- **StatRow** (`cabin-metric`, `rank`, `coverage`, `panel-meta`): label (mono) + value (display), hairline divider. `Stat` primitive.
- **Badge** (`stamp`, `trophy-card`, `cabin-medal`): icon/medal + name + state (earned/locked).
- **Rules:** no new card class. Compose from these three. Cards never carry their own shadow except the tokenized hover elevation.

### 3.3 Chip (replaces `pill`, `cr-chip`, `chip`, `cabin-chip`, `rail-tag`)

- One `Chip`: `--r-pill`, hairline, hover gold tint. Variants: `default`, `active` (gold), `action`.

### 3.4 Hero

- **PageHero** stays the standard. Two modes: `--image` (full-bleed, `100svh`, scrim) and ambient (`clamp(400px,58vh,600px)`, radial gradient). Anatomy: eyebrow (label) → `display-1` title → `body-lg` subtitle → pills → children → ≤2 actions. The homepage and 404 keep bespoke heroes (they are singular by design).

### 3.5 Rail (DiscoveryRail)

- Horizontal scroll of MediaTiles under a `label` eyebrow + `display-2` title. **Promote its use** beyond Explore (related straits, journey stops filmstrip).

### 3.6 Drawer (Captain's Cabin pattern)

- Right-anchored, `.glass`, `--elev-3`, slide `--dur-slow`. Portaled past any `backdrop-filter` ancestor. Focus-trapped; Escape steps back (nested panel first). Secondary panels push from the right (Apple nav).

### 3.7 Dialog / Overlay (Chart Room search pattern)

- Full-screen scrim (`--z-scrim`) + content (`--z-search`), `.glass`, Escape + outside-click + close button, `aria-modal`, focus trapped.

### 3.8 Form

- Field = mono label + input (`--r-sm`, `--surface-2`, hairline, gold focus border). Native controls are restyled, not raw. Replace Compare's bare `<select>`s with a styled control.

### 3.9 Search (command palette)

- Input (combobox) + result MediaTiles as `role="option"` with `aria-activedescendant`; discover state (recent, suggested straits, continue journey, lenses). **Strait-first:** straits ranked and visually weighted above supporting types; browse verbs = Explore's lenses.

### 3.10 Map (`Map` wrapper)

- One wrapper over Leaflet with a `chrome` prop (`minimal` | `full`) and glass-styled controls (zoom, layers, plot, drift). Layer system: satellite / chart / bathymetry (real); historical / AIS / currents / weather scaffolded as labeled "coming soon."

### 3.11 EmptyState & Skeleton (new)

- **EmptyState:** one component at 404 quality (icon + line + recovery action) for every `.empty` site and the search no-match.
- **Skeleton / RouteFallback:** shimmer placeholders for lazy routes and map tiles. Currently absent everywhere.

### 3.12 Icon (new)

- One line-icon set (SVG). Retire Unicode entity glyphs (`↔ ≈ ⚑ ◈ ⚓ ⌇`) and emoji-adjacent symbols (`⚄ ⛓`) from UI and copy.

---

## 4. Page templates

Enforced layouts. A screen must declare which template it is.

- **Documentary (straits only):** `PageHero(--image)` → chaptered body (Story · Map · Key facts · Timeline · Facts · Media · Strategic importance · Compare · Quiz) via a sticky section rail or tabs → Related straits (Rail) → Continue. Long content is _chaptered_, not scrolled.
- **Context (all supporting entities):** compact ambient `PageHero` (shorter) → **one screen**: a brief context paragraph + the **straits it touches** as the hero content (Rail or grid) + minimal facts + primary CTA "explore these straits." No documentary chapters. Capped height; scroll is the exception.
- **Hub / Discovery (Explore, Academy):** `PageHero` → lenses/paths as Rails or a grid → onward. No entity documentaries.
- **Experience (Journeys, Daily):** cover `PageHero` before start → stepper/voyage machine (one stop at a time, `Tabs`). Handcrafted per stop.
- **Chart (map):** fullscreen destination with glass chrome + layer system. Not a boxed utility.
- **Overlays (Search, Cabin):** §3.6/3.7.
- **Singular (Home, 404):** bespoke, frozen; exempt from templates but must use tokens.

---

## 5. Entity-hierarchy law

1. Only **straits** get the Documentary template.
2. Countries, water bodies, regions, ports, canals, bridges, tunnels, islands, routes, wildlife → **Context** template, and their primary purpose is to route the user _to straits_.
3. In search: straits ranked first and weighted heavier (larger tile / segment header); supporting types grouped beneath.
4. In recommendations (`ContinueExploring`) and pills: straits are visually privileged over supporting entities.
5. Homepage metrics are strait-derived (straits, chokepoints, regions) — never ports/canals/countries as headline value.
6. Wildlife, records, tags, timeline are **lenses/chapters on straits**, not peer destinations.

---

## 6. Accessibility (WCAG 2.2 AA, non-negotiable)

- **Contrast:** text ≥ 4.5:1, large text/UI ≥ 3:1, in every theme. The High-contrast toggle strengthens hairlines and muted text.
- **Focus:** a visible `:focus-visible` ring by default (not gated on the toggle); 2px gold, 2px offset. Focus trapped in overlays; restored on close.
- **Targets:** ≥ 44×44px interactive on touch.
- **Motion:** respect `prefers-reduced-motion` and the manual Reduce-motion toggle; both still all animation/transition.
- **Semantics:** dialogs `aria-modal`; comboboxes wired with `role="option"` + `aria-activedescendant`; toggles `role="switch"`; radios in `radiogroup`; live regions on async results.
- **Localization:** every user-visible string via `t()` (en + ro today); the language toggle updates all chrome live. No hardcoded copy.
- **Larger-text:** the root-scale toggle must not break layouts (use rem/clamp, test at 112.5%).

---

## 7. Voice & content

- Calm, literary, precise. Short. Nautical without kitsch.
- Cite every factual claim (`SourcesList`); never invent metrics or categories.
- No emoji. Prefer the icon set.
- Labels are chart annotations (mono, uppercase, terse). Titles are editorial (serif).

---

## 8. Governance (so V2 doesn't drift like V1)

1. **Tokens first:** no PR introduces a raw hex/radius/duration/shadow that a token exists for.
2. **CI guard:** a stylelint rule fails the build on off-token color/radius/duration in `global.css` and component styles.
3. **Component gallery:** a dev-only route rendering every component in every variant × theme, to catch drift visually.
4. **This doc is the contract:** update `DESIGN_SYSTEM_V2.md` in the same PR that changes a token or component rule. Delete/relegate V1.
5. **Templates enforced in review:** a new page must name its template (§4) and justify any deviation.

---

## 9. Migration note

V2 tokens are **additive** — they can land in `:root` without breaking current screens, then call sites migrate incrementally (audit Phase A1 → C1). The end state: zero raw px radii/durations/shadows, one button, three cards, one chip, one map wrapper, two enforced templates, and a `global.css` whose values match this document exactly.
