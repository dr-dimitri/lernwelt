import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import InfoPanel from './InfoPanel';
import LearningTable from './LearningTable';

it('zeigt Zusatzinfos seitenweise und gibt den Fokus nach Escape zurück', async () => {
  const user = userEvent.setup();
  render(
    <InfoPanel paginate>
      <summary>Wissen entdecken</summary>
      <p>Erste Erklärung</p>
      <p>Zweite Erklärung</p>
    </InfoPanel>,
  );
  const trigger = screen.getByRole('button', { name: 'Wissen entdecken' });
  expect(screen.queryByText('Erste Erklärung')).not.toBeInTheDocument();
  await user.click(trigger);
  expect(screen.getByText('Erste Erklärung')).toBeVisible();
  expect(screen.queryByText('Zweite Erklärung')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Weiter →' }));
  expect(screen.getByText('Zweite Erklärung')).toBeVisible();
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { cancelable: true }),
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
it('macht sämtliche Tabellenzeilen durch Blättern erreichbar', async () => {
  const user = userEvent.setup();
  render(
    <LearningTable
      table={{
        caption: 'Quadrate',
        headers: ['Zahl'],
        rows: Array.from({ length: 25 }, (_, i) => [String(i + 1)]),
        note: 'Alle Zahlen',
      }}
    />,
  );
  expect(screen.getByRole('cell', { name: '1', exact: true })).toBeVisible();
  for (let page = 0; page < 3; page++)
    await user.click(screen.getByRole('button', { name: 'Nächste Zeilen →' }));
  expect(screen.getByRole('cell', { name: '25' })).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Nächste Zeilen →' }),
  ).toBeDisabled();
});
