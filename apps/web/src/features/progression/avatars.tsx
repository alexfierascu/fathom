import type { ReactNode } from 'react';

/**
 * The predefined avatar set: maritime marks drawn in the atlas's line
 * art, presented on a quiet disc. A custom portrait becomes available
 * at Navigator rank; until then, every captain sails under one of
 * these.
 */

export interface AvatarSpec {
  id: string;
  label: string;
  draw: ReactNode;
}

export const AVATARS: readonly AvatarSpec[] = [
  {
    id: 'helm',
    label: "Ship's wheel",
    draw: (
      <>
        <circle cx="24" cy="24" r="9" fill="none" />
        <circle cx="24" cy="24" r="3" fill="none" />
        <path d="M24 11v8M24 29v8M11 24h8M29 24h8M15 15l5 5M33 33l-5-5M33 15l-5 5M15 33l5-5" />
      </>
    ),
  },
  {
    id: 'compass',
    label: 'Compass rose',
    draw: (
      <>
        <circle cx="24" cy="24" r="11" fill="none" />
        <path d="M24 15l3 9-3 9-3-9z" />
        <path d="M15 24l9-3 9 3-9 3z" opacity="0.55" />
      </>
    ),
  },
  {
    id: 'anchor',
    label: 'Anchor',
    draw: (
      <>
        <circle cx="24" cy="15" r="3" fill="none" />
        <path d="M24 18v16M18 23h12" />
        <path d="M15 29c1 4 4.5 7 9 7s8-3 9-7l-3.5 1.5M15 29l3.5 1.5" />
      </>
    ),
  },
  {
    id: 'lighthouse',
    label: 'Lighthouse',
    draw: (
      <>
        <path d="M20.5 35l1.3-14h4.4L27.5 35z" />
        <path d="M21.2 21h5.6l-.8-4h-4z" />
        <path d="M17 16l4 1.6M31 16l-4 1.6M21.5 27h5M20.8 31.5h6.4" opacity="0.55" />
      </>
    ),
  },
  {
    id: 'gull',
    label: 'Gull over water',
    draw: (
      <>
        <path d="M14 20c3-3 6-3 8 0 2-3 5-3 8 0" />
        <path d="M13 30c2.5 1.5 4.5-1.5 7 0s4.5-1.5 7 0 4.5-1.5 7 0" opacity="0.55" />
      </>
    ),
  },
  {
    id: 'sextant',
    label: 'Sextant',
    draw: (
      <>
        <path d="M17 33a10 10 0 0 1 14 0" />
        <path d="M24 14 17 33M24 14l7 19M24 14v10" />
        <circle cx="24" cy="14" r="1.8" />
      </>
    ),
  },
  {
    id: 'burgee',
    label: 'Burgee pennant',
    draw: (
      <>
        <path d="M18 13v22" />
        <path d="M18 15h15l-6 5 6 5H18" />
        <path d="M22 20h4" opacity="0.55" />
      </>
    ),
  },
  {
    id: 'wave',
    label: 'The open sea',
    draw: (
      <>
        <path d="M12 27c3-6 7-6 10-2s7 4 10-2" />
        <path d="M14 33c2.5 1.5 4.5-1.5 7 0s4.5-1.5 7 0" opacity="0.55" />
        <circle cx="31" cy="16" r="3" fill="none" opacity="0.55" />
      </>
    ),
  },
];
