// Mix letters inside each word part. Punctuation and repeated letters retain their positions/counts.
export interface LetterTile {
  id: number;
  letter: string;
}
export function normalizeScrambleWord(word: string): string {
  return word.replace(/[‘’]/g, "'").replace(/[‑–]/g, '-').toLowerCase();
}
export function scrambleEligible(word: string): boolean {
  const canonical = normalizeScrambleWord(word);
  const letters = canonical.match(/[a-z]/g) ?? [];
  return (
    letters.length >= 3 &&
    letters.length <= 16 &&
    canonical.trim().split(/\s+/).length <= 3 &&
    /^[a-z '-]+$/.test(canonical) &&
    new Set(letters).size > 1 &&
    canonical
      .split(/[ '-]/)
      .some((part) => part.length >= 3 && new Set(part).size > 1)
  );
}
export function scrambleWord(
  word: string,
  random: () => number = Math.random,
): string {
  const canonical = normalizeScrambleWord(word);
  if (!scrambleEligible(word)) return canonical;
  for (let attempt = 0; attempt < 12; attempt++) {
    const mixed = canonical.replace(/[a-z]+/g, (part) => {
      if (part.length < 3) return part;
      const letters = [...part];
      for (let i = letters.length - 1; i > 0; i--) {
        const index = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
        [letters[i], letters[index]] = [letters[index], letters[i]];
      }
      return letters.join('');
    });
    if (mixed !== canonical) return mixed;
  }
  let changed = false;
  return canonical.replace(/[a-z]+/g, (part) => {
    if (changed || part.length < 3 || new Set(part).size < 2) return part;
    const letters = [...part];
    const index = letters.findIndex((letter) => letter !== letters[0]);
    [letters[0], letters[index]] = [letters[index], letters[0]];
    changed = true;
    return letters.join('');
  });
}
export function letterTiles(mixed: string): LetterTile[] {
  return [...mixed].flatMap((letter, id) =>
    /[a-z]/.test(letter) ? [{ id, letter }] : [],
  );
}
// Entered letters are inserted in the canonical slots; punctuation stays fixed.
export function assembleTiles(mixed: string, chosen: LetterTile[]): string {
  let index = 0;
  let result = '';
  for (const character of mixed) {
    if (/[a-z]/.test(character)) {
      if (index === chosen.length) break;
      result += chosen[index++].letter;
    } else result += character;
  }
  return result;
}
