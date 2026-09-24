import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LearningPanel from './LearningPanel';
import { desktop } from '../lib/desktop';
import type { AnswerResult, LearningState } from '../domain/learning';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    submitAnswer: vi.fn(),
    redeemReward: vi.fn(),
  },
}));

const initial: LearningState = {
  profileReady: true,
  pointsPerAnswer: 10,
  questions: [
    {
      id: 'math',
      subject: 'mathematics',
      prompt: 'Was ist 17 + 25?',
      solved: false,
    },
    {
      id: 'english',
      subject: 'english',
      prompt: 'Katze auf Englisch?',
      solved: false,
    },
  ],
  wallet: {
    balance: 10,
    totalEarned: 10,
    rewards: [
      {
        id: 'star',
        name: 'Sternsammler',
        description: 'Dein Abzeichen.',
        cost: 20,
        owned: false,
      },
    ],
  },
};
const awarded: AnswerResult = {
  correct: true,
  pointsAwarded: 10,
  explanation: '17 + 25 = 42.',
  wallet: { ...initial.wallet, balance: 20, totalEarned: 20 },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(
    structuredClone(initial),
  );
  vi.mocked(desktop.submitAnswer).mockResolvedValue(structuredClone(awarded));
});

it('sammelt Punkte und löst ein Abzeichen gegen das Guthaben ein', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await screen.findByLabelText('Was ist 17 + 25?');
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(
    screen.getByRole('button', { name: /Sternsammler für/ }),
  ).toBeDisabled();
  await user.type(screen.getByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByText('Richtig! +10 Punkte')).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '20 Punkte',
  );
  vi.mocked(desktop.redeemReward).mockResolvedValue({
    balance: 0,
    totalEarned: 20,
    rewards: [{ ...initial.wallet.rewards[0], owned: true }],
  });
  await user.click(screen.getByRole('button', { name: /Sternsammler für/ }));
  expect(
    await screen.findByText('„Sternsammler“ gehört jetzt zu deiner Sammlung.'),
  ).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '0 Punkte',
  );
  expect(
    screen.getByRole('button', { name: 'Sternsammler: In deiner Sammlung' }),
  ).toBeDisabled();
});

it('verändert Guthaben bei einer falschen Antwort nicht', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockResolvedValue({
    ...awarded,
    correct: false,
    pointsAwarded: 0,
    wallet: initial.wallet,
  });
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '43');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(
    await screen.findByText('Noch nicht richtig. Versuch es noch einmal!'),
  ).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
});

it('verwendet nach einem Speicherfehler dieselbe Antwort-ID für den Retry', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer)
    .mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'))
    .mockResolvedValueOnce(awarded);
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  await screen.findByText('Richtig! +10 Punkte');
  const calls = vi.mocked(desktop.submitAnswer).mock.calls;
  expect(calls[0]).toEqual(calls[1]);
  expect(calls[0][0]).not.toBe('');
});

it('sperrt Eingaben während der Buchung und leert die Antwort beim Fachwechsel', async () => {
  const user = userEvent.setup();
  let finish!: (value: AnswerResult) => void;
  vi.mocked(desktop.submitAnswer).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { rerender } = render(
    <LearningPanel subject="mathematics" profileVersion={0} />,
  );
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(screen.getByRole('button', { name: 'Bitte warten …' })).toBeDisabled();
  rerender(<LearningPanel subject="english" profileVersion={0} />);
  expect(screen.getByLabelText('Katze auf Englisch?')).toHaveValue('');
  await act(async () => {
    finish(awarded);
  });
  expect(screen.queryByText('Richtig! +10 Punkte')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '20 Punkte',
  );
});

it('zeigt Ladefehler ohne erfundenes Guthaben und erlaubt erneutes Laden', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockRejectedValueOnce(new Error('Laden fehlgeschlagen'))
    .mockResolvedValueOnce(initial);
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Laden fehlgeschlagen',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    'Nicht verfügbar',
  );
  await user.click(
    screen.getByRole('button', { name: 'Punktekonto neu laden' }),
  );
  await screen.findByLabelText('Was ist 17 + 25?');
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
});

it('zeigt Einlösefehler ohne falschen Besitz oder Punkteabzug', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    wallet: awarded.wallet,
  });
  vi.mocked(desktop.redeemReward).mockRejectedValue(
    new Error('Einlösen fehlgeschlagen'),
  );
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /Sternsammler für/ }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: /Sternsammler für/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Einlösen fehlgeschlagen',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '20 Punkte',
  );
  expect(screen.queryByText('In deiner Sammlung ✓')).not.toBeInTheDocument();
});

it('aktiviert Aufgaben erst nach Anlage des Lernprofils', async () => {
  vi.mocked(desktop.getLearningState)
    .mockResolvedValueOnce({ ...initial, profileReady: false })
    .mockResolvedValueOnce(initial);
  const { rerender } = render(
    <LearningPanel subject="mathematics" profileVersion={0} />,
  );
  expect(await screen.findByText(/Speichere zuerst unten/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  rerender(<LearningPanel subject="mathematics" profileVersion={1} />);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Antwort prüfen' }),
    ).toBeEnabled(),
  );
});
