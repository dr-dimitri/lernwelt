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

export type TypingHand = 'left' | 'right';
export type TypingDigit = 'little' | 'ring' | 'middle' | 'index' | 'thumb';
export type TypingFingerId = `${TypingHand}-${TypingDigit}`;

export interface TypingFinger {
  id: TypingFingerId;
  digit: TypingDigit;
  keys: string;
  homeKey: string;
  name: string;
  hand: TypingHand;
}

/** One shared QWERTZ model for the written hint, keyboard and hand diagram. */
export const typingFingers: readonly TypingFinger[] = [
  {
    id: 'left-little',
    digit: 'little',
    keys: '1qay',
    homeKey: 'A',
    name: 'linker kleiner Finger',
    hand: 'left',
  },
  {
    id: 'left-ring',
    digit: 'ring',
    keys: '2wsx',
    homeKey: 'S',
    name: 'linker Ringfinger',
    hand: 'left',
  },
  {
    id: 'left-middle',
    digit: 'middle',
    keys: '3edc',
    homeKey: 'D',
    name: 'linker Mittelfinger',
    hand: 'left',
  },
  {
    id: 'left-index',
    digit: 'index',
    keys: '45rtfgvb',
    homeKey: 'F',
    name: 'linker Zeigefinger',
    hand: 'left',
  },
  {
    id: 'left-thumb',
    digit: 'thumb',
    keys: ' ',
    homeKey: 'Leertaste',
    name: 'linker Daumen',
    hand: 'left',
  },
  {
    id: 'right-index',
    digit: 'index',
    keys: '67zuhjnm',
    homeKey: 'J',
    name: 'rechter Zeigefinger',
    hand: 'right',
  },
  {
    id: 'right-middle',
    digit: 'middle',
    keys: '8ik,',
    homeKey: 'K',
    name: 'rechter Mittelfinger',
    hand: 'right',
  },
  {
    id: 'right-ring',
    digit: 'ring',
    keys: '9ol.',
    homeKey: 'L',
    name: 'rechter Ringfinger',
    hand: 'right',
  },
  {
    id: 'right-little',
    digit: 'little',
    keys: '0ßpüöä-',
    homeKey: 'Ö',
    name: 'rechter kleiner Finger',
    hand: 'right',
  },
  {
    id: 'right-thumb',
    digit: 'thumb',
    keys: ' ',
    homeKey: 'Leertaste',
    name: 'rechter Daumen',
    hand: 'right',
  },
];

export interface TypingKeyHint {
  key: string;
  label: string;
  finger: string;
  fingerId: TypingFingerId | null;
  choiceFingerIds: TypingFingerId[];
  shift: TypingHand | null;
  shiftFingerId: TypingFingerId | null;
}
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

export function typingKeyHint(character: string | null): TypingKeyHint | null {
  if (character === null) return null;
  if (character === ' ')
    return {
      key: 'space',
      label: 'Leertaste',
      finger: 'ein Daumen',
      fingerId: null,
      choiceFingerIds: typingFingers
        .filter((finger) => finger.digit === 'thumb')
        .map((finger) => finger.id),
      shift: null,
      shiftFingerId: null,
    };
  const lower = character.toLocaleLowerCase('de');
  const key = shifted[character] ?? lower;
  const finger =
    key.length === 1
      ? typingFingers.find((entry) => entry.keys.includes(key))
      : undefined;
  const capital = lower !== character || character in shifted;
  const shift =
    capital && finger ? (finger.hand === 'left' ? 'right' : 'left') : null;
  return {
    key,
    label: character,
    finger: finger?.name ?? 'Suche die Taste auf deiner Tastatur',
    fingerId: finger?.id ?? null,
    choiceFingerIds: [],
    shift,
    shiftFingerId: shift ? `${shift}-little` : null,
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
