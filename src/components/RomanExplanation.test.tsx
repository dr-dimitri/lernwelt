import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import RomanExplanation from './RomanExplanation';

it('erreicht sämtliche kurzen Anleitungsseiten mit der Tastatur und startet nach dem Schließen wieder am Anfang', async () => {
  const user = userEvent.setup();
  render(<RomanExplanation />);
  await user.tab();
  const trigger = screen.getByRole('button', {
    name: 'Römische Zahlen verstehen',
  });
  expect(trigger).toHaveFocus();
  await user.keyboard('{Enter}');
  const guide = screen.getByRole('dialog', {
    name: 'Römische Zahlen verstehen',
  });
  expect(within(guide).getByText('Seite 1 von 7')).toBeVisible();
  expect(
    within(guide).getByRole('button', { name: '← Zurück' }),
  ).toBeDisabled();
  const headings = [
    'Lesen: Werte zusammenzählen',
    'Sechs Paare zum Abziehen',
    'Schreiben: die Zahl zerlegen',
    'Wiederholen und Lücken lassen',
    'Rechnen: erst übersetzen',
    'Unsere Übung für 4000–9999',
  ];
  for (const heading of headings) {
    const next = within(guide).getByRole('button', { name: 'Weiter →' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(within(guide).getByRole('heading', { name: heading })).toBeVisible();
    expect(within(guide).queryByRole('table')).not.toBeInTheDocument();
  }
  expect(
    within(guide).getByRole('button', { name: 'Weiter →' }),
  ).toBeDisabled();
  within(guide).getByRole('button', { name: '← Zurück' }).focus();
  await user.keyboard('{Enter}');
  expect(within(guide).getByText('Seite 6 von 7')).toBeVisible();
  fireEvent(guide, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByText('Seite 1 von 7')).toBeVisible();
  expect(
    screen.getByRole('table', { name: 'Die römischen Zeichen' }),
  ).toBeVisible();
});
