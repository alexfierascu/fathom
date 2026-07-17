/**
 * The account API client. Every call goes to the same-origin Pages
 * Functions; the session rides in an HttpOnly cookie, so there is no
 * token handling here. A deployment without the D1 binding answers
 * 503 — surfaced as "accounts unavailable" and the atlas sails on
 * local-only.
 */

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatar: string;
  portrait?: string;
  createdAt: string;
}

export interface ProgressEntry {
  value: string;
  updatedAt: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      credentials: 'same-origin',
      headers: init?.body ? { 'content-type': 'application/json' } : undefined,
      ...init,
    });
  } catch {
    throw new ApiError(0, 'The tide is out — check your connection and try again.');
  }
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Something went wrong on the server.');
  }
  // A static-only deployment answers API paths with the SPA's HTML;
  // that is "no accounts here", not a signed-out user.
  if (data === null) throw new ApiError(503, 'Accounts are unavailable on this deployment.');
  return data;
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const accountApi = {
  register: (email: string, password: string, name: string) =>
    call<{ user: AccountUser }>('auth/register', post({ email, password, name })),
  login: (email: string, password: string) =>
    call<{ user: AccountUser }>('auth/login', post({ email, password })),
  logout: () => call<{ ok: boolean }>('auth/logout', { method: 'POST' }),
  me: () => call<{ user: AccountUser }>('auth/me'),
  updateProfile: (patch: {
    name?: string;
    bio?: string;
    avatar?: string;
    portrait?: string | null;
  }) =>
    call<{ user: AccountUser }>('auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  changePassword: (current: string, next: string) =>
    call<{ ok: boolean }>('auth/password', post({ current, next })),
  requestReset: (email: string) =>
    call<{ ok: boolean; devToken?: string }>('auth/reset-request', post({ email })),
  reset: (token: string, password: string) =>
    call<{ ok: boolean }>('auth/reset', post({ token, password })),
  pullProgress: () => call<{ entries: Record<string, ProgressEntry> }>('progress'),
  pushProgress: (entries: Record<string, ProgressEntry>) =>
    call<{ ok: boolean; stored: number }>('progress', {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    }),
};
