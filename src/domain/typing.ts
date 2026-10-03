import type { Difficulty, Wallet } from './learning';

export interface TypingTask {
  id: string;
  difficulty: Difficulty;
  text: string;
  solved: boolean;
}

export interface TypingStation {
  id: string;
  title: string;
  description: string;
  newKeys: string[];
  tip: string;
  tasks: TypingTask[];
}

export interface TypingState {
  profileReady: boolean;
  difficulty: Difficulty;
  wallet: Wallet;
  stations: TypingStation[];
}

export interface TypingInput {
  requestId: string;
  taskId: string;
  answer: string;
}

export interface TypingResult {
  correct: boolean;
  pointsAwarded: number;
  wallet: Wallet;
}

/** A visual aid only. The desktop checks the complete submitted line. */
export function typingProgress(text: string, answer: string) {
  let prefix = 0;
  while (prefix < text.length && text[prefix] === answer[prefix]) prefix++;
  return {
    prefix,
    mistake: prefix < answer.length,
    next: prefix < text.length ? text[prefix] : null,
    complete: prefix === text.length && answer.length === text.length,
  };
}

const fingers = [
  { keys: '1qay', name: 'linker kleiner Finger', hand: 'left' },
  { keys: '2wsx', name: 'linker Ringfinger', hand: 'left' },
  { keys: '3edc', name: 'linker Mittelfinger', hand: 'left' },
  { keys: '45rtfgvb', name: 'linker Zeigefinger', hand: 'left' },
  { keys: '67zuhjnm', name: 'rechter Zeigefinger', hand: 'right' },
  { keys: '8ik,', name: 'rechter Mittelfinger', hand: 'right' },
  { keys: '9ol.', name: 'rechter Ringfinger', hand: 'right' },
  { keys: '0ßpüöä-', name: 'rechter kleiner Finger', hand: 'right' },
] as const;
const shifted: Record<string, string> = {
  '!': '1',
  '"': '2',
  '§': '3',
  $: '4',
  '%': '5',
  '&': '6',
  '/': '7',
  '(': '8',
  ')': '9',
  '=': '0',
  '?': 'ß',
  ';': ',',
  ':': '.',
  _: '-',
};

export function typingKeyHint(character: string | null) {
  if (character === null) return null;
  if (character === ' ')
    return {
      key: 'space',
      label: 'Leertaste',
      finger: 'ein Daumen',
      shift: null,
    };
  const lower = character.toLocaleLowerCase('de');
  const key = shifted[character] ?? lower;
  const finger = fingers.find((entry) => entry.keys.includes(key));
  const capital = lower !== character || character in shifted;
  const shift =
    capital && finger ? (finger.hand === 'left' ? 'right' : 'left') : null;
  return {
    key,
    label: character,
    finger: finger?.name ?? 'Suche die Taste auf deiner Tastatur',
    shift,
  };
}

export const typingKeyboardRows = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', 'backspace'],
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
  [
    'shift-left',
    'y',
    'x',
    'c',
    'v',
    'b',
    'n',
    'm',
    ',',
    '.',
    '-',
    'shift-right',
  ],
  ['space'],
];
