import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ArcadePanel from './ArcadePanel';
import { desktop } from '../lib/desktop';
import type { ArcadeState } from '../domain/arcade';
vi.mock('./GamePreview', () => ({ default: () => null }));
vi.mock('../lib/desktop', () => ({
  desktop: { getArcadeState: vi.fn(), startGame: vi.fn(), finishGame: vi.fn() },
}));
vi.mock('./GameStage', () => ({
  default: ({ onFinish }: { onFinish: (score: number) => void }) => (
    <button onClick={() => onFinish(150)}>Test-Runde beenden</button>
  ),
}));
const initial: ArcadeState = {
  profileReady: true,
  entryCost: 10,
  wallet: { balance: 20, totalEarned: 20, rewards: [] },
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
  await user.click(
    screen.getByRole('button', { name: 'Ergebnis erneut speichern' }),
  );
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
  await user.click(
    screen.getByRole('button', { name: 'Spielhalle neu laden' }),
  );
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
