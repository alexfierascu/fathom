import { parseViewParam } from './map';

describe('parseViewParam', () => {
  it('parses a valid view value', () => {
    expect(parseViewParam('35.95,-5.59,7')).toEqual({ center: [35.95, -5.59], zoom: 7 });
  });

  it('clamps zoom to the map limits', () => {
    expect(parseViewParam('0,0,99')?.zoom).toBe(18);
    expect(parseViewParam('0,0,0')?.zoom).toBe(2);
  });

  it('rejects malformed or out-of-range values', () => {
    expect(parseViewParam(null)).toBeNull();
    expect(parseViewParam('')).toBeNull();
    expect(parseViewParam('abc')).toBeNull();
    expect(parseViewParam('1,2')).toBeNull();
    expect(parseViewParam('120,0,5')).toBeNull();
    expect(parseViewParam('10,NaN,5')).toBeNull();
  });
});
