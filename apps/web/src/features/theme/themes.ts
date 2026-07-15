export const THEME_KEYS = ['abyss', 'parchment', 'midnight', 'daylight'] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

export type TileStyle = 'dark' | 'light';

export interface ThemeConfig {
  readonly label: string;
  readonly tile: TileStyle;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  abyss: { label: 'Abyss', tile: 'dark' },
  parchment: { label: 'Parchment', tile: 'light' },
  midnight: { label: 'Midnight', tile: 'dark' },
  daylight: { label: 'Daylight', tile: 'light' },
};

export const DEFAULT_THEME: ThemeKey = 'abyss';
