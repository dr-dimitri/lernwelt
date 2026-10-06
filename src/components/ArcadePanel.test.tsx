import { initialAchievements } from '../test/wallet-fixture';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ArcadePanel from './ArcadePanel';
import { desktop } from '../lib/desktop';
import type { ArcadeState, GameId } from '../domain/arcade';
vi.mock('./GamePreview', () => ({ default: () => null }));
vi.mock('../lib/desktop', () => ({
  desktop: { getArcadeState: vi.fn(), startGame: vi.fn(), finishGame: vi.fn() },
}));
vi.mock('./GameStage', () => ({
  default: ({
    onFinish,
    gameId,
  }: {
    onFinish: (score: number) => void;
    gameId: GameId;
  }) => (
    <button onClick={() => onFinish(150)}>
      {gameId === 'worms' ? 'Worms-Test-Runde beenden' : 'Test-Runde beenden'}
    </button>
  ),
}));
const initial: ArcadeState = {
  profileReady: true,
  entryCost: 10,
  wallet: {
    achievements: initialAchievements(),
    balance: 20,
    totalEarned: 20,
    rewards: [],
  },
  activeSession: null,
  bestScores: [],
};
const started: ArcadeState = {
  ...initial,
  wallet: { ...initial.wallet, balance: 10 },
  activeSession: { id: 'paid', gameId: 'blocks' },
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getArcadeState).mockResolvedValue(initial);
});
it('zeigt Preis und Guthaben und verwendet nach einem Transportfehler dieselbe Buchungs-ID', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.startGame)
    .mockRejectedValueOnce(new Error('Transportfehler'))
    .mockResolvedValueOnce(started);
  render(<ArcadePanel profileVersion={0} />);
  const buttons = await screen.findAllByRole('button', {
    name: 'Spielen · 10 Lernpunkte',
  });
  await waitFor(() => expect(buttons[0]).toBeEnabled());
  await user.click(buttons[0]);
  expect(await screen.findByRole('alert')).toHaveTextContent('Transportfehler');
  await user.click(
    screen.getByRole('button', { name: 'Buchung erneut versuchen' }),
  );
  expect(desktop.startGame).toHaveBeenCalledTimes(2);
  expect(vi.mocked(desktop.startGame).mock.calls[0]).toEqual(
    vi.mocked(desktop.startGame).mock.calls[1],
  );
  expect(
    screen.getByText('10 Lernpunkte', { selector: '.arcade-balance' }),
  ).toBeVisible();
});
it('nimmt eine bezahlte Runde kostenlos auf und wiederholt eine fehlgeschlagene Ergebnisspeicherung', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getArcadeState).mockResolvedValue(started);
  vi.mocked(desktop.finishGame)
    .mockRejectedValueOnce(new Error('Speicherfehler'))
    .mockResolvedValueOnce({
      ...started,
      activeSession: null,
      bestScores: [{ gameId: 'blocks', score: 150 }],
    });
  render(<ArcadePanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Kostenlos wieder aufnehmen' }),
  );
  expect(desktop.startGame).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Test-Runde beenden' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(
    screen.queryByRole('button', { name: 'Zur Spielauswahl' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(desktop.finishGame).toHaveBeenNthCalledWith(1, 'paid', 150);
  expect(desktop.finishGame).toHaveBeenNthCalledWith(2, 'paid', 150);
  await user.click(
    await screen.findByRole('button', { name: 'Zur Spielauswahl' }),
  );
  expect(screen.getByText('Bestwert: 150 Spielpunkte')).toBeVisible();
});
it.each([
  { ...initial, profileReady: false },
  { ...initial, wallet: { ...initial.wallet, balance: 0 } },
])('sperrt Spiele ohne Profil oder ausreichende Punkte', async (state) => {
  vi.mocked(desktop.getArcadeState).mockResolvedValue(state);
  render(<ArcadePanel profileVersion={0} />);
  await waitFor(() => expect(desktop.getArcadeState).toHaveBeenCalled());
  for (const button of screen.getAllByRole('button', {
    name: 'Spielen · 10 Lernpunkte',
  }))
    expect(button).toBeDisabled();
  expect(desktop.startGame).not.toHaveBeenCalled();
});
it('lädt nach einem Ladefehler erneut ohne Punktebuchung', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getArcadeState)
    .mockRejectedValueOnce(new Error('Ladefehler'))
    .mockResolvedValueOnce(initial);
  render(<ArcadePanel profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Ladefehler');
  await user.click(screen.getByRole('button', { name: 'Erneut laden' }));
  expect(
    await screen.findByText('20 Lernpunkte', { selector: '.arcade-balance' }),
  ).toBeVisible();
  expect(desktop.startGame).not.toHaveBeenCalled();
});

it('überschreibt eine Buchung nicht mit einem verspäteten Profil-Neuladen', async () => {
  const user = userEvent.setup();
  let resolveLoad!: (state: ArcadeState) => void;
  vi.mocked(desktop.getArcadeState)
    .mockResolvedValueOnce(initial)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
  vi.mocked(desktop.startGame).mockResolvedValue(started);
  const view = render(<ArcadePanel profileVersion={0} />);
  await screen.findByText('20 Lernpunkte', { selector: '.arcade-balance' });
  view.rerender(<ArcadePanel profileVersion={1} />);
  await user.click(
    screen.getAllByRole('button', { name: 'Spielen · 10 Lernpunkte' })[0],
  );
  await act(async () => resolveLoad(initial));
  expect(
    screen.getByText('10 Lernpunkte', { selector: '.arcade-balance' }),
  ).toBeVisible();
});

