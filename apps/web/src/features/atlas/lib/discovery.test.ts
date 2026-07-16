import { describe, expect, it } from 'vitest';

import { randomStrait, straitOfTheDay } from './discovery';

describe('straitOfTheDay', () => {
  it('picks deterministically for the current day', () => {
    expect(straitOfTheDay()?.id).toBe(straitOfTheDay()?.id);
  });
});

describe('randomStrait', () => {
  it('always lands on a charted strait', () => {
    const pick = randomStrait();
    expect(pick).toBeDefined();
    expect(pick?.name).toBeTruthy();
  });
});
