import { parseAyahRef } from '../src/utils/parseAyahRef';

describe('parseAyahRef', () => {
  it('parses colon reference', () => {
    expect(parseAyahRef('13:28')).toEqual({ surahId: 13, verseId: 28 });
    expect(parseAyahRef('2:186')).toEqual({ surahId: 2, verseId: 186 });
    expect(parseAyahRef('94:5-6')).toEqual({ surahId: 94, verseId: 5 });
  });

  it('handles whitespace padding', () => {
    expect(parseAyahRef('  97 : 5')).toEqual({ surahId: 97, verseId: 5 });
  });

  it('returns null for invalid inputs', () => {
    expect(parseAyahRef(null)).toBeNull();
    expect(parseAyahRef(undefined)).toBeNull();
    expect(parseAyahRef('Ra\'d')).toBeNull();
    expect(parseAyahRef('0:1')).toBeNull();
    expect(parseAyahRef('115:1')).toBeNull();
    expect(parseAyahRef('1:0')).toBeNull();
  });
});