it('öffnet Worms für 10 Lernpunkte und verwendet bei einer Wiederholung dieselbe Buchung', async () => {
  const user = userEvent.setup();
  const wormStarted: ArcadeState = {
    ...started,
    activeSession: { id: 'worm-paid', gameId: 'worms' },
  };
  vi.mocked(desktop.startGame)
    .mockRejectedValueOnce(new Error('Transportfehler'))
    .mockResolvedValueOnce(wormStarted);
  render(<ArcadePanel profileVersion={0} />);
  await screen.findByText('20 Lernpunkte', { selector: '.arcade-balance' });
  const card = screen
    .getByRole('heading', { name: 'Worms' })
    .closest('article')!;
  expect(
    within(card).getByText('Gewinne das Inselduell mit deinem Zweierteam.'),
  ).toBeVisible();
  await user.click(
    within(card).getByRole('button', { name: 'Spielen · 10 Lernpunkte' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Transportfehler');
  await user.click(
    within(card).getByRole('button', { name: 'Buchung erneut versuchen' }),
  );
  expect(desktop.startGame).toHaveBeenCalledTimes(2);
  expect(vi.mocked(desktop.startGame).mock.calls[0][1]).toBe('worms');
  expect(vi.mocked(desktop.startGame).mock.calls[0]).toEqual(
    vi.mocked(desktop.startGame).mock.calls[1],
  );
  expect(
    screen.getByRole('button', { name: 'Worms-Test-Runde beenden' }),
  ).toBeVisible();
  expect(
    screen.getByText('10 Lernpunkte', { selector: '.arcade-balance' }),
  ).toBeVisible();
});

it('nimmt eine bezahlte Worms-Runde kostenlos auf und speichert Retry und Bestwert für Worms', async () => {
  const user = userEvent.setup();
  const wormStarted: ArcadeState = {
    ...started,
    activeSession: { id: 'worm-paid', gameId: 'worms' },
  };
  vi.mocked(desktop.getArcadeState).mockResolvedValue(wormStarted);
  vi.mocked(desktop.finishGame)
    .mockRejectedValueOnce(new Error('Speicherfehler'))
    .mockResolvedValueOnce({
      ...wormStarted,
      activeSession: null,
      bestScores: [{ gameId: 'worms', score: 150 }],
    });
  render(<ArcadePanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Kostenlos wieder aufnehmen' }),
  );
  expect(desktop.startGame).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole('button', { name: 'Worms-Test-Runde beenden' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(desktop.finishGame).toHaveBeenNthCalledWith(1, 'worm-paid', 150);
  expect(desktop.finishGame).toHaveBeenNthCalledWith(2, 'worm-paid', 150);
  await user.click(
    await screen.findByRole('button', { name: 'Zur Spielauswahl' }),
  );
  const card = screen
    .getByRole('heading', { name: 'Worms' })
    .closest('article')!;
  expect(within(card).getByText('Bestwert: 150 Spielpunkte')).toBeVisible();
  expect(
    screen.getByText('10 Lernpunkte', { selector: '.arcade-balance' }),
  ).toBeVisible();
  expect(desktop.startGame).not.toHaveBeenCalled();
});

it('überträgt ein Worms-Ergebnis auch bei mehrfacher Abschlussaktivierung nur einmal gleichzeitig', async () => {
  const user = userEvent.setup();
  const wormStarted: ArcadeState = {
    ...started,
    activeSession: { id: 'worm-paid', gameId: 'worms' },
  };
  vi.mocked(desktop.getArcadeState).mockResolvedValue(wormStarted);
  let resolveFinish!: (value: ArcadeState) => void;
  vi.mocked(desktop.finishGame).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFinish = resolve;
      }),
  );
  render(<ArcadePanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Kostenlos wieder aufnehmen' }),
  );
  const finish = screen.getByRole('button', {
    name: 'Worms-Test-Runde beenden',
  });
  await user.click(finish);
  await user.click(finish);
  expect(desktop.finishGame).toHaveBeenCalledExactlyOnceWith('worm-paid', 150);
  await act(async () =>
    resolveFinish({
      ...wormStarted,
      activeSession: null,
      bestScores: [{ gameId: 'worms', score: 150 }],
    }),
  );
  expect(
    await screen.findByRole('button', { name: 'Zur Spielauswahl' }),
  ).toBeVisible();
  expect(desktop.startGame).not.toHaveBeenCalled();
});

it('meldet bezahlte offene Runden und laufende Buchungen an die Fachnavigation', async () => {
  const user = userEvent.setup();
  const activity = vi.fn();
  let open!: (value: ArcadeState) => void;
  let finish!: (value: ArcadeState) => void;
  vi.mocked(desktop.startGame).mockImplementation(
    () =>
      new Promise((resolve) => {
        open = resolve;
      }),
  );
  vi.mocked(desktop.finishGame).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <ArcadePanel
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  const starts = await screen.findAllByRole('button', {
    name: 'Spielen · 10 Lernpunkte',
  });
  await user.click(starts[0]);
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: true });
  await act(async () => open(started));
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: false });
  await user.click(screen.getByRole('button', { name: 'Test-Runde beenden' }));
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: true });
  await act(async () => finish({ ...started, activeSession: null }));
  expect(activity).toHaveBeenLastCalledWith({ dirty: false, busy: false });
});

it('hält andere Fächer erreichbar, solange nur die Modul-Daten geladen werden', () => {
  vi.mocked(desktop.getArcadeState).mockImplementation(
    () => new Promise(() => {}),
  );
  const activity = vi.fn();
  render(
    <ArcadePanel
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  expect(activity).toHaveBeenLastCalledWith({ dirty: false, busy: false });
});
