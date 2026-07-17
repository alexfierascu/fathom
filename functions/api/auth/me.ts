import { failure, json, publicUser, sessionUser, type Env } from '../_shared';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return failure(503, 'Accounts are not configured on this deployment.');
  const user = await sessionUser(request, env);
  if (!user) return failure(401, 'Not signed in.');
  return json({ user: publicUser(user) });
};
