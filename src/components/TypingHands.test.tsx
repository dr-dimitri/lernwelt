import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import TypingHands from './TypingHands';
import { typingKeyHint } from '../domain/typing';

it('zeigt beide Hände mit je fünf Fingern und erklärt Grundstellung und lockere Haltung', () => {
  const { container } = render(<TypingHands hint={null} />);
  expect(
    screen.getByRole('img', {
      name: /Grundstellung der Hände auf einer deutschen QWERTZ-Tastatur/,
    }),
  ).toBeVisible();
  expect(container.querySelectorAll('[data-finger^="left-"]')).toHaveLength(5);
  expect(container.querySelectorAll('[data-finger^="right-"]')).toHaveLength(5);
  expect(container.querySelectorAll('[data-status="rest"]')).toHaveLength(10);
  expect(
    screen.getByText('Links: A · S · D · F. Rechts: J · K · L · Ö.'),
  ).toBeVisible();
  expect(screen.getByText(/Handgelenke möglichst gerade/)).toBeVisible();
  expect(
    screen.getByText('Finger leicht gekrümmt, Hände frei beweglich.'),
  ).toBeVisible();
  expect(
    screen.getByRole('img', { name: /Seitenansicht: Handgelenk in Linie/ }),
  ).toBeVisible();
  expect(
    screen.getByText(/Gerade ist kein Finger/, {
      selector: '.typing-hand-activity',
    }),
  ).toBeVisible();
});

it('markiert den Finger und bei Großbuchstaben den kleinen Finger der gegenüberliegenden Hand', () => {
  const { container, rerender } = render(
    <TypingHands hint={typingKeyHint('F')} />,
  );
  expect(container.querySelector('[data-finger="left-index"]')).toHaveAttribute(
    'data-status',
    'active',
  );
  expect(
    container.querySelector('[data-finger="right-little"]'),
  ).toHaveAttribute('data-status', 'shift');
  expect(container.querySelectorAll('[data-status="active"]')).toHaveLength(1);
  expect(
    screen.getByText(
      /linker Zeigefinger; dazu rechter kleiner Finger für Shift/,
      { selector: '.typing-hand-activity' },
    ),
  ).toBeVisible();
  rerender(<TypingHands hint={typingKeyHint('Ä')} correcting />);
  expect(
    container.querySelector('[data-finger="right-little"]'),
  ).toHaveAttribute('data-status', 'active');
  expect(
    container.querySelector('[data-finger="left-little"]'),
  ).toHaveAttribute('data-status', 'shift');
  expect(
    screen.getByText(/Zum Verbessern: rechter kleiner Finger/, {
      selector: '.typing-hand-activity',
    }),
  ).toBeVisible();
});

it('kennzeichnet beide Daumen ausdrücklich als Wahl und zeigt bei unbekannten Zeichen eine neutrale Hand', () => {
  const { container, rerender } = render(
    <TypingHands hint={typingKeyHint(' ')} />,
  );
  expect(container.querySelectorAll('[data-status="choice"]')).toHaveLength(2);
  expect(
    container.querySelectorAll('[data-status="active"], [data-status="shift"]'),
  ).toHaveLength(0);
  expect(
    screen.getByText(/drücke nur mit einem Daumen/, {
      selector: '.typing-hand-activity',
    }),
  ).toBeVisible();
  rerender(<TypingHands hint={typingKeyHint('é')} />);
  expect(container.querySelectorAll('[data-status="rest"]')).toHaveLength(10);
  expect(
    screen.getByText(/keine Fingerzuordnung/, {
      selector: '.typing-hand-activity',
    }),
  ).toBeVisible();
});
