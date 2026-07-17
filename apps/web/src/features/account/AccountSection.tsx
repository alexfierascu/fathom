import { useEffect, useState, type FormEvent } from 'react';

import { useSearchParams } from 'react-router';

import { Section } from '../atlas/components/Section';
import { loadIdentity, saveIdentity } from '../progression/store';
import { accountApi, ApiError, type AccountUser } from './api';
import { syncLog } from './sync';

/**
 * The account panel on the Captain's Log. Everything works without an
 * account; signing in adds one thing — the log follows you between
 * ships. So the panel is quiet: one card, plain words, no upsell.
 */

type Status =
  | { state: 'loading' }
  | { state: 'unavailable' }
  | { state: 'out' }
  | { state: 'in'; user: AccountUser };

/** Adopt the freshly signed-in account into the local identity. */
function adoptIdentity(user: AccountUser) {
  const local = loadIdentity();
  saveIdentity({
    name: user.name || local.name,
    bio: user.bio || local.bio,
    avatar: user.avatar || local.avatar,
    portrait: user.portrait ?? local.portrait,
  });
}

function FieldRow({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="identity-field">
      <span className="geo-label">{label}</span>
      <input
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}

export function AccountSection({ onSignedChange }: { onSignedChange?: () => void }) {
  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('reset');

  useEffect(() => {
    let cancelled = false;
    accountApi
      .me()
      .then(({ user }) => {
        if (!cancelled) setStatus({ state: 'in', user });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const unavailable =
          error instanceof ApiError && (error.status === 503 || error.status === 0);
        setStatus(unavailable ? { state: 'unavailable' } : { state: 'out' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [adoptedReset, setAdoptedReset] = useState<string | null>(null);
  if (resetToken && adoptedReset !== resetToken) {
    setAdoptedReset(resetToken);
    setMode('reset');
  }

  const finishSignIn = async (user: AccountUser) => {
    adoptIdentity(user);
    try {
      const { pulled } = await syncLog();
      setSyncNote(pulled > 0 ? 'Log merged from your account.' : 'Log synced.');
    } catch {
      setSyncNote('Signed in; the log will sync next time.');
    }
    setStatus({ state: 'in', user });
    setPassword('');
    setMessage(null);
    onSignedChange?.();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const run = async () => {
      if (mode === 'register') {
        const { user } = await accountApi.register(email, password, loadIdentity().name);
        await accountApi.updateProfile({
          name: loadIdentity().name,
          bio: loadIdentity().bio,
          avatar: loadIdentity().avatar,
        });
        await finishSignIn(user);
      } else if (mode === 'login') {
        const { user } = await accountApi.login(email, password);
        await finishSignIn(user);
      } else if (mode === 'forgot') {
        await accountApi.requestReset(email);
        setMessage('If that address is in our log, a reset link is on its way.');
      } else if (mode === 'reset' && resetToken) {
        await accountApi.reset(resetToken, password);
        setSearchParams({}, { replace: true });
        setMode('login');
        setMessage('Password changed — sign in with the new one.');
        setPassword('');
      }
    };
    run()
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Something went wrong.');
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const signOut = () => {
    setBusy(true);
    accountApi
      .logout()
      .catch(() => undefined)
      .finally(() => {
        setBusy(false);
        setSyncNote(null);
        setStatus({ state: 'out' });
        onSignedChange?.();
      });
  };

  const syncNow = () => {
    setBusy(true);
    syncLog()
      .then(({ pulled, pushed }) => {
        setSyncNote(
          pulled > 0
            ? 'Log merged from your account.'
            : `Log synced (${String(pushed)} entries safe aboard).`,
        );
        onSignedChange?.();
      })
      .catch((error: unknown) => {
        setSyncNote(error instanceof Error ? error.message : 'Sync failed.');
      })
      .finally(() => {
        setBusy(false);
      });
  };

  if (status.state === 'loading') return null;
  if (status.state === 'unavailable') return null;

  if (status.state === 'in') {
    return (
      <Section label="Account">
        <div className="account-card">
          <p className="note">
            Signed in as <b>{status.user.email}</b>. The log follows you — sign in on any ship and
            the voyages merge.
          </p>
          {syncNote && <p className="note account-note">{syncNote}</p>}
          <div className="journey-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="journey-btn" disabled={busy} onClick={syncNow}>
              Sync now
            </button>
            <button type="button" className="journey-btn" disabled={busy} onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section label="Account">
      <div className="account-card">
        <p className="note">
          The log lives in this browser. With an account it follows you — every voyage, trophy, and
          favourite, merged across ships.
        </p>
        <form className="account-form" onSubmit={submit}>
          {mode !== 'reset' && (
            <FieldRow
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          )}
          {(mode === 'login' || mode === 'register') && (
            <FieldRow
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          )}
          {mode === 'reset' && (
            <FieldRow
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          )}
          {message && <p className="note account-note">{message}</p>}
          <div className="journey-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="journey-btn journey-btn--primary" disabled={busy}>
              {mode === 'login'
                ? 'Sign in'
                : mode === 'register'
                  ? 'Create account'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : 'Set new password'}
            </button>
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  className="journey-btn"
                  onClick={() => {
                    setMode('register');
                    setMessage(null);
                  }}
                >
                  Create account
                </button>
                <button
                  type="button"
                  className="account-linkish"
                  onClick={() => {
                    setMode('forgot');
                    setMessage(null);
                  }}
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button
                type="button"
                className="account-linkish"
                onClick={() => {
                  setMode('login');
                  setMessage(null);
                }}
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </Section>
  );
}
