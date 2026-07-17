import {
  ensureSchema,
  failure,
  json,
  normaliseEmail,
  randomToken,
  readJson,
  sha256Hex,
  type Env,
} from '../_shared';

interface ResetRequestBody {
  email?: string;
}

const RESET_MINUTES = 60;

async function sendResetEmail(env: Env, to: string, token: string, origin: string) {
  if (!env.RESEND_API_KEY) return;
  const link = `${origin}/profile?reset=${token}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESET_FROM ?? 'Fathom <onboarding@resend.dev>',
      to: [to],
      subject: 'Reset your Fathom password',
      text: `A password reset was requested for your Fathom captain's log.\n\nSet a new password here (the link is good for ${String(RESET_MINUTES)} minutes):\n${link}\n\nIf this wasn't you, ignore this message — nothing has changed.`,
    }),
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const body = await readJson<ResetRequestBody>(request);
  const email = normaliseEmail(body?.email ?? '');
  if (!email) return failure(400, 'An email address is required.');

  await ensureSchema(env.DB);
  const user = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`)
    .bind(email)
    .first<{ id: string }>();

  // The response never reveals whether the email is registered.
  if (user) {
    const token = randomToken();
    const expires = new Date(Date.now() + RESET_MINUTES * 60_000).toISOString();
    await env.DB.prepare(
      `INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
    )
      .bind(await sha256Hex(token), user.id, expires)
      .run();
    await sendResetEmail(env, email, token, new URL(request.url).origin);
    if (env.DEV_EXPOSE_RESET === '1') return json({ ok: true, devToken: token });
  }
  return json({ ok: true });
};
