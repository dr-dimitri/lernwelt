import manifest from '../content/vocabulary-audio.json';

export type AudioCard = (typeof manifest.cards)[number];
export const vocabularyAudio = new Map(
  manifest.cards.map((card) => [card.id, card]),
);
export interface ListeningQuestion {
  card: AudioCard;
  choices: { id: string; label: string }[];
}
function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
const meanings = (card: AudioCard) =>
  new Set(
    [card.german, ...card.germanAnswers].flatMap((value) =>
      value.toLocaleLowerCase('de').split(/\s*\/\s*/),
    ),
  );
// Homophones found in the complete current word list, checked against the
// synthesizer's English phoneme output. Also exclude duplicate English text.
const homophones = [
  ['son', 'sun'],
  ['wear', 'where'],
  ['ate', 'eight'],
];
const spokenKey = (word: string) => {
  const normalized = word.trim().toLowerCase();
  return (
    homophones.find((group) => group.includes(normalized))?.[0] ?? normalized
  );
};

export function listeningChoices(
  card: AudioCard,
  candidates: AudioCard[],
  random = Math.random,
) {
  const usedMeanings = meanings(card);
  const usedSounds = new Set([spokenKey(card.english)]);
  const choices = [{ id: card.id, label: card.german }];
  for (const other of shuffle(candidates, random)) {
    const aliases = meanings(other);
    const sound = spokenKey(other.english);
    if (
      usedSounds.has(sound) ||
      [...aliases].some((alias) => usedMeanings.has(alias))
    )
      continue;
    choices.push({ id: other.id, label: other.german });
    aliases.forEach((alias) => usedMeanings.add(alias));
    usedSounds.add(sound);
    if (choices.length === 3) break;
  }
  return shuffle(choices, random);
}

// Listening is a voluntary practice game. It never writes progress or awards points.
export function createListeningRound(
  deck: string,
  random = Math.random,
): ListeningQuestion[] {
  const cards = manifest.cards.filter(
    (card) => deck === 'all' || card.deckId === deck,
  );
  return shuffle(cards, random)
    .slice(0, 3)
    .map((card) => ({
      card,
      choices: listeningChoices(card, cards, random),
    }));
}
