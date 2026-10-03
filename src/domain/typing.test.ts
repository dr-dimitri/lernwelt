import { expect, it } from 'vitest';
import { typingFingers, typingKeyHint, typingProgress } from './typing';

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

it('liefert die Grundstellung und aktive Finger aus demselben Modell für beide Hände', () => {
  expect(
    typingFingers
      .filter((finger) => finger.hand === 'left')
      .map((finger) => finger.homeKey),
  ).toEqual(['A', 'S', 'D', 'F', 'Leertaste']);
  expect(
    typingFingers
      .filter((finger) => finger.hand === 'right')
      .map((finger) => finger.homeKey),
  ).toEqual(['J', 'K', 'L', 'Ö', 'Leertaste']);
  for (const finger of typingFingers.filter(
    (finger) => finger.digit !== 'thumb',
  )) {
    for (const key of finger.keys) {
      expect(typingKeyHint(key)).toMatchObject({
        fingerId: finger.id,
        finger: finger.name,
      });
    }
  }
  expect(typingKeyHint('F')).toMatchObject({
    fingerId: 'left-index',
    shiftFingerId: 'right-little',
  });
  expect(typingKeyHint('Ä')).toMatchObject({
    fingerId: 'right-little',
    shiftFingerId: 'left-little',
  });
  expect(typingKeyHint(';')).toMatchObject({
    fingerId: 'right-middle',
    shiftFingerId: 'left-little',
  });
});

it('bietet bei Leerzeichen die Wahl eines Daumens und erfindet bei unbekannten Zeichen keine Fingerzuordnung', () => {
  expect(typingKeyHint(' ')).toMatchObject({
    fingerId: null,
    choiceFingerIds: ['left-thumb', 'right-thumb'],
    shiftFingerId: null,
  });
  expect(typingKeyHint(null)).toBeNull();
  for (const unknown of ['é', '🚀', '', 'fj']) {
    expect(typingKeyHint(unknown)).toMatchObject({
      fingerId: null,
      choiceFingerIds: [],
      shift: null,
      shiftFingerId: null,
    });
  }
});
