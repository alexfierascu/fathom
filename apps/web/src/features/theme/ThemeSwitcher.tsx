import { THEME_KEYS, THEMES, type ThemeKey } from './themes';

interface ThemeSwitcherProps {
  theme: ThemeKey;
  onChange: (theme: ThemeKey) => void;
}

export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher">
      <span className="label">THEME</span>
      <div className="swatches" role="group" aria-label="Choose a color theme">
        {THEME_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`swatch swatch--${key}`}
            aria-pressed={key === theme}
            aria-label={`${THEMES[key].label} theme`}
            title={THEMES[key].label}
            onClick={() => {
              onChange(key);
            }}
          />
        ))}
      </div>
    </div>
  );
}
