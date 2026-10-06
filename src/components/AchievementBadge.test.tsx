import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AchievementBadge from './AchievementBadge';
import { achievements } from '../domain/achievements';
import { initial } from '../test/learning-fixture';
import type { Wallet } from '../domain/learning';

async function openOverview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Dein Lernabzeichen:/ }));
  const overview = screen.getByRole('dialog', { name: 'Deine Lernabzeichen' });
  await waitFor(() =>
    expect(
      within(overview).getByRole('button', { name: 'Schließen' }),
    ).toHaveFocus(),
  );
  return overview;
}

it.each([
  {
    points: 10,
    tasks: 4,
    missing: 'Noch 1 richtig gelöste Aufgabe',
    done: 'Punkte geschafft ✓',
  },
  {
    points: 9,
    tasks: 5,
    missing: 'Noch 1 Punkt',
    done: 'Aufgaben geschafft ✓',
  },
])(
  'erklärt beide Bedingungen ohne Rangberechnung: $points Punkte, $tasks Aufgaben',
  async ({ points, tasks, missing, done }) => {
    const user = userEvent.setup();
    const wallet = {
      ...initial.wallet,
      totalEarned: points,
      achievements: { ...initial.wallet.achievements, completedTasks: tasks },
    };
    render(
      <AchievementBadge
        wallet={wallet}
        error=""
        profileReady
        onReload={vi.fn()}
      />,
    );
    const overview = await openOverview(user);
    expect(
      screen.getByRole('button', { name: 'Dein Lernabzeichen: Startklar' }),
    ).toBeVisible();
    expect(within(overview).getByText(missing)).toBeVisible();
    expect(within(overview).getByText(done)).toBeVisible();
    expect(within(overview).getAllByRole('article')).toHaveLength(6);
  },
);

it('zeigt den höchsten bestätigten Rang und erhält niedrigere Abzeichen trotz ausgegebener Punkte', async () => {
  const user = userEvent.setup();
  const wallet: Wallet = {
    ...initial.wallet,
    balance: 0,
    totalEarned: 50,
    achievements: {
      completedTasks: 20,
      currentId: 'lernfuchs',
      unlockedIds: ['startklar', 'funkenfinder', 'lernfuchs'],
      nextId: 'wissenspilot',
    },
  };
  render(
    <AchievementBadge
      wallet={wallet}
      error=""
      profileReady
      onReload={vi.fn()}
    />,
  );
  const overview = await openOverview(user);
  expect(
    screen.getByRole('button', { name: 'Dein Lernabzeichen: Lernfuchs' }),
  ).toBeVisible();
  expect(within(overview).getAllByText('Erreicht ✓')).toHaveLength(2);
  expect(within(overview).getByText('Dein aktuelles Abzeichen')).toBeVisible();
  expect(within(overview).getByText('Noch 100 Punkte')).toBeVisible();
  expect(
    within(overview).getByText('Noch 40 richtig gelöste Aufgaben'),
  ).toBeVisible();
});

it('zeigt höchste Stufe, lokale Bilder und einen erklärten Bildfehler-Fallback', async () => {
  const user = userEvent.setup();
  const wallet: Wallet = {
    ...initial.wallet,
    totalEarned: 1000,
    achievements: {
      completedTasks: 400,
      currentId: 'lernwelt-legende',
      unlockedIds: achievements.map((rank) => rank.id),
      nextId: null,
    },
  };
  const { container } = render(
    <AchievementBadge
      wallet={wallet}
      error=""
      profileReady
      onReload={vi.fn()}
    />,
  );
  const overview = await openOverview(user);
  expect(
    within(overview).getByText(/Du hast alle sechs Lernabzeichen erreicht!/),
  ).toBeVisible();
  expect(container.querySelectorAll('img')).toHaveLength(7);
  for (const image of container.querySelectorAll('img'))
    expect(image.getAttribute('src')).toMatch(/^\/badges\/.+\.png$/);
  fireEvent.error(container.querySelector('img')!);
  expect(
    screen.getByRole('button', {
      name: 'Dein Lernabzeichen: Lernwelt-Legende',
    }),
  ).toBeVisible();
});

it('erklärt Erststart und gibt den Fokus nach Escape zurück, ohne eine Eingabe zu verändern', async () => {
  const user = userEvent.setup();
  render(
    <>
      <input aria-label="Deine Antwort" defaultValue="42" />
      <AchievementBadge
        wallet={initial.wallet}
        error=""
        profileReady={false}
        onReload={vi.fn()}
      />
    </>,
  );
  const overview = await openOverview(user);
  expect(
    within(overview).getByText(/Speichere deinen Spitznamen/),
  ).toBeVisible();
  fireEvent(overview, new Event('cancel', { cancelable: true }));
  expect(
    screen.getByRole('button', { name: 'Dein Lernabzeichen: Startklar' }),
  ).toHaveFocus();
  expect(screen.getByRole('textbox', { name: 'Deine Antwort' })).toHaveValue(
    '42',
  );
});

it('zeigt bei Fehlern und noch nicht geladenen Daten keinen erfundenen Rang', async () => {
  const user = userEvent.setup();
  const reload = vi.fn();
  const { rerender } = render(
    <AchievementBadge
      wallet={null}
      error=""
      profileReady={false}
      onReload={reload}
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Lernabzeichen laden …' }),
  );
  expect(
    screen.getByText('Deine Lernabzeichen werden geladen …'),
  ).toBeVisible();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  rerender(
    <AchievementBadge
      wallet={null}
      error="Deine Lerndaten sind gerade nicht verfügbar."
      profileReady={false}
      onReload={reload}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Deine Lerndaten sind gerade nicht verfügbar.',
  );
  expect(screen.queryByText('Startklar')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Erneut laden' }));
  expect(reload).toHaveBeenCalledOnce();
});
