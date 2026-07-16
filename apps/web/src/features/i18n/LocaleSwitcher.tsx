import { useLocale } from './locale';
import { LOCALES } from './strings';

/** Compact locale toggle for the header controls. */
export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="locale-switcher" role="group" aria-label="Language">
      {LOCALES.map((candidate) => (
        <button
          key={candidate}
          type="button"
          className={candidate === locale ? 'locale-btn is-active' : 'locale-btn'}
          aria-pressed={candidate === locale}
          onClick={() => {
            setLocale(candidate);
          }}
        >
          {candidate.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
