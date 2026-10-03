import { expect, it } from 'vitest';
import { typingKeyHint, typingProgress } from './typing';

it('unterscheidet bei der Zeilenhilfe Großschreibung, Leerzeichen und zusätzliche Zeichen', () => {
  expect(typingProgress('F j', 'f j')).toMatchObject({
    prefix: 0,
    mistake: true,
    next: 'F',
    complete: false,
  });
  expect(typingProgress('f j', 'f ')).toMatchObject({
    prefix: 2,
    mistake: false,
    next: 'j',
    complete: false,
  });
  expect(typingProgress('f j', 'f jx')).toMatchObject({
    prefix: 3,
    mistake: true,
    next: null,
    complete: false,
  });
  expect(typingProgress('f j', 'f j')).toMatchObject({
    complete: true,
    mistake: false,
    next: null,
  });
});

it('ordnet deutsche QWERTZ-Zeichen und Shift der gegenüberliegenden Hand zu', () => {
  expect(typingKeyHint('z')).toMatchObject({
    key: 'z',
    finger: 'rechter Zeigefinger',
    shift: null,
  });
  expect(typingKeyHint('y')).toMatchObject({
    key: 'y',
    finger: 'linker kleiner Finger',
    shift: null,
  });
  expect(typingKeyHint('Ä')).toMatchObject({
    key: 'ä',
    finger: 'rechter kleiner Finger',
    shift: 'left',
  });
  expect(typingKeyHint('F')).toMatchObject({
    key: 'f',
    finger: 'linker Zeigefinger',
    shift: 'right',
  });
  expect(typingKeyHint('!')).toMatchObject({ key: '1', shift: 'right' });
  expect(typingKeyHint('?')).toMatchObject({ key: 'ß', shift: 'left' });
  expect(typingKeyHint(' ')).toMatchObject({
    key: 'space',
    finger: 'ein Daumen',
    shift: null,
  });
});
