import { useEffect, useRef, useState } from 'react';

import { THEME_KEYS, THEMES, type ThemeKey } from './themes';

interface ThemeSwitcherProps {
  theme: ThemeKey;
  onChange: (theme: ThemeKey) => void;
}

/**
 * One quiet control instead of a row of swatches: the button wears the
 * active theme's colors; the four themes live in a small menu that
 * appears only when asked for.
 */
export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onAway = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onAway);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onAway);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="theme-switcher" ref={rootRef}>
      <button
        type="button"
        className="control-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${THEMES[theme].label}`}
        title={`Theme: ${THEMES[theme].label}`}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className={`theme-dot theme-dot--${theme}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="theme-menu" role="menu" aria-label="Choose a color theme">
          {THEME_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === theme}
              className="theme-option"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            >
              <span className={`theme-dot theme-dot--${key}`} aria-hidden="true" />
              {THEMES[key].label}
              {key === theme && (
                <span className="theme-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
