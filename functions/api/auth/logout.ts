import { destroySession, failure, json, sessionCookie, type Env } from '../_shared';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  await destroySession(request, env);
  return json({ ok: true }, { headers: { 'set-cookie': sessionCookie('', 0) } });
};
