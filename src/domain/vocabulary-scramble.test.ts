import { expect, it } from 'vitest';
import {
  assembleTiles,
  letterTiles,
  scrambleEligible,
  scrambleWord,
} from './vocabulary-scramble';

it.each(['apple', 'school', 'letter', 'exercise book', 'T-shirt', 'o’clock'])(
  'mischt %s mit vollständigem Buchstabenbestand und festen Trennzeichen',
  (word) => {
    const canonical = word.toLowerCase().replace('’', "'");
    for (const random of [() => 0, () => 0.999999, () => 0.5]) {
      const mixed = scrambleWord(word, random);
      expect(mixed).not.toBe(canonical);
      expect([...mixed].sort()).toEqual([...canonical].sort());
      [...canonical].forEach((character, index) => {
        if (!/[a-z]/.test(character)) expect(mixed[index]).toBe(character);
      });
    }
  },
);
it.each([
  'PE',
  'I',
  'go',
  'aaaa',
  'ab cd',
  '012',
  'a b c desk',
  'seventeenletterslong',
])('überspringt ungeeignetes %s', (word) => {
  expect(scrambleEligible(word)).toBe(false);
});
it('behält doppelte Buchstaben als einzelne Karten und fügt feste Worttrenner beim Tippen der Kärtchen ein', () => {
  const tiles = letterTiles('papel');
  expect(tiles.filter((tile) => tile.letter === 'p')).toHaveLength(2);
  expect(new Set(tiles.map((tile) => tile.id)).size).toBe(5);
  const group = letterTiles('koob gap');
  expect(
    assembleTiles('koob gap', [
      group[3],
      group[2],
      group[1],
      group[0],
      group[4],
      group[5],
      group[6],
    ]),
  ).toBe('book gap');
});
