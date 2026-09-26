import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LearningPanel from './LearningPanel';
import { desktop } from '../lib/desktop';
import type { AnswerResult, LearningState, Question } from '../domain/learning';
import { initial, mathQuestion, mathTopic } from '../test/learning-fixture';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    submitAnswer: vi.fn(),
    redeemReward: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));

const read: Question = {
  ...mathQuestion,
  id: 'line-read',
  topicId: 'number-line',
  prompt: 'Welche Zahl zeigt A?',
  numberLine: {
    kind: 'ray',
    mode: 'read',
    min: 0,
    max: 100,
    step: 10,
    labels: [0, 50, 100],
    markers: [{ label: 'A', value: 70 }],
  },
};
const place: Question = {
  ...read,
  id: 'line-place',
  prompt: 'Setze einen Punkt bei 70.',
  numberLine: { ...read.numberLine!, mode: 'place', markers: [] },
};
const hard: Question = {
  ...place,
  id: 'line-hard',
  difficulty: 'streber',
  prompt: 'Setze einen Punkt bei −75.',
  numberLine: {
    kind: 'line',
    mode: 'place',
    min: -100,
    max: 100,
    step: 25,
    labels: [-100, 0, 100],
    markers: [],
  },
};
const state: LearningState = {
  ...initial,
  topics: [
    {
      ...mathTopic,
      id: 'number-line',
      name: 'Zahlenstrahl-Werkstatt',
      curriculumRef: 'M5 1.1',
      curriculumVersion: 'LehrplanPLUS 2026-09-26',
    },
  ],
  questions: [read, place, hard],
};
const correct: AnswerResult = {
  correct: true,
  mistakeHint: null,
  pointsAwarded: 2,
  explanation: 'Sieben Zehnerschritte ergeben 70.',
  wallet: { ...initial.wallet, balance: 12, totalEarned: 12 },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(structuredClone(state));
  vi.mocked(desktop.submitAnswer).mockResolvedValue(structuredClone(correct));
  vi.mocked(desktop.setDifficulty).mockImplementation(async (value) => value);
});

it('verbindet Ablesen, Punktsetzen und Weiterüben mit der bestehenden Antwortprüfung', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(await screen.findByLabelText(read.prompt), '70');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    read.id,
    '70',
  );
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Weiter zur nächsten Aufgabe' }),
  );
  expect(screen.getByText(place.prompt)).toBeVisible();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  const ticks = screen.getAllByRole('radio');
  expect(
    ticks.every((tick) => tick.getAttribute('aria-checked') === 'false'),
  ).toBe(true);
  await user.click(ticks[7]);
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenLastCalledWith(
    expect.any(String),
    place.id,
    '70',
  );
});

it('behält einen falschen Punkt zum Korrigieren und leert ihn bei Aufgaben- und Stufenwechsel', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockResolvedValueOnce({
    ...correct,
    correct: false,
    pointsAwarded: 0,
    wallet: initial.wallet,
  });
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.selectOptions(
    await screen.findByLabelText('Deine Aufgabe'),
    place.id,
  );
  await user.click(screen.getAllByRole('radio')[3]);
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  await user.click(
    await screen.findByRole('button', { name: 'Noch einmal versuchen' }),
  );
  expect(screen.getAllByRole('radio')[3]).toHaveAttribute(
    'aria-checked',
    'true',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  await user.click(screen.getAllByRole('radio')[7]);
  await user.selectOptions(screen.getByLabelText('Deine Aufgabe'), read.id);
  expect(screen.getByLabelText(read.prompt)).toHaveValue('');
  await user.selectOptions(screen.getByLabelText('Deine Aufgabe'), place.id);
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  await user.click(screen.getAllByRole('radio')[7]);
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(await screen.findByText(hard.prompt)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  await user.click(screen.getAllByRole('radio')[1]);
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenLastCalledWith(
    expect.any(String),
    hard.id,
    '-75',
  );
});

it('sperrt Punktwahl ohne Profil und während einer Buchung; Speicherfehler sind wiederholbar', async () => {
  const user = userEvent.setup();
  let finish!: (result: AnswerResult) => void;
  vi.mocked(desktop.submitAnswer)
    .mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.selectOptions(
    await screen.findByLabelText('Deine Aufgabe'),
    place.id,
  );
  await user.click(screen.getAllByRole('radio')[7]);
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(screen.getAllByRole('radio')[7]).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  for (const radio of screen.getAllByRole('radio'))
    expect(radio).toBeDisabled();
  expect(screen.getByLabelText('Deine Aufgabe')).toBeDisabled();
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(2);
  expect(vi.mocked(desktop.submitAnswer).mock.calls[0]).toEqual(
    vi.mocked(desktop.submitAnswer).mock.calls[1],
  );
  await act(async () => finish(correct));
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
});

it('zeigt die Grafik ohne Profil, erlaubt aber noch keine Punktwahl', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...state,
    profileReady: false,
  });
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.selectOptions(
    await screen.findByLabelText('Deine Aufgabe'),
    place.id,
  );
  for (const radio of screen.getAllByRole('radio'))
    expect(radio).toBeDisabled();
  await user.click(screen.getAllByRole('radio')[7]);
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
});

it('zeigt für das zusätzliche Mathematikpaket dessen eigenen Quellenstand', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await screen.findByLabelText(read.prompt);
  await user.click(
    screen.getByRole('button', {
      name: 'Für Neugierige & Erwachsene: Lerninhalte',
    }),
  );
  expect(screen.getByText(/LehrplanPLUS 2026-09-26/)).toBeVisible();
});
