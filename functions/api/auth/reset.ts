import {
  ensureSchema,
  failure,
  hashPassword,
  json,
  MIN_PASSWORD,
  readJson,
  sha256Hex,
  type Env,
} from '../_shared';

interface ResetBody {
  token?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const body = await readJson<ResetBody>(request);
  const token = body?.token ?? '';
  const password = body?.password ?? '';
  if (!token) return failure(400, 'A reset token is required.');
  if (password.length < MIN_PASSWORD) {
    return failure(400, `Passwords need at least ${String(MIN_PASSWORD)} characters.`);
  }

  await ensureSchema(env.DB);
  const tokenHash = await sha256Hex(token);
  const reset = await env.DB.prepare(
    `SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > ?`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first<{ user_id: string }>();
  if (!reset) return failure(400, 'That reset link has expired or was already used.');

  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).bind(
      await hashPassword(password),
      new Date().toISOString(),
      reset.user_id,
    ),
    // A reset invalidates every outstanding token and session.
    env.DB.prepare(`DELETE FROM password_resets WHERE user_id = ?`).bind(reset.user_id),
    env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(reset.user_id),
  ]);
  return json({ ok: true });
};
