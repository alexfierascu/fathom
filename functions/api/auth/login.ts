import {
  createSession,
  ensureSchema,
  failure,
  json,
  normaliseEmail,
  publicUser,
  readJson,
  SESSION_DAYS,
  sessionCookie,
  verifyPassword,
  type Env,
  type UserRow,
} from '../_shared';

interface LoginBody {
  email?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const body = await readJson<LoginBody>(request);
  const email = normaliseEmail(body?.email ?? '');
  const password = body?.password ?? '';
  if (!email || !password) return failure(400, 'Email and password are both required.');

  await ensureSchema(env.DB);
  const user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email)
    .first<UserRow>();
  // One message for both failures, so the endpoint never confirms
  // whether an email is registered.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return failure(401, 'That email and password do not match our log.');
  }

  const token = await createSession(env.DB, user.id);
  return json(
    { user: publicUser(user) },
    { headers: { 'set-cookie': sessionCookie(token, SESSION_DAYS * 86_400) } },
  );
};
