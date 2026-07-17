import { useEffect, useMemo, useRef, useState } from 'react';

import { Link } from 'react-router';

import { useLocale, useT } from '../i18n/locale';
import { LOCALES, type Locale, type StringKey } from '../i18n/strings';
import { Avatar } from '../progression/Avatar';
import { loadIdentity, type Identity } from '../progression/store';
import {
  appearanceToTheme,
  loadAppearance,
  saveAppearance,
  type Appearance,
} from '../theme/appearance';
import type { ThemeKey } from '../theme/themes';

/**
 * The single user menu — one avatar that opens a glass panel holding
 * everything personal and every preference: identity, appearance,
 * language, and the ways into the captain's log. Shared by the launcher
 * and the global navigation so those controls live in exactly one place.
 */

const APPEARANCE_KEY: Record<Appearance, StringKey> = {
  system: 'home.profile.system',
  dark: 'home.profile.dark',
  light: 'home.profile.light',
};
const LOCALE_KEY: Record<Locale, StringKey> = {
  en: 'home.profile.english',
  ro: 'home.profile.romanian',
};

function UserMenuPanel({
  identity,
  theme,
  setTheme,
  onClose,
}: {
  identity: Identity;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [appearance, setAppearanceState] = useState<Appearance>(loadAppearance);

  const chooseAppearance = (mode: Appearance) => {
    setAppearanceState(mode);
    saveAppearance(mode);
    setTheme(appearanceToTheme(mode));
  };

  // Appearance dots reflect the real theme even if it changed elsewhere.
  const isLight = theme === 'parchment' || theme === 'daylight';
  const activeAppearance: Appearance =
    appearance === 'system' ? 'system' : isLight ? 'light' : 'dark';

  return (
    <div className="profile-menu" role="menu" aria-label={t('home.profile.identity')}>
      <Link viewTransition className="profile-identity" to="/profile" onClick={onClose}>
        <span className="profile-avatar">
          <Avatar identity={identity} size={54} />
          <span className="avatar-status avatar-status--offline" aria-hidden="true" />
        </span>
        <div className="geo-label">{t('home.profile.identity')}</div>
        <b>{identity.name || t('home.profile.guest')}</b>
        <span className="profile-sub">{t('home.profile.sailor')}</span>
        <span className="profile-rank">{t('home.profile.rank')}</span>
      </Link>

      <div className="profile-section">
        <div className="geo-label">{t('home.profile.appearance')}</div>
        <div className="profile-radios" role="group" aria-label={t('home.profile.appearance')}>
          {(['system', 'dark', 'light'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="menuitemradio"
              aria-checked={activeAppearance === mode}
              className={activeAppearance === mode ? 'profile-radio is-on' : 'profile-radio'}
              onClick={() => {
                chooseAppearance(mode);
              }}
            >
              <span className="radio-dot" aria-hidden="true" />
              {t(APPEARANCE_KEY[mode])}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-section">
        <div className="geo-label">{t('home.profile.language')}</div>
        <div className="profile-radios" role="group" aria-label={t('home.profile.language')}>
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={locale === code}
              className={locale === code ? 'profile-radio is-on' : 'profile-radio'}
              onClick={() => {
                setLocale(code);
              }}
            >
              <span className="radio-dot" aria-hidden="true" />
              {t(LOCALE_KEY[code])}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-links">
        <Link viewTransition role="menuitem" to="/profile" onClick={onClose}>
          {t('home.profile.statistics')}
        </Link>
        <Link viewTransition role="menuitem" to="/profile" onClick={onClose}>
          {t('home.profile.achievements')}
        </Link>
        <Link viewTransition role="menuitem" to="/profile" onClick={onClose}>
          {t('home.profile.settings')}
        </Link>
        <Link viewTransition role="menuitem" to="/profile" onClick={onClose}>
          {t('home.profile.signin')}
        </Link>
      </div>

      <div className="profile-foot">{t('home.profile.soon')}</div>
    </div>
  );
}

export function UserMenuButton({
  theme,
  setTheme,
}: {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const identity = useMemo(() => loadIdentity(), []);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onDown = (event: globalThis.PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div className="avatar-wrap" ref={wrapRef}>
      <button
        type="button"
        className={open ? 'avatar-button is-open' : 'avatar-button'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('home.profile.open')}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className="avatar-shell">
          <Avatar identity={identity} size={34} />
          <span className="avatar-status avatar-status--offline" aria-hidden="true" />
        </span>
      </button>
      {open && (
        <UserMenuPanel
          identity={identity}
          theme={theme}
          setTheme={setTheme}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
