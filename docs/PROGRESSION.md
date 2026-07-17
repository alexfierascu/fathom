# Progression, accounts, and the Captain's Log

How Fathom turns exploration into rank — and how the log follows a traveller between
devices. Design rationale lives in
[ADR 0002](decisions/0002-accounts-and-progression.md).

## The model in one paragraph

Everything the traveller does is already recorded locally under `fathom-*` browser
storage keys. The **progression engine** (`apps/web/src/features/progression/engine.ts`)
is a set of pure functions over that record: it gathers a `VoyageStats` object, prices
it into XP, maps XP to a maritime rank, computes streaks, and evaluates a declarative
achievement list. Nothing derived is ever stored — improve the rules and every profile
updates itself.

## XP

XP counts **distinct sets and high-water marks**, never repeatable events:

| Source                     | XP each  | Counted as                       |
| -------------------------- | -------- | -------------------------------- |
| Strait explored            | 15       | first visit only                 |
| Sea or ocean explored      | 10       | first visit only                 |
| Country explored           | 5        | first visit only                 |
| Journey stop travelled     | 10       | furthest stop reached            |
| Journey completed          | 100      | once per journey                 |
| Daily expedition completed | 60       | once per day's expedition        |
| Exam passed with honours   | 150      | once per journey                 |
| Chart challenge completed  | 40       | once per stop                    |
| Quiz best score            | 10/point | best score per tier, not per run |
| Day at sea                 | 5        | each distinct active day         |

Revisiting a strait, replaying a journey, or retaking a quiz you already aced grants
nothing — there is no grind to reward.

## Ranks

Twelve ranks, thresholds in XP: Cadet 0, Deckhand 100, Able Seaman 250, Helmsman 500,
Boatswain 800, Second Officer 1200, **Navigator 1700 (unlocks the custom portrait)**,
First Officer 2300, Captain 3000, Commodore 4000, Admiral 5500, Grand Explorer 7500.
Thresholds are data in `RANKS`; tuning them retunes every profile instantly.

## Streaks

- **Watch streak** — consecutive days the atlas was opened, surviving until a full day
  is missed.
- **Exploring streak** — consecutive days on which something _new_ was explored,
  derived from first-visit dates.
- Both derive from stored dates; no counters to desync.

## Achievements and trophies

`ACHIEVEMENTS` in the engine is a list of specs:

```ts
{ id, name, line, trophy, points, earned: (stats: VoyageStats) => boolean }
```

Adding an achievement is one entry — the trophy cabinet, achievement points, and any
future notification surface all read the same list. Trophies are engraved SVG
instruments (`Trophy.tsx`): compass, sextant, anchor, wheel, star, flag, insignia,
medal, map, knot, lighthouse, telescope — drawn in the atlas's line art, never emoji.

## The Captain's Log page

`/profile` (the old `/passport` redirects). Sections: identity masthead with ensign or
portrait · Standing (rank, XP bar, rank ladder, streaks) · The chart so far (coverage
bars with completion percentages) · Trophy cabinet · Voyages (stamps, gold for
honours) · Seamanship (quiz bests and the itemised XP ledger) · Favourite waters ·
Recently explored · Account · Carry it with you (export/import as JSON).

Favourites are pinned with the **Save to log** toggle that appears on every entity
page's Continue Exploring section.

## Accounts

Optional, and additive. The backend is Cloudflare Pages Functions + D1 in this repo:

| Endpoint                  | Method | Does                                            |
| ------------------------- | ------ | ----------------------------------------------- |
| `/api/auth/register`      | POST   | create account, start session                   |
| `/api/auth/login`         | POST   | start session                                   |
| `/api/auth/logout`        | POST   | end session                                     |
| `/api/auth/me`            | GET    | current user                                    |
| `/api/auth/profile`       | PATCH  | name, bio, ensign, portrait                     |
| `/api/auth/password`      | POST   | change password (needs the current one)         |
| `/api/auth/reset-request` | POST   | issue a reset token (emailed via Resend if set) |
| `/api/auth/reset`         | POST   | set a new password with a token                 |
| `/api/progress`           | GET    | pull the synced log                             |
| `/api/progress`           | PUT    | push log entries (last-write-wins per key)      |

Schema: `db/schema.sql` — `users`, `sessions` (hashed tokens), `password_resets`
(hashed, single-use, 1-hour), and `progress` with one row per synced storage key per
user. The schema applies itself on first use.

### Sync semantics

The client merges before it pushes (`apps/web/src/features/account/sync.ts`): visited
places union keeping the earliest date, days at sea union, favourites union by place,
quiz bests take the high-water mark per tier, journey progress prefers finished then
the further stop, journey logs union quizzes and challenges and keep the better exam.
Signing in on a second device therefore **combines** both logs. The server then only
needs last-write-wins per key.

### Deployment

Accounts need one thing: a D1 database bound as `DB` on the Pages project
(Settings → Bindings → D1). Optional variables: `RESEND_API_KEY` and `RESET_FROM` for
password-reset email. Without the binding, the API answers 503, the account panel stays
hidden, and the atlas is exactly the static site it always was.

Local development: `npx wrangler pages dev apps/web/dist --d1 DB` (add
`--binding DEV_EXPOSE_RESET=1` to test the reset flow without email).

## Growth path

Multiplayer-shaped features build on what is already here: progress rows are queryable
server-side (leaderboards, community challenges), profiles have public-safe fields
(viewing another traveller's log), and journeys are addressed by id (shared journeys).
None of these require changing the local-first model — the account layer stays a
mirror of the browser's log.
