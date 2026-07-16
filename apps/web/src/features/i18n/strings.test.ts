import { LOCALES, STRINGS, formatString } from './strings';

describe('chrome strings', () => {
  it('every locale covers every key with a non-empty string', () => {
    const keys = Object.keys(STRINGS.en);
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(STRINGS[locale][key as keyof typeof STRINGS.en]).toBeTruthy();
      }
    }
  });

  it('locales keep the same placeholders as English', () => {
    const placeholders = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();
    for (const [key, template] of Object.entries(STRINGS.en)) {
      for (const locale of LOCALES) {
        expect(placeholders(STRINGS[locale][key as keyof typeof STRINGS.en])).toEqual(
          placeholders(template),
        );
      }
    }
  });
});

describe('formatString', () => {
  it('interpolates named values', () => {
    expect(formatString('{count} straits charted', { count: 59 })).toBe('59 straits charted');
  });

  it('leaves unknown placeholders intact', () => {
    expect(formatString('{count} of {total}', { count: 1 })).toBe('1 of {total}');
  });

  it('returns the template unchanged without values', () => {
    expect(formatString('plain text')).toBe('plain text');
  });
});
