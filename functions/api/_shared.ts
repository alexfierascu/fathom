/**
 * Shared plumbing for the account API: environment shape, password
 * hashing, session cookies, and the runtime-applied schema. Files
 * starting with an underscore are not routed by Cloudflare Pages.
 */

export interface Env {
  DB: D1Database;
  /** When set, password-reset emails go out through Resend. */
  RESEND_API_KEY?: string;
  /** Sender for reset emails, e.g. "Fathom <log@fathom-atlas.pages.dev>". */
  RESET_FROM?: string;
  /** Local development only: include the reset token in the response. */
  DEV_EXPOSE_RESET?: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  bio: string;
  avatar: string;
  portrait: string | null;
  created_at: string;
  updated_at: string;
}

/** The user as the client sees it — never the hash. */
export const publicUser = (user: UserRow) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  bio: user.bio,
  avatar: user.avatar,
  portrait: user.portrait ?? undefined,
  createdAt: user.created_at,
});

// ---------------------------------------------------------------------------
// Responses

export const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...init?.headers },
  });

export const failure = (status: number, message: string) => json({ error: message }, { status });

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.json<T>();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Schema — applied lazily so a freshly bound database just works.

let schemaReady = false;

export async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL DEFAULT '',
        avatar TEXT NOT NULL DEFAULT 'helm',
        portrait TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)`),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS password_resets (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS progress (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, key)
      )`,
    ),
  ]);
  schemaReady = true;
}

// ---------------------------------------------------------------------------
// Passwords — PBKDF2-SHA-256 via Web Crypto, the strongest KDF the
// Workers runtime offers natively. Format: pbkdf2:iterations:salt:hash.

const ITERATIONS = 100_000;
const encoder = new TextEncoder();

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (text: string) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2:${String(ITERATIONS)}:${toB64(salt)}:${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, saltB64, hashB64] = stored.split(':');
  if (scheme !== 'pbkdf2' || !iterations || !saltB64 || !hashB64) return false;
  const expected = fromB64(hashB64);
  const actual = await derive(password, fromB64(saltB64), Number(iterations));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual[i]! ^ expected[i]!;
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Tokens and sessions

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toB64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const SESSION_COOKIE = 'fathom_session';
export const SESSION_DAYS = 30;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

export const sessionCookie = (token: string, maxAgeSeconds: number) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${String(maxAgeSeconds)}`;

export async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db
    .prepare(`INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(await sha256Hex(token), userId, now.toISOString(), expires.toISOString())
    .run();
  return token;
}

export async function sessionUser(request: Request, env: Env): Promise<UserRow | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  await ensureSchema(env.DB);
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(await sha256Hex(token), new Date().toISOString())
    .first<UserRow>();
  return row ?? null;
}

export async function destroySession(request: Request, env: Env): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`)
    .bind(await sha256Hex(token))
    .run();
}

// ---------------------------------------------------------------------------
// Validation

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export const normaliseEmail = (email: string) => email.trim().toLowerCase();
