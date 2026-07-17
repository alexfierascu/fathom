import { failure, json, publicUser, readJson, sessionUser, type Env } from '../_shared';

interface ProfileBody {
  name?: string;
  bio?: string;
  avatar?: string;
  /** A data-URL portrait, or null to remove it. */
  portrait?: string | null;
}

const AVATAR_IDS = new Set([
  'helm',
  'compass',
  'anchor',
  'lighthouse',
  'gull',
  'sextant',
  'burgee',
  'wave',
]);

const PORTRAIT_LIMIT = 400_000;

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const user = await sessionUser(request, env);
  if (!user) return failure(401, 'Not signed in.');
  const body = await readJson<ProfileBody>(request);
  if (!body) return failure(400, 'Nothing to change.');

  const next = { ...user };
  if (typeof body.name === 'string') next.name = body.name.trim().slice(0, 40);
  if (typeof body.bio === 'string') next.bio = body.bio.trim().slice(0, 240);
  if (typeof body.avatar === 'string') {
    if (!AVATAR_IDS.has(body.avatar)) return failure(400, 'Unknown ensign.');
    next.avatar = body.avatar;
  }
  if (body.portrait === null) next.portrait = null;
  else if (typeof body.portrait === 'string') {
    if (!body.portrait.startsWith('data:image/') || body.portrait.length > PORTRAIT_LIMIT) {
      return failure(400, 'Portraits must be small images.');
    }
    next.portrait = body.portrait;
  }
  next.updated_at = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE users SET name = ?, bio = ?, avatar = ?, portrait = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(next.name, next.bio, next.avatar, next.portrait, next.updated_at, user.id)
    .run();
  return json({ user: publicUser(next) });
};
