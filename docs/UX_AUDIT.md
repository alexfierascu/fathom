# Fathom — UX / UI Design Audit

**Status:** Snapshot audit, 2026-07-18 · main @ `16ab053`
**Author role:** Senior Product Designer / UX Lead / Design-System Architect / IA reviewer
**Benchmark:** the homepage (`/`) is the agreed quality standard; every screen is scored against it.
**Scope:** every reachable route, drawer, overlay, and shared component in `apps/web`.
**Method:** static inspection of the React/CSS source (`apps/web/src`), the token layer (`styles/global.css`), the router (`app/router.tsx`), and the component tree — cross-checked against the four themes. No runtime analytics were available; interaction findings are inferred from code.

> This document is deliberately blunt. It exists to be the blueprint for the next major version, so it privileges honest, specific findings over reassurance. Companion document: **`DESIGN_SYSTEM_V2.md`** (the forward-looking spec every fix should follow).

---

## 1. Executive summary

Fathom is, today, **two products wearing one skin**. A run of recent redesigns pulled the primary surfaces (homepage, Explore, entity pages, Journeys, Academy, Captain's Cabin, 404) up to a genuinely premium, cohesive standard — cinematic heroes, glass navigation, a shared primitive set (`PageHero`, `EditorialSection`, `InteractiveSection`, `DiscoveryRail`). That work is real and it shows.

But the cohesion is **skin-deep, not system-deep**, and the product's _identity_ has not caught up with its _styling_. Three structural problems dominate:

1. **The strait is not yet the main character.** Countries, water bodies, regions, ports, canals, islands, and routes all render as **full documentary pages** built from the same premium primitives as straits. They look beautiful and they _compete_. Explore was just corrected to be strait-first, but the entity pages, the search browse-chips, and the search result model still treat supporting entities as co-equal. The homepage still counts "Waters" and "Countries" as headline metrics on the Chart Room pillar.

2. **There is no design _system_, only a design _language_.** The visual language is consistent by taste and repetition, not by tokens. There is exactly **one** radius token (`--radius: 8px`) while components hardcode radii of 3–20px; there is **no spacing scale**, **no motion scale** (durations span 0.15s–0.6s with a dozen distinct values and multiple easings), **no elevation scale**, and only **one** typographic family is tokenized — `'IBM Plex Mono'` alone appears as a raw string **89 times**. New components are copy-pasted, not composed. The one written spec (`docs/DESIGN_SYSTEM.md`) has **drifted from the code**: it still documents `--accent-2` as teal and `--bg` as `#0a1b2a`; the live system uses gold `#e7b75f` and `#071e3d`.

3. **Pages are long, not layered.** Several core surfaces (Profile, Timeline, the strait documentary, the journey overview) rely on vertical scroll where tabs, steppers, or progressive disclosure would serve the "walk through a museum" intent far better. The 404 is the _only_ screen that has fully internalised the "one screen, no scroll" ideal.

There is also **accumulated debt**: four components are dead (`Breadcrumbs`, `RegionChips`, `ResultsGrid`, `GlobalSearch`, plus two test files), there are **no loading states anywhere** (lazy routes flash empty), and in-app empty/not-found states are plain text lines while the 404 is cinematic.

**Verdict:** Fathom reads as "a very well-decorated collection of pages," not yet "a single premium product about the world's straits." The gap is closable, and mostly by _system_ and _IA_ work rather than more visual polish. The fastest path to "one product" is (a) tokenize the language, (b) demote supporting entities, and (c) replace scroll with structure on the four offending screens.

**Overall product cohesion score: 6.5 / 10.** (Individual flagship screens reach 9; the system holding them together is a 4.)

---

## 2. Route inventory

24 routes are registered in `app/router.tsx` (22 in-shell + 1 chrome-free embed + redirects). All detail pages are lazy chunks; the homepage ships in the main bundle.

### 2a. Structural inventory

| Route                                                         | Purpose                                    | Primary entity            | Layout                                    | Reusable          | Hero              | Shared components                                                                       | Scroll        |
| ------------------------------------------------------------- | ------------------------------------------ | ------------------------- | ----------------------------------------- | ----------------- | ----------------- | --------------------------------------------------------------------------------------- | ------------- |
| `/`                                                           | Mode launcher (benchmark)                  | —                         | Bespoke `portal`                          | No (unique)       | Full-bleed panels | `UserMenuButton`                                                                        | None (locked) |
| `/explore`                                                    | Strait discovery                           | **Strait**                | `PageHero` + `DiscoveryRail`×N            | Yes               | Ambient           | `DiscoveryRail`, `Collections`                                                          | Long (rails)  |
| `/map`                                                        | Chart Room map                             | Strait                    | `map-intro` + `MapPanel`                  | Partial           | Compact band      | `MapPanel`                                                                              | Medium        |
| `/learn`                                                      | Academy hub                                | Strait                    | `PageHero` + `learn-paths`                | Yes               | Ambient           | `Records`, `Collections`, `InterestingFacts`                                            | Medium        |
| `/straits/:slug`                                              | **Strait documentary (flagship)**          | **Strait**                | hero→editorial→interactive→onward         | Yes               | Full-bleed image  | `StraitMap`, `EntityGallery`, `SourcesList`, `StraitPager`, `ContinueExploring`         | **Long**      |
| `/water-bodies/:slug`                                         | Sea/ocean detail                           | Water body                | `PageHero`→`InteractiveSection`→editorial | Yes               | Ambient           | `FlowDiagram`, `ThreadBar`, `StraitCard`                                                | Long          |
| `/countries/:slug`                                            | Country detail                             | Country                   | `PageHero`→`InteractiveSection`→editorial | Yes               | Ambient           | `StraitCard`, `EntityPills`                                                             | Long          |
| `/regions/:slug`                                              | Region detail                              | Region                    | `PageHero`→`InteractiveSection`→editorial | Yes               | Ambient           | `StraitCard`, `EntityPills`                                                             | Long          |
| `/ports` `/canals` `/bridges` `/tunnels` `/islands` `/routes` | Structure detail (6 routes, one component) | Port/Canal/…              | `StructurePage` shared                    | Yes               | Ambient           | `InteractiveSection`, `EntityGallery`                                                   | Medium        |
| `/tags/:slug`                                                 | Straits by tag                             | Strait (via tag)          | `PageHero` + `EditorialSection`(grid)     | Yes               | Ambient           | `StraitCard` grid                                                                       | Medium        |
| `/compare/:a?/:b?`                                            | Compare two straits                        | Strait                    | `PageHero` + 2-col `compare-grid`         | Partial           | Ambient + pickers | `EntityPills`                                                                           | Medium        |
| `/journeys`                                                   | Journeys index                             | Journey (of straits)      | `PageHero`(cover) + `journey-tile` grid   | Yes               | Cover image       | —                                                                                       | Medium        |
| `/journeys/:slug`                                             | Journey experience                         | Journey                   | `PageHero`(cover) → `voyage` machine      | Partial (bespoke) | Cover image       | `JourneyMap`, `Tabs`, `ConnectionCards`, `NextStopStrip`, `JourneyChain`, `CompareStop` | Medium        |
| `/daily`                                                      | Daily expedition                           | Journey                   | reuses `JourneyExperience`                | Yes               | Cover image       | (as journey)                                                                            | Medium        |
| `/profile`                                                    | Captain's Log (full)                       | User                      | `PageHero` + `Section`×8                  | Partial           | Ambient           | `Avatar`, `Trophy`, `AccountSection`                                                    | **Very long** |
| `/wildlife`                                                   | Corridor species                           | **Wildlife (supporting)** | `PageHero` + `wildlife-rail`              | Yes               | Ambient           | `EditorialSection`                                                                      | Medium        |
| `/six-degrees`                                                | Connection game                            | Strait                    | `PageHero` + `six-board` (`xp-cards`)     | Partial           | Ambient           | —                                                                                       | Medium        |
| `/quiz`                                                       | Strait quiz                                | Strait                    | `PageHero` + `quiz-panel`                 | Partial           | Ambient           | —                                                                                       | Medium        |
| `/timeline`                                                   | Historical events                          | Strait (via events)       | `PageHero` + `timeline` `<ol>`            | Partial           | Ambient           | `EntityPills`                                                                           | **Long**      |
| `*` (404)                                                     | Not found                                  | —                         | Bespoke `uc-` single-screen               | No (unique)       | Full-bleed photo  | —                                                                                       | None (locked) |
| `/embed/straits/:slug`                                        | 3rd-party iframe card                      | Strait                    | Bespoke `embed`                           | No (intentional)  | Compact           | `StraitMap`                                                                             | Medium        |
| `/passport` `/tours` `/tours/:slug`                           | Redirects                                  | —                         | `<Navigate>` / `TourRedirect`             | —                 | —                 | —                                                                                       | —             |

**Overlays (not routes):** **Captain's Cabin** (`UserMenu`, portaled drawer + auth slide-over) and the **Chart Room search** (`ChartRoom`, full-screen command overlay).

### 2b. Scoring (out of 10; Priority = redesign urgency for the pivot)

| Route / surface                      | Design | UX  | Consistency | Immersion | Content density | Interaction cplx | Priority                                              |
| ------------------------------------ | ------ | --- | ----------- | --------- | --------------- | ---------------- | ----------------------------------------------------- |
| `/` homepage                         | 10     | 9   | 10          | 10        | Low             | Med              | — (benchmark)                                         |
| Captain's Cabin                      | 9      | 9   | 9           | 8         | Med             | High             | Low                                                   |
| `/journeys`                          | 9      | 8   | 9           | 9         | Med             | Low              | Low                                                   |
| `/straits/:slug`                     | 9      | 8   | 9           | 9         | High            | Med              | **High** (scroll → chapters; add inline quiz/compare) |
| `/explore`                           | 9      | 8   | 9           | 8         | Med             | Low              | Low (just pivoted)                                    |
| 404                                  | 9      | 8   | 8           | 9         | Low             | Low              | —                                                     |
| `/learn` Academy                     | 8      | 7   | 8           | 7         | Med             | Low              | **High** (is a menu, not "Duolingo for straits")      |
| `/journeys/:slug`                    | 8      | 8   | 8           | 8         | Med             | High             | Med                                                   |
| `/profile`                           | 8      | 7   | 8           | 6         | High            | Med              | Med (scroll → sections/tabs)                          |
| Chart Room search                    | 8      | 7   | 8           | 7         | Med             | Med              | **High** (strait-first + combobox a11y)               |
| `/water-bodies/:slug`                | 8      | 7   | 8           | 7         | High            | Low              | **High** (demote: competes with straits)              |
| `/countries/:slug`                   | 8      | 7   | 8           | 6         | High            | Low              | **High** (demote)                                     |
| `/regions/:slug`                     | 8      | 7   | 8           | 6         | High            | Low              | **High** (demote)                                     |
| `/ports` `/canals` `/…` (structures) | 8      | 7   | 8           | 6         | Med             | Low              | **High** (demote)                                     |
| `/tags/:slug`                        | 7      | 7   | 8           | 6         | Med             | Low              | Med                                                   |
| `/wildlife`                          | 7      | 7   | 8           | 7         | Med             | Low              | Med (should be a strait lens, not a top page)         |
| `/quiz`                              | 7      | 7   | 8           | 6         | Med             | Med              | Med (fold into Academy)                               |
| `/six-degrees`                       | 7      | 7   | 7           | 7         | Med             | High             | Med (`xp-card` idiom off-system)                      |
| `/map` Chart Room                    | 7      | 7   | 7           | 7         | Low             | Med              | Med (utility, not destination; no layers)             |
| `/compare`                           | 6      | 7   | 7           | 5         | Med             | Med              | Med (datasheet feel; fold into strait page)           |
| `/timeline`                          | 7      | 6   | 7           | 6         | High            | Low              | Med (long scroll; no disclosure)                      |

---

## 3. Strengths (what is already at benchmark)

- **The homepage is genuinely world-class.** The four expanding panels, the ambient particles, the launch-then-navigate choreography, and the reduction to logo + search + avatar are cohesive and confident. Correct call to freeze it.
- **A real primitive set exists and is adopted.** `PageHero` (10 files), `EditorialSection` (7), `InteractiveSection` (5), `Section` (12). Most detail pages now share the same hero and editorial rhythm — a large improvement over the old `strait-hero`/`hub-header`/`detail-title` sprawl (now fully removed).
- **The Captain's Cabin is excellent.** The frosted right-drawer, compass identity, XP bar, activity timeline, folded preferences, and the Apple-style auth push panel are the strongest non-home surface. Portaling it past the nav's `backdrop-filter` context was the right instinct.
- **Theming is structural.** Four themes work by construction because components read tokens, not literals (for _color_). Parchment/daylight light modes render correctly across the app.
- **Editorial voice.** Copy is calm and literary; the "cite every claim" discipline (`SourcesList`) is a differentiator most atlases lack.
- **Accessibility groundwork.** Reduce-motion honored via media query _and_ a manual preference; a11y toggles (contrast, larger text, focus rings) apply before first paint; dialogs trap focus and honor Escape.

---

## 4. Weaknesses (what breaks the "one product" feeling)

- **Supporting entities are documentaries.** The single biggest identity leak. See §9.
- **No token system beneath the language.** See §8. Radii, spacing, motion, elevation, and two of three font families are ad hoc.
- **Scroll instead of structure** on Profile, Timeline, strait detail, journey overview. See §11.
- **The map is a utility, not a destination.** `/map` gained a title band but is still a Leaflet panel with toggle chips; no layer system, no cinematic framing, capped at ≤1180px inside `.wrap`.
- **Search leaks the pivot.** Chart Room browse-chips include Countries/Ports/Canals/Waters/Regions; result cards render all ten entity types with equal glyphs and weight.
- **No loading states.** Lazy route chunks resolve to a blank frame; there is no skeleton, spinner, or transition placeholder anywhere in the app.
- **Two-tier empty/error states.** The 404 is cinematic; every in-app "not found" is a bare `.empty` text line with a link.
- **Dead code in the tree.** `Breadcrumbs`, `RegionChips`, `ResultsGrid`, `GlobalSearch` have zero importers.
- **Academy is a table of contents, not a curriculum.** Six `learn-path` cards linking to existing tools; no lessons, paths, streaks-as-teaching, or progress-as-learning.

---

## 5. Screens requiring redesign vs. already at benchmark

**Already at (or near) benchmark — leave alone:** `/` (frozen), `/journeys`, `/explore`, Captain's Cabin, 404, `/straits/:slug` (structurally sound; needs chaptering, not redesign).

**Needs re-_thinking_, not re-skinning (IA/behaviour):** supporting-entity pages (demote), `/learn` (curriculum), `/map` (destination + layers), Chart Room search (strait-first + a11y), `/compare` and `/quiz` and `/wildlife` (fold into strait pages / Academy / lens).

**Needs re-_structuring_ (scroll → disclosure):** `/profile`, `/timeline`, `/straits/:slug`, `/journeys/:slug` overview.

**Off-system idioms to reconcile:** `/six-degrees` (`xp-card`), `/compare` (`compare-grid` datasheet), the voyage card (`voyage-*`), the map toggle chips (`chip`).

---

## 6. Design-consistency findings (against the homepage)

| Dimension           | Verdict                                 | Evidence                                                                                                                                                                                                      |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography          | **Good (language), poor (system)**      | Serif display + Grotesk + Mono is consistent by usage; but only `--font-display` is a token. `'IBM Plex Mono'` literal ×89, `'Space Grotesk'` ×15.                                                            |
| Spacing / margins   | **Inconsistent**                        | `--gap`/`--section-gap` exist but most spacing is hardcoded (8–34px ad hoc).                                                                                                                                  |
| Grid                | Mostly consistent                       | `.grid`, rails, `interactive-grid` recur; `.wrap` max-width 1180 is the shared column.                                                                                                                        |
| Glass               | **Inconsistent blur**                   | `backdrop-filter` values range 6–30px across nav, cabin, chartroom, launch icon with no scale.                                                                                                                |
| Shadows / elevation | **Inconsistent**                        | Every elevated component defines a bespoke `box-shadow`; no elevation tokens.                                                                                                                                 |
| Buttons             | Fragmented                              | `uc-btn` (home/heroes), `journey-btn` (voyage/quiz), `cabin-btn` (cabin), `chip`/`cr-chip`/`pill` variants, `nav-random`, `link-button`. At least **6** button idioms.                                        |
| Cards               | Fragmented                              | `card`, `rail-tile`, `journey-tile`, `explore-tile`(dead-ish), `learn-path`, `cr-card`, `cr-journey`, `xp-card`, `wildlife-card`, `stamp`, `trophy-card`, `compare-column`, `stat-card`. **13+** card idioms. |
| Icons               | **Mixed metaphors**                     | Inline SVG (search, compass, favourite), Unicode glyphs (`↔ ≈ ⚑ ◈ ⚓ ⌇`), and emoji-adjacent symbols (`⚄ ⚓ ⛓`). No icon set.                                                                                 |
| Hero                | Good                                    | `PageHero` unifies most; homepage + 404 + journey use bespoke heroes (acceptable, they're special).                                                                                                           |
| Maps                | Consistent engine, inconsistent framing | `MapPanel`/`StraitMap`/`StraitsMap`/`JourneyMap` share Leaflet but differ in chrome.                                                                                                                          |
| Statistics          | Two idioms                              | `stat-card` (strait/journey) vs `cabin-metric` rows vs `panel-meta` (home) vs `rank`/`coverage` bars (profile).                                                                                               |
| Transitions         | **No scale**                            | Durations 0.15/0.16/0.18/0.2/0.22/0.25/0.28/0.3/0.34/0.4/0.5/0.6s; multiple easings.                                                                                                                          |
| Hover               | Mostly consistent                       | translateY(-2 to -4) + border-gold is the recurring lift; good, but not tokenized.                                                                                                                            |
| Loading             | **Absent**                              | No skeletons/spinners.                                                                                                                                                                                        |
| Empty               | **Two-tier**                            | Cinematic 404 vs plain `.empty`.                                                                                                                                                                              |
| Error               | Minimal                                 | Network/API errors surface as plain text in `AccountSection`; no global error boundary UI.                                                                                                                    |

---

## 7. Information architecture

- **Purpose clarity:** The homepage answers "what is this?" well _after_ the pivot copy. Inner pages answer "what is this page?" via `PageHero` eyebrow/title — good. But the _product's_ subject is muddied the moment a user lands on `/countries/spain` and sees a full-dress documentary.
- **"What do I do next?":** Strong on strait pages (`ContinueExploring`, `StraitPager`) and journeys. Weak on Timeline (dead-ends at the last event), Compare (no onward), Quiz (replay only), and supporting-entity pages (their onward pushes _more supporting entities_).
- **Progressive disclosure:** Rare. Preferences (Cabin) and journey stops (`Tabs`) are the only real examples. Most pages present everything at once.
- **Storytelling:** Strait pages and journeys tell stories. Hubs and supporting entities enumerate.
- **First-time comprehension:** A newcomer would understand "maritime app," and now "about straits" on the homepage — but the entity pages would re-muddy it within two clicks.

---

## 8. Design-system audit (duplication & the missing scale)

**Missing token scales (highest-leverage debt):**

- **Radius:** 1 token (`--radius: 8px`); code uses 3, 4, 5, 6, 8, 10, 11, 12, 13, 14, 16, 18, 20, 999px. → define `--r-xs…--r-xl` + `--r-pill`.
- **Spacing:** `--gap`, `--section-gap` only; everything else hardcoded. → define a 4px-based scale `--s-1…--s-12`.
- **Motion:** none. → `--dur-fast/base/slow` (150/250/350ms) + `--ease-standard` (the pivot's ease-in-out) + `--ease-enter` (the recurring `cubic-bezier(.22,.61,.36,1)`).
- **Elevation:** none. → `--elev-1…3` shadow tokens.
- **Typography:** only `--font-display`. → add `--font-sans` (Inter) and `--font-mono` (IBM Plex Mono; 89 literals collapse to one token).
- **Glass/blur:** none. → `--blur-1/2/3` + a `.glass` utility.
- **Z-index:** ad hoc (30, 150, 151, 200). → a named scale.

**Duplicated components to consolidate:**

- **Buttons →** one `Button` with `variant` (primary/ghost/quiet/danger) + `size`. Retire `uc-btn`, `journey-btn`, `cabin-btn`, `nav-random`, `link-button` divergences.
- **Cards →** one `Card` primitive + composition. The 13 card idioms collapse to ~3 real archetypes: **media tile** (rail/journey/explore/cr-card), **stat row** (metric/rank/coverage), **status badge** (stamp/trophy/medal).
- **Chips/pills →** one `Chip` (`pill`, `cr-chip`, `chip`, `cabin-chip`, `rail-tag` are the same object).
- **Metric displays →** one `Stat` (value + label) with layouts.
- **Maps →** one `Map` wrapper with a `chrome` prop.
- **Empty state →** one `EmptyState` (used by `.empty` sites _and_ the Chart Room, styled to 404 quality).
- **Loading →** a `Skeleton`/`RouteFallback` (currently none).

**Dead code to delete:** `Breadcrumbs.tsx` + `Breadcrumbs.test.tsx`, `RegionChips.tsx`, `ResultsGrid.tsx`, `GlobalSearch.tsx` + `GlobalSearch.test.tsx`.

**Documentation drift:** `docs/DESIGN_SYSTEM.md` no longer matches the code (accent-2 teal→gold, bg value, body font). `DESIGN_SYSTEM_V2.md` supersedes it; V1 should be archived or deleted.

---

## 9. Entity hierarchy — is the strait the main character?

**No — not yet, below the homepage/Explore layer.** Concrete competitions:

1. **Supporting entities use the flagship template.** `CountryDetailPage`, `WaterBodyDetailPage`, `RegionDetailPage`, and `StructurePage` all open with a full `PageHero` and an `InteractiveSection` map — identical grandeur to a strait. A country page should be a _lightweight context card that points at its straits_, not a documentary.
2. **Homepage Chart Room pillar** headlines "Waters" and "Countries" as metrics. (Explore's pillar was fixed to Straits/Chokepoints/Regions; Chart Room's was not.)
3. **Chart Room search browse-chips**: Countries, Ports, Canals, Waters, Regions are offered as first-class browse verbs.
4. **Search results** render all 10 entity types with equal glyph weight; a port and a strait look identical in the result list.
5. **`ContinueExploring`** (on strait pages) recommends supporting entities alongside straits without privileging straits.
6. **`/wildlife`** is a top-level destination; wildlife should be a _lens on straits_ (Explore already has "Life at the narrows"), not a peer page.
7. **`EntityPills`** everywhere renders countries/waters/routes as identical gold pills to strait links.

**Recommendation:** introduce two page templates — **Documentary** (straits only) and **Context** (everything else: compact, strait-referring, capped height) — and enforce them. Downgrade supporting entities in search ranking and visual weight. Make every supporting page's primary CTA "the straits it touches."

---

## 10. Navigation audit

- **Global nav** (`GlassNavigation`) currently: logo · center modes (Explore/Journeys/Chart Room/Academy) · search · Captain. The stated new vision is **logo · search · Captain** only. This is a deliberate reduction toward the "rooms" model and depends on the Chart Room search becoming the primary wayfinder — **do them together** or navigation regresses.
- **Search** works well as a summonable overlay (Escape, outside-click, keyboard result nav) but its keyboard model is input-only and its combobox semantics are incomplete (`role="combobox"` with no `aria-activedescendant`/`role="option"` wiring).
- **Captain's Cabin** navigation is strong (deep-links to profile chapters via hash-scroll).
- **Breadcrumbs are gone** (component dead). For a "rooms, not pages" product that's defensible, but there is now _no_ in-page "where am I / go up" affordance except the browser back button and the logo. Acceptable only if search + cabin truly become the spine.
- **Back navigation:** relies on browser history; no app-level back. Journey/voyage has its own internal stepper.
- **Deep linking:** solid (`?stop=`, `/compare/:a/:b`, `/profile#trophies`, `?drift=1`, `?legend=1`).
- **Page transitions:** `viewTransition` is used widely and is a real cohesion win; the homepage launch choreography and cabin/search slides are the highlights.

---

## 11. Visual hierarchy & scroll

**Focal clarity is generally good** (hero title is the unambiguous primary on every `PageHero` screen). Problems are density and length:

| Screen                       | First-screen usefulness    | Scroll                                     | Better structure                                                          |
| ---------------------------- | -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `/profile`                   | Identity masthead only     | **~8 stacked sections**                    | Tabs or an in-drawer stepper: Standing · Log · Trophies · Voyages · Stats |
| `/timeline`                  | Hero, then a long `<ol>`   | **All events stacked**                     | Century steppers / horizontal era navigation / decade chapters            |
| `/straits/:slug`             | Cinematic hero (excellent) | Story→history→chart→around→wildlife→onward | Chapter tabs or a sticky section rail; keep hero, chapter the body        |
| `/journeys/:slug` (overview) | Cover + start              | Map + "The stops" list                     | Fine, but the stop list could be a horizontal filmstrip                   |
| Supporting entities          | Hero (too grand)           | Grids of straits + geo-groups              | Collapse to a single context screen                                       |

**Dead space / distraction:** minimal — the design is disciplined. The bigger issue is the _opposite_: information delivered as a wall rather than a sequence.

---

## 12. Immersion scorecard (per surface)

| Surface                         | Immersion | Educational | Exploration | Storytelling | Beauty | Overall |
| ------------------------------- | --------- | ----------- | ----------- | ------------ | ------ | ------- |
| `/`                             | 10        | 6           | 9           | 8            | 10     | **9**   |
| `/straits/:slug`                | 9         | 9           | 8           | 9            | 9      | **9**   |
| `/journeys` + `/journeys/:slug` | 9         | 8           | 8           | 9            | 9      | **9**   |
| Captain's Cabin                 | 8         | 6           | 7           | 7            | 9      | **8**   |
| `/explore`                      | 8         | 7           | 9           | 6            | 8      | **8**   |
| 404                             | 9         | 3           | 5           | 7            | 9      | **8**   |
| `/learn`                        | 6         | 7           | 6           | 5            | 8      | **6.5** |
| Chart Room search               | 7         | 5           | 8           | 4            | 8      | **7**   |
| `/map`                          | 7         | 6           | 7           | 4            | 7      | **6.5** |
| `/profile`                      | 6         | 6           | 6           | 6            | 8      | **6.5** |
| `/quiz`                         | 5         | 8           | 5           | 4            | 7      | **6**   |
| `/six-degrees`                  | 7         | 7           | 8           | 5            | 6      | **6.5** |
| `/timeline`                     | 5         | 8           | 5           | 6            | 7      | **6**   |
| `/compare`                      | 4         | 7           | 5           | 3            | 6      | **5**   |
| supporting-entity pages         | 6         | 6           | 6           | 5            | 8      | **6**   |
| `/wildlife`                     | 7         | 7           | 6           | 6            | 7      | **6.5** |

---

## 13. Design-debt register

**Structural:** no token scales (radius/spacing/motion/elevation/font/blur/z); 6+ button idioms; 13+ card idioms; two search components (one dead); two-tier empty states; no loading states; no global error UI; documentation drift.
**Dead code:** `Breadcrumbs`(+test), `RegionChips`, `ResultsGrid`, `GlobalSearch`(+test).
**Identity:** supporting entities as documentaries; homepage Chart-Room pillar metrics; search browse-chips & result weighting; `/wildlife` as a peer page; `ContinueExploring` neutrality.
**Interaction:** search combobox a11y incomplete; no roving focus in card grids; map is a utility; `xp-card`/`compare-grid`/`voyage` off-system.
**Layout:** Profile/Timeline/strait/journey scroll length; supporting-entity over-grandeur.
**Micro:** inconsistent hover lift distances; inconsistent arrow-glyph nudge; Unicode glyph icons; emoji-adjacent symbols (`⚄`, `⛓`) surviving in copy despite "no emoji" intent.

---

## 14. Top 25 UX issues

1. Supporting-entity pages compete with straits for attention (identity confusion within two clicks).
2. No loading state on any lazy route — perceived as a blank flash on slow networks.
3. In-app "not found" is a plain text line, breaking the premium spell the 404 sets.
4. Timeline dead-ends with no next step.
5. Compare offers no onward exploration and reads as a datasheet.
6. Quiz's only outcome is replay; no path back into learning.
7. Profile requires ~8 section-scrolls to see everything.
8. Search results rank/where a strait and a port look identical, slowing strait-finding.
9. Search browse-chips send users _toward_ supporting entities.
10. No app-level "back / up"; reliance on browser back after deep navigation.
11. `/map` toggles (`Trade lanes`, `Seas`, `Plot a course`, `Set adrift`) are unlabeled-by-group and discoverable only by scanning.
12. Academy is a link menu; a first-timer can't tell where to "start learning."
13. `/wildlife` as a top page invites off-topic wandering away from straits.
14. Journey overview buries the stop list below the map on first load.
15. No visible search entry hint on inner pages beyond a small icon.
16. `ContinueExploring` randomness can surface a supporting entity as the highlighted "surprise."
17. The homepage Chart-Room pillar still advertises Waters/Countries as the headline value.
18. Cabin's guest state hides a returning guest's real local activity behind the invitation.
19. Six Degrees' `xp-card` choices are dense and text-heavy vs the rest of the app.
20. Compare pickers are native `<select>`s — off-brand and small-target on mobile.
21. Timeline entity pills mix straits with countries/canals without privileging straits.
22. No skeleton for map tiles; the chart pops in.
23. Empty favourites/recent produce silent gaps rather than gentle prompts in the Cabin.
24. Keyboard users can't traverse Chart Room's discover cards (only typed results).
25. Deep-linked `/compare/:a/:b` with an invalid slug silently falls back rather than explaining.

## 15. Top 25 design issues

1. One radius token vs 14 hardcoded radii.
2. No spacing scale.
3. No motion scale (12+ durations, multiple easings).
4. No elevation/shadow scale.
5. `'IBM Plex Mono'` string literal ×89; `'Space Grotesk'` ×15; only display font tokenized.
6. Six divergent button idioms.
7. Thirteen-plus card idioms.
8. `backdrop-filter` blur ranges 6–30px with no scale.
9. Icon system is three metaphors (SVG, Unicode, emoji-adjacent).
10. Stat display has four idioms.
11. Empty state has two tiers.
12. `docs/DESIGN_SYSTEM.md` values are stale (teal accent, old bg, Inter-only note).
13. Hover lift distances vary (−1/−2/−3/−4px).
14. Arrow nudge distances vary (translateX 3px vs none).
15. Chip/pill styling forks across `pill`, `cr-chip`, `chip`, `cabin-chip`.
16. `xp-card` and `compare-column` predate the current language.
17. Map chrome (zoom, layers button, toggles) is unstyled Leaflet default vs glass.
18. `.empty` is unstyled beyond centered text.
19. Two blur/tint conventions for overlays (chartroom brightness(0.55) vs cabin backdrop).
20. `color-mix` tint percentages are unsystematic (8/10/12/14/24/26/40/45/55%).
21. Journey `voyage-card` header buttons (`voyage-exit`) are a one-off style.
22. `stamp`/`trophy-card`/`cabin-medal` are three takes on "earned badge."
23. Gold is used both as primary-action fill and as label/eyebrow color, occasionally reducing CTA distinctiveness.
24. Focus-visible styling is inconsistent (only strong when the a11y toggle is on).
25. Emoji-adjacent glyphs (`⚄`, `⛓`, `⚓`) remain in CTA copy despite the "no emoji" direction.

## 16. Top 25 information-architecture issues

1. Strait is not the enforced protagonist below Explore.
2. Six structure types each get a route + full page though they are pure context.
3. `/wildlife`, `/compare`, `/quiz`, `/timeline` are peers to core rooms but are really _features of_ straits/Academy.
4. Academy conflates "hub of tools" with "curriculum."
5. Chart Room (`/map`) and Chart Room (search overlay) share a name — two different things.
6. No canonical "start here" for a first-time visitor after the homepage.
7. Supporting-entity onward links deepen supporting-entity rabbit holes.
8. Tag pages exist but tags aren't surfaced as a first-class discovery lens on strait pages.
9. Journeys and Daily and Six Degrees are three "guided" ideas without a shared home.
10. Profile mixes identity, stats, achievements, account, and data-export in one scroll.
11. Timeline has no grouping (era/region/strait) — a flat chronological wall.
12. Compare is reachable but undiscoverable (no entry from strait pages).
13. Quiz tiers (Apprentice/Navigator/Pilot) aren't tied to Academy progress.
14. The map's "Plot a course" feature is buried and unexplained.
15. No relationship shown between a journey and the straits it visits from the strait's side.
16. Search "browse" verbs duplicate Explore's lenses inconsistently.
17. Region as an entity competes with region-as-a-lens (Explore) — two mental models.
18. `Records` (narrowest/longest) live on Academy but are a discovery lens (Explore).
19. Wildlife species have no home of their own yet are a top nav destination.
20. Historical events (Timeline) aren't linked from the straits they shaped as a first-class chapter.
21. No "collection" concept unifying tags, records, and lenses.
22. Daily Expedition and the quiz "daily best" are separate daily loops.
23. Achievements live only in Profile; no discovery of _how_ to earn them.
24. Sources are shown per page but there's no "the atlas's sources" index.
25. The embed page is orphaned (no discovery of the embed feature from strait pages).

## 17. Top 25 design-system issues

(See §8 for the consolidated plan; these are the discrete, fixable items.)
1–8: the eight missing scales (radius, spacing, motion, elevation, font, blur, z-index, semantic-surface). 9. Consolidate buttons to one component. 10. Consolidate cards to three archetypes. 11. Consolidate chips to one. 12. Consolidate stats to one. 13. One `EmptyState`. 14. One `RouteFallback`/`Skeleton`. 15. One `Map` wrapper with `chrome` prop. 16. One icon set (replace Unicode/emoji glyphs). 17. Delete four dead components + two tests. 18. Two enforced page templates (Documentary / Context). 19. A `.glass` utility replacing per-component `backdrop-filter`. 20. A `focus-visible` default (not gated on the a11y toggle). 21. Tokenize hover-lift and arrow-nudge as `--lift` / `--nudge`. 22. A single overlay-scrim convention. 23. Rewrite `docs/DESIGN_SYSTEM.md` (→ V2) as the enforced source of truth. 24. Add a Storybook-style component gallery route (dev-only) to prevent future drift. 25. Lint/CI guard: fail on new hardcoded hex/radius/duration outside tokens (stylelint rule).

---

## 18. Component inventory

**Layout primitives (keep, promote):** `PageHero`, `EditorialSection`, `InteractiveSection`, `Section`, `DiscoveryRail`.
**Navigation/shell:** `GlassNavigation`, `UserMenu` (Cabin), `ChartRoom` (search), `AtlasFooter` (1 use), `SeoTags`.
**Entity display:** `StraitCard`, `EntityPills`, `ConnectsLine`, `SourcesList`, `StraitPager`, `HomeSections` (Chokepoints/ExploreSections/InterestingFacts/RecentlyCharted), `HomeDiscovery` (Collections/ContinueReading/PopularTags), `ContinueExploring`.
**Maps:** `MapPanel`, `StraitMap`, `StraitsMap`, `JourneyMap`, `FlowDiagram`.
**Journeys/expedition:** `Tabs`, `JourneyChain`, `NextStopStrip`, `ConnectionCards`, `CompareStop`.
**Progression:** `Avatar`, `Trophy`, `avatars`.
**Account:** `AccountSection`, `api`, `sync`.
**Media:** `MediaGallery`/`EntityGallery`, `media`.
**Dead (delete):** `Breadcrumbs`, `RegionChips`, `ResultsGrid`, `GlobalSearch`.

**Consolidation targets:** `Button`, `Card` (×3 archetypes), `Chip`, `Stat`, `EmptyState`, `Skeleton`, `Map` wrapper, `Icon`.

## 19. Interaction inventory

Hover-lift cards; expand-on-hover homepage panels; summon/dismiss overlays (search, cabin) with Escape + outside-click + close button; focus-trapped dialogs; collapsible disclosure (cabin prefs two-level, journey `Tabs`); horizontal scroll rails; deep-link hash-scroll (profile); keyboard result navigation (search input only); radio/switch preference controls; map pan/zoom/plot/drift; quiz option select→reveal; journey stepper (dots + next-strip + arrow keys); favourite toggle; theme/appearance/locale/a11y toggles.

**Gaps:** no roving tabindex in grids; no skeletons; no drag; no swipe on mobile rails beyond native scroll; combobox a11y incomplete.

## 20. Motion inventory

`viewTransition` route changes; homepage launch (460ms expand → navigate); reveal-on-scroll (IntersectionObserver + `.reveal`); `PageHero` image slow-zoom (24s); cabin slide (340ms in / 300ms out) + section stagger + XP fill; chartroom fade (450ms in / 220ms out); rail/journey/card hover lifts; arrow nudges; particle drift (home). **Problem:** all of the above use ad-hoc durations/easings. **Fix:** three duration tokens + two easings; the pivot's "everything glides, 250–350ms, ease-in-out" becomes `--dur-base`/`--ease-standard` and is applied uniformly, with `--ease-enter` reserved for entrances.

---

## 21. Implementation roadmap

Effort is rough (S ≤ half-day, M ≈ 1–2 days, L ≈ 3–5 days, XL ≈ 1–2 weeks) for one engineer-designer.

### Phase A — Critical (identity + foundation) · ~1.5 weeks

- **A1** Author `DESIGN_SYSTEM_V2.md` tokens and add them to `:root` (radius/spacing/motion/elevation/font/blur/z + semantic surfaces). Non-breaking (additive). **M**
- **A2** Demote supporting entities to a **Context** template (country/water-body/region/structures): compact, strait-referring, capped height, primary CTA = "its straits." **L**
- **A3** Make search strait-first: rank straits first, downweight/segment supporting types, replace browse-chips with Explore's lenses, fix combobox a11y (`role="option"` + `aria-activedescendant`). **M**
- **A4** Fix homepage Chart-Room pillar metrics to strait-derived. **S**
- **A5** Delete dead components + stale `DESIGN_SYSTEM.md`. **S**

### Phase B — High-impact experience · ~2 weeks

- **B1** Chapter the strait documentary (sticky section rail / tabs; inline quiz + compare per the pivot's strait rhythm). **L**
- **B2** Restructure Profile and Timeline from scroll to tabs/steppers. **M**
- **B3** Chart Room `/map` → destination: fullscreen, glass chrome, a real **layer system** (satellite/chart/bathymetry now; scaffold historical/AIS/weather as clearly-labeled "coming soon"). **L**
- **B4** Academy → curriculum shell (paths, lessons, daily/weekly, streaks-as-learning). Needs content decisions. **XL**
- **B5** Nav minimization (logo · search · Captain) — ship _with_ B-search work. **S**

### Phase C — Design-system refactor · ~2 weeks

- **C1** `Button`, `Card`(×3), `Chip`, `Stat`, `EmptyState`, `Skeleton`, `Map` wrapper, `Icon` — build + migrate call sites. **XL**
- **C2** `RouteFallback` loading states + a global error boundary UI at 404 quality. **M**
- **C3** stylelint guard against off-token hex/radius/duration; dev-only component gallery route. **M**

### Phase D — Micro-interactions · ~3 days

- Tokenized hover-lift/arrow-nudge; unify overlay scrims; default `focus-visible`; retire emoji-adjacent glyphs from copy; consistent entrance staggers. **M**

### Phase E — Visual polish · ~3 days

- Elevation pass; glass-blur consistency; image treatment consistency (scrims/ratios); empty/loading art; typographic rhythm sweep. **M**

**Suggested order:** A → B (B1–B3, B5) → C → then B4 (Academy, its own project) → D → E. Achievements retheme (data-only) can slot anywhere in B/C.

---

## 22. Final recommendations

1. **Tokenize before you build anything else.** Every future component and every audit fix should consume `DESIGN_SYSTEM_V2.md` tokens. This is what converts "a design language" into "a design system" and is the single highest-leverage move.
2. **Enforce two templates.** Documentary (straits) vs Context (everything else). This is the structural expression of "the strait is the main character" and it fixes the identity leak permanently, not cosmetically.
3. **Replace scroll with sequence** on the four offending screens. The "museum" feeling comes from moving between rooms, not scrolling a wall.
4. **Make the map a destination and the search the spine** before removing the nav modes — they are one change, not three.
5. **Treat Academy as a content product,** not a restyle. Scope it separately.
6. **Add the missing states** (loading, premium empty, global error). They are invisible until they aren't, and they are exactly where "premium" is won or lost.
7. **Guard the system in CI.** Without a stylelint token guard and a component gallery, V2 will drift exactly as V1 did.

The bones are excellent. The work now is discipline, not decoration.
