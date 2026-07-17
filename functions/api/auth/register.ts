import {
  createSession,
  EMAIL_PATTERN,
  ensureSchema,
  failure,
  hashPassword,
  json,
  MIN_PASSWORD,
  normaliseEmail,
  publicUser,
  readJson,
  SESSION_DAYS,
  sessionCookie,
  type Env,
  type UserRow,
} from '../_shared';

interface RegisterBody {
  email?: string;
  password?: string;
  name?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const body = await readJson<RegisterBody>(request);
  const email = normaliseEmail(body?.email ?? '');
  const password = body?.password ?? '';
  const name = (body?.name ?? '').trim().slice(0, 40);
  if (!EMAIL_PATTERN.test(email)) return failure(400, 'That email address does not look right.');
  if (password.length < MIN_PASSWORD) {
    return failure(400, `Passwords need at least ${String(MIN_PASSWORD)} characters.`);
  }

  await ensureSchema(env.DB);
  const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`)
    .bind(email)
    .first();
  if (existing) return failure(409, 'An account already sails under that email.');

  const now = new Date().toISOString();
  const user: UserRow = {
    id: crypto.randomUUID(),
    email,
    password_hash: await hashPassword(password),
    name,
    bio: '',
    avatar: 'helm',
    portrait: null,
    created_at: now,
    updated_at: now,
  };
  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, name, bio, avatar, portrait, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      user.id,
      user.email,
      user.password_hash,
      user.name,
      user.bio,
      user.avatar,
      user.portrait,
      user.created_at,
      user.updated_at,
    )
    .run();

  const token = await createSession(env.DB, user.id);
  return json(
    { user: publicUser(user) },
    { status: 201, headers: { 'set-cookie': sessionCookie(token, SESSION_DAYS * 86_400) } },
  );
};
