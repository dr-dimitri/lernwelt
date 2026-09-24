import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LearningPanel from './LearningPanel';
import { desktop } from '../lib/desktop';
import type { AnswerResult } from '../domain/learning';

import { initial, mathQuestion, mathTopic } from '../test/learning-fixture';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    submitAnswer: vi.fn(),
    redeemReward: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));

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

it('wechselt die Stufe fachübergreifend und leert alte Antworten', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    questions: [
      ...initial.questions,
      {
        ...mathQuestion,
        id: 'hard',
        difficulty: 'streber',
        prompt: 'Wie groß ist −24 − (−17)?',
      },
      {
        ...mathQuestion,
        id: 'english-hard',
        subject: 'english',
        topicId: 'english',
        difficulty: 'streber',
        prompt: 'He ___ to school.',
        answerKind: 'text',
      },
    ],
  });
  vi.mocked(desktop.setDifficulty).mockResolvedValue('streber');
  const { rerender } = render(
    <LearningPanel subject="mathematics" profileVersion={0} />,
  );
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(desktop.setDifficulty).toHaveBeenCalledWith('streber');
  expect(await screen.findByLabelText('Wie groß ist −24 − (−17)?')).toHaveValue(
    '',
  );
  rerender(<LearningPanel subject="english" profileVersion={0} />);
  expect(screen.getByLabelText('He ___ to school.')).toHaveValue('');
  expect(screen.getByRole('button', { name: /Streber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

it('behält bei fehlgeschlagener Stufenänderung die bisherige Aufgabe', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.setDifficulty).mockRejectedValue(
    new Error('Stufe konnte nicht gespeichert werden.'),
  );
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Stufe konnte nicht gespeichert werden.',
  );
  expect(screen.getByRole('button', { name: /Könner/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByLabelText('Was ist 17 + 25?')).toHaveValue('42');
});

it('filtert nach Thema, zeigt Tipps und übermittelt ausgewählte Antworten', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    topics: [
      ...initial.topics,
      { ...mathTopic, id: 'geometry', name: 'Geometrie-Werkstatt' },
    ],
    questions: [
      ...initial.questions,
      {
        ...mathQuestion,
        id: 'choice',
        topicId: 'geometry',
        prompt: 'Welche Linie hat zwei Endpunkte?',
        answerKind: 'choice',
        options: ['Gerade', 'Strecke'],
        hint: 'Verbinde zwei Punkte.',
      },
    ],
  });
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: /Geometrie-Werkstatt/ }));
  expect(screen.queryByLabelText('Was ist 17 + 25?')).not.toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Strecke' })).not.toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Gib mir einen Tipp' }));
  expect(screen.getByText('Verbinde zwei Punkte.')).toBeVisible();
  await user.click(screen.getByRole('radio', { name: 'Strecke' }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    'choice',
    'Strecke',
  );
});

it('zeigt Mitmachaufgaben mit Selbstkontrolle ohne Punktebuchung', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await screen.findByLabelText('Was ist 17 + 25?');
  await user.click(screen.getByText('Stift raus! 1 Mitmachaufgaben'));
  expect(screen.getByText('Erkläre deinen Weg.')).toBeVisible();
  await user.click(screen.getByText('So kannst du dich prüfen'));
  expect(screen.getByText('Viele Wege sind möglich.')).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});

it('leert eine alte Antwort auch nach Wiederherstellung einer anders gespeicherten Stufe', async () => {
  const user = userEvent.setup();
  const questions = [
    ...initial.questions,
    {
      ...mathQuestion,
      id: 'hard-reload',
      difficulty: 'streber' as const,
      prompt: 'Berechne −24 − (−17).',
    },
  ];
  vi.mocked(desktop.getLearningState)
    .mockResolvedValueOnce({ ...initial, questions })
    .mockResolvedValueOnce({ ...initial, questions, difficulty: 'streber' });
  // The database committed, but its response was lost. Reload reveals the saved value.
  vi.mocked(desktop.setDifficulty).mockRejectedValue(
    new Error('Antwort verloren.'),
  );
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(await screen.findByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  await screen.findByRole('alert');
  await user.click(
    screen.getByRole('button', { name: 'Punktekonto neu laden' }),
  );
  expect(await screen.findByLabelText('Berechne −24 − (−17).')).toHaveValue('');
  expect(screen.getByRole('button', { name: /Streber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

it('zeigt Einheitentafeln mit Spaltenüberschriften und Erklärung', async () => {
  const user = userEvent.setup();
  const state = structuredClone(initial);
  state.topics[0].tables = [
    {
      caption: 'Geld: Euro und Cent',
      headers: ['€', 'ct (2 Stellen)'],
      rows: [['3', '05']],
      note: 'Diese Zeile bedeutet 3,05 €.',
    },
  ];
  vi.mocked(desktop.getLearningState).mockResolvedValue(state);
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await screen.findByLabelText('Was ist 17 + 25?');
  await user.click(screen.getByText('So geht’s · kurz erklärt'));
  expect(
    screen.getByRole('table', { name: 'Geld: Euro und Cent' }),
  ).toBeVisible();
  expect(
    screen.getByRole('columnheader', { name: 'ct (2 Stellen)' }),
  ).toBeVisible();
  expect(screen.getByRole('cell', { name: '05' })).toBeVisible();
  expect(screen.getByText('Diese Zeile bedeutet 3,05 €.')).toBeVisible();
});

it('zeigt nach Stufenwechsel 5, 10 und 15 Punkte und die tatsächliche Gutschrift', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    questions: ['vorschule', 'koenner', 'streber'].map((difficulty) => ({
      ...mathQuestion,
      id: difficulty,
      difficulty: difficulty as typeof mathQuestion.difficulty,
    })),
  });
  vi.mocked(desktop.setDifficulty).mockImplementation(
    async (difficulty) => difficulty,
  );
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  expect(
    await screen.findByText(/Eine neue Aufgabe gelöst\? \+10 Punkte!/),
  ).toBeVisible();
  for (const [name, points] of [
    ['Vorschule', 5],
    ['Könner', 10],
    ['Streber', 15],
  ] as const) {
    await user.click(screen.getByRole('button', { name: new RegExp(name) }));
    expect(
      await screen.findByText(
        new RegExp(`Eine neue Aufgabe gelöst\\? \\+${points} Punkte!`),
      ),
    ).toBeVisible();
    vi.mocked(desktop.submitAnswer).mockResolvedValue({
      ...awarded,
      pointsAwarded: points,
    });
    await user.type(screen.getByLabelText('Was ist 17 + 25?'), '42');
    await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(await screen.findByText(`Richtig! +${points} Punkte`)).toBeVisible();
  }
});
