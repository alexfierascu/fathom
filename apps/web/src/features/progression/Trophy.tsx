import type { TrophyKind } from './engine';

/**
 * Collectible trophies: engraved maritime instruments in a brass
 * medallion, drawn as line art in the atlas's gold and teal. No emoji —
 * these are meant to feel like objects from a captain's cabinet.
 */

const STROKE = 'var(--accent-2)';
const SOFT = 'color-mix(in srgb, var(--accent-2) 55%, transparent)';

function glyph(kind: TrophyKind) {
  switch (kind) {
    case 'compass':
      return (
        <>
          <circle cx="32" cy="32" r="13" stroke={SOFT} fill="none" />
          <path d="M32 20 36 32 32 44 28 32Z" fill={STROKE} />
          <path d="M20 32 32 28 44 32 32 36Z" fill={SOFT} />
        </>
      );
    case 'sextant':
      return (
        <>
          <path d="M22 42 A14 14 0 0 1 42 42" stroke={STROKE} fill="none" />
          <path d="M32 20 22 42 M32 20 42 42 M32 20 32 34" stroke={STROKE} fill="none" />
          <circle cx="32" cy="20" r="2.4" fill={STROKE} />
        </>
      );
    case 'anchor':
      return (
        <>
          <circle cx="32" cy="21" r="3.5" stroke={STROKE} fill="none" />
          <path d="M32 24v18M25 30h14" stroke={STROKE} fill="none" />
          <path d="M22 37c1 5 5 8 10 8s9-3 10-8l-4 2M22 37l4 2" stroke={STROKE} fill="none" />
        </>
      );
    case 'wheel':
      return (
        <>
          <circle cx="32" cy="32" r="11" stroke={STROKE} fill="none" />
          <circle cx="32" cy="32" r="3.6" stroke={STROKE} fill="none" />
          <path
            d="M32 17v8M32 39v8M17 32h8M39 32h8M22 22l5.5 5.5M42 42l-5.5-5.5M42 22l-5.5 5.5M22 42l5.5-5.5"
            stroke={STROKE}
            fill="none"
          />
        </>
      );
    case 'star':
      return (
        <path
          d="M32 18l4 9 10 1-7.5 7 2.2 10L32 40l-8.7 5 2.2-10-7.5-7 10-1z"
          stroke={STROKE}
          fill="none"
        />
      );
    case 'flag':
      return (
        <>
          <path d="M25 18v28" stroke={STROKE} fill="none" />
          <path d="M25 20h16l-4 6 4 6H25" stroke={STROKE} fill="none" />
          <path d="M29 23h4M35 23h3" stroke={SOFT} fill="none" />
        </>
      );
    case 'insignia':
      return <path d="M24 24l8 6 8-6M24 31l8 6 8-6M24 38l8 6 8-6" stroke={STROKE} fill="none" />;
    case 'medal':
      return (
        <>
          <path d="M26 18l6 10 6-10" stroke={STROKE} fill="none" />
          <circle cx="32" cy="36" r="8" stroke={STROKE} fill="none" />
          <path
            d="M32 31l1.6 3.4 3.6.4-2.7 2.5.8 3.7-3.3-2-3.3 2 .8-3.7-2.7-2.5 3.6-.4z"
            fill={SOFT}
          />
        </>
      );
    case 'map':
      return (
        <>
          <path d="M20 22l8-3 8 3 8-3v22l-8 3-8-3-8 3z" stroke={STROKE} fill="none" />
          <path d="M28 19v22M36 22v22" stroke={SOFT} fill="none" />
          <path d="M23 30c3 1 5-2 8 0s6-1 9 1" stroke={SOFT} fill="none" strokeDasharray="2 2" />
        </>
      );
    case 'knot':
      return (
        <>
          <path d="M24 24c8 0 8 16 16 16M40 24c-8 0-8 16-16 16" stroke={STROKE} fill="none" />
          <path d="M22 24h4M38 24h4M22 40h4M38 40h4" stroke={SOFT} fill="none" />
        </>
      );
    case 'lighthouse':
      return (
        <>
          <path d="M28 44l1.6-18h4.8L36 44z" stroke={STROKE} fill="none" />
          <path d="M28.8 26h6.4l-1-5h-4.4z" stroke={STROKE} fill="none" />
          <path d="M24 20l5 2M40 20l-5 2M29 32h6M28.4 38h7.2" stroke={SOFT} fill="none" />
        </>
      );
    case 'telescope':
      return (
        <>
          <path d="M20 28l18-8 4 8-18 8z" stroke={STROKE} fill="none" />
          <path d="M38 20l4 8M26 34l-2 10M30 33l4 10" stroke={SOFT} fill="none" />
        </>
      );
  }
}

export function Trophy({
  kind,
  earned = true,
  size = 64,
}: {
  kind: TrophyKind;
  earned?: boolean;
  size?: number;
}) {
  return (
    <svg
      className={earned ? 'trophy is-earned' : 'trophy'}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="32" cy="32" r="29" className="trophy-ring" fill="none" />
      <circle cx="32" cy="32" r="25" className="trophy-ring trophy-ring--inner" fill="none" />
      {glyph(kind)}
    </svg>
  );
}
