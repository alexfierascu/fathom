# ADR 0002: Accounts and progression

- **Status:** accepted
- **Date:** 2026-07-17

## Context

Fathom grew from an atlas into a learning platform: journeys with quizzes, exams, chart
challenges, daily expeditions, and a quiz deck. All progress lived in browser storage
under `fathom-*` keys, visible on the Voyage Passport page. Two needs emerged:

1. **Progression** — turn what the traveller has done into experience, ranks,
   achievements, and statistics that reward exploration and learning.
2. **Identity** — let the log survive a cleared browser and follow the traveller
   between devices, without making an account a requirement for anything.

The deployment target is Cloudflare Pages, and the project's standing constraint is a
single repo with a single deploy.

## Decisions

- **Local-first, account-optional.** Every feature works signed out, exactly as before.
  An account adds persistence and portability, nothing else. The account panel renders
  only when the backend answers; a static-only deployment behaves as before this change.
- **The progression engine is pure and derived** (`apps/web/src/features/progression/`).
  XP, ranks, streaks, and achievements are computed on demand from the stored log —
  never stored themselves. There is nothing to migrate or recompute when the rules
  improve; cheating localStorage only cheats yourself.
- **XP counts distinct sets and high-water marks, not events.** Straits explored,
  journeys finished, best quiz score per tier, days at sea. Repeating an action grants
  nothing, so grinding has no reward surface.
- **Achievements are data, not code paths**: a list of `{id, name, line, trophy,
points, earned(stats)}` specs evaluated against the stats object. Adding an
  achievement is one entry; the profile, trophy cabinet, and points total pick it up.
- **Cloudflare Pages Functions + D1** for the backend — same repo, same deploy, no new
  infrastructure. Functions live in `/functions/api/*`; the D1 binding is named `DB`.
  The schema (`db/schema.sql`) applies itself on first use, so binding a database is
  the only setup step. Without a binding, every endpoint answers 503.
- **Sessions are HttpOnly cookies** storing a SHA-256 hash of a random token server-side;
  passwords are PBKDF2-SHA-256 at 100k iterations (the strongest KDF Workers offer
  natively). Password reset tokens are hashed, single-use, and expire in an hour; a
  reset invalidates all sessions. Auth responses never reveal whether an email exists.
- **Sync is additive merge, then last-write-wins.** The client merges each key
  (unions, high-water marks, finished-beats-unfinished) before pushing whole values;
  the server keeps one row per key per user and only accepts newer timestamps. Signing
  in on a second device combines both logs; nothing is ever lost to a sync.
- **Server-side progress rows are queryable** (`progress(user_id, key, value,
updated_at)`), which is the growth path to leaderboards, community challenges, and
  shared journeys without a schema change.

## Consequences

- The static atlas remains deployable anywhere; accounts light up only on Cloudflare
  with a D1 binding.
- Rank thresholds and XP rates can be tuned freely — nothing persisted depends on them.
- Reset emails require a `RESEND_API_KEY` environment variable; without it the token is
  created but not delivered (and surfaced in dev via `DEV_EXPOSE_RESET=1`).
- The portrait unlock (Navigator rank) is enforced client-side today; the server caps
  size and type only. If server enforcement matters later, XP can be recomputed from
  the progress rows.
