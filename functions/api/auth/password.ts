import {
  failure,
  hashPassword,
  json,
  MIN_PASSWORD,
  readJson,
  sessionUser,
  verifyPassword,
  type Env,
} from '../_shared';

interface PasswordBody {
  current?: string;
  next?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const user = await sessionUser(request, env);
  if (!user) return failure(401, 'Not signed in.');
  const body = await readJson<PasswordBody>(request);
  const current = body?.current ?? '';
  const next = body?.next ?? '';
  if (!(await verifyPassword(current, user.password_hash))) {
    return failure(401, 'The current password does not match.');
  }
  if (next.length < MIN_PASSWORD) {
    return failure(400, `Passwords need at least ${String(MIN_PASSWORD)} characters.`);
  }
  await env.DB.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
    .bind(await hashPassword(next), new Date().toISOString(), user.id)
    .run();
  return json({ ok: true });
};
