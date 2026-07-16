/**
 * Localized chrome strings — the interface around the atlas, not the
 * atlas itself. Content (strait names, notes, sources) stays in the
 * data layer; this foundation covers navigation, labels, and shell text
 * so new locales start here.
 */
export const LOCALES = ['en', 'ro'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const en = {
  tagline:
    "The definitive interactive atlas of the world's straits — the narrow waters where oceans meet and history turns.",
  'nav.explore': 'Explore',
  'nav.journeys': 'Journeys',
  'nav.map': 'Map',
  'nav.learn': 'Learn',
  'search.open': 'Search',
  'skip.content': 'Skip to content',
  'footer.line': "Fathom — {count} of the world's key straits, plotted for the curious.",
};

export type StringKey = keyof typeof en;

const ro: Record<StringKey, string> = {
  tagline:
    'Atlasul interactiv definitiv al strâmtorilor lumii — apele înguste unde oceanele se întâlnesc și istoria își schimbă cursul.',
  'nav.explore': 'Explorează',
  'nav.journeys': 'Călătorii',
  'nav.map': 'Hartă',
  'nav.learn': 'Învață',
  'search.open': 'Caută',
  'skip.content': 'Sari la conținut',
  'footer.line':
    'Fathom — {count} dintre strâmtorile-cheie ale lumii, cartografiate pentru cei curioși.',
};

export const STRINGS: Record<Locale, Record<StringKey, string>> = { en, ro };

/** Interpolates {name} placeholders with the provided values. */
export function formatString(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
