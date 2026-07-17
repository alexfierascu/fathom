import { failure, json, readJson, sessionUser, type Env } from './_shared';

/**
 * Progress sync: the captain's log, one row per browser-storage key.
 * The client merges additively before pushing, so the server only
 * needs last-write-wins per key. Rows are queryable server-side, which
 * is what future leaderboards and shared journeys will build on.
 */

interface ProgressEntry {
  value: string;
  updatedAt: string;
}

interface PutBody {
  entries?: Record<string, ProgressEntry>;
}

const KEY_PREFIXES = ['fathom-journey', 'fathom-quiz-best', 'fathom-visited', 'fathom-days', 'fathom-favourites'];
const isSyncableKey = (key: string) => KEY_PREFIXES.some((prefix) => key.startsWith(prefix));

const MAX_ENTRIES = 300;
const MAX_VALUE = 64_000;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const user = await sessionUser(request, env);
  if (!user) return failure(401, 'Not signed in.');
  const { results } = await env.DB.prepare(
    `SELECT key, value, updated_at FROM progress WHERE user_id = ?`,
  )
    .bind(user.id)
    .all<{ key: string; value: string; updated_at: string }>();
  const entries: Record<string, ProgressEntry> = {};
  for (const row of results) entries[row.key] = { value: row.value, updatedAt: row.updated_at };
  return json({ entries });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const user = await sessionUser(request, env);
  if (!user) return failure(401, 'Not signed in.');
  const body = await readJson<PutBody>(request);
  const entries = Object.entries(body?.entries ?? {});
  if (entries.length === 0) return json({ ok: true, stored: 0 });
  if (entries.length > MAX_ENTRIES) return failure(400, 'Too many entries in one push.');

  const statements = [];
  for (const [key, entry] of entries) {
    if (!isSyncableKey(key)) return failure(400, `"${key}" is not a syncable key.`);
    if (typeof entry?.value !== 'string' || entry.value.length > MAX_VALUE) {
      return failure(400, `The value for "${key}" is missing or too large.`);
    }
    const updatedAt =
      typeof entry.updatedAt === 'string' && !Number.isNaN(Date.parse(entry.updatedAt))
        ? entry.updatedAt
        : new Date().toISOString();
    statements.push(
      env.DB.prepare(
        `INSERT INTO progress (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
         WHERE excluded.updated_at >= progress.updated_at`,
      ).bind(user.id, key, entry.value, updatedAt),
    );
  }
  await env.DB.batch(statements);
  return json({ ok: true, stored: statements.length });
};
