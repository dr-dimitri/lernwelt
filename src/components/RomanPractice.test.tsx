import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import RomanPractice from './RomanPractice';
import { desktop } from '../lib/desktop';
import type { AnswerResult } from '../domain/learning';
import type { RomanQuestion } from '../domain/roman';
import { initial, mathQuestion } from '../test/learning-fixture';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getRomanQuestion: vi.fn(),
    submitAnswer: vi.fn(),
  },
}));

const decimalQuestion: RomanQuestion = {
  ...mathQuestion,
  id: 'by.math.5.roman-random.decimal-to-roman.koenner.42.v1',
  topicId: 'numbers',
  competencyId: 'by.math.5.numbers.roman',
  prompt: 'Schreibe 42 als römische Zahl.',
  answerKind: 'text',
  unit: 'Nutze I, V, X, L, C, D und M.',
  hint: 'X bedeutet 10 und L bedeutet 50.',
  furtherHints: ['Zerlege die Zahl in Zehner und Einer.', 'XL bedeutet 40.'],
  grade: 5,
  source: 'Eigene Lernwelt-Zufallsübungen; Bezug M5 1.1.',
  curriculumVersion: 'LehrplanPLUS-Zuordnung 2026-10-03; Zufallsübungen v1',
};
const numeralQuestion: RomanQuestion = {
  ...decimalQuestion,
  id: 'by.math.5.roman-random.roman-to-decimal.koenner.2024.v1',
  prompt: 'Welche Zahl bedeutet MMXXIV? Schreibe sie mit den Ziffern 0 bis 9.',
  answerKind: 'number',
  unit: 'Schreibe nur die Zahl.',
};
const correct: AnswerResult = {
  correct: true,
  pointsAwarded: 2,
  explanation: 'XL = 40 und II = 2. Zusammen: 40 + 2 = 42.',
  mistakeHint: null,
  wallet: { ...initial.wallet, balance: 12, totalEarned: 12 },
};

function setup(profileReady = true) {
  const onBusyChange = vi.fn();
  const onWalletChange = vi.fn();
  const view = render(
    <RomanPractice
      difficulty="koenner"
      profileReady={profileReady}
      disabled={false}
      onBusyChange={onBusyChange}
      onWalletChange={onWalletChange}
    />,
  );
  return { ...view, onBusyChange, onWalletChange };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getRomanQuestion).mockResolvedValue(
    structuredClone(decimalQuestion),
  );
  vi.mocked(desktop.submitAnswer).mockResolvedValue(structuredClone(correct));
});

it('prüft die direkt eingegebene römische Antwort mit Enter und meldet die gebuchten Punkte', async () => {
  const user = userEvent.setup();
  const { onWalletChange } = setup();
  const input = await screen.findByLabelText(decimalQuestion.prompt);
  expect(input).toHaveAttribute('inputmode', 'text');
  expect(input).toHaveAttribute('aria-describedby', 'roman-format');
  expect(screen.getByText('4000 = MMMM.', { exact: false })).toBeVisible();
  await user.type(input, 'XLII{Enter}');
  expect(desktop.getRomanQuestion).toHaveBeenCalledWith(
    'decimal-to-roman',
    undefined,
  );
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    decimalQuestion.id,
    'XLII',
  );
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  expect(screen.getByText(correct.explanation)).toBeVisible();
  expect(onWalletChange).toHaveBeenCalledWith(correct.wallet);
  expect(input).toBeDisabled();
});

it('wechselt zur Gegenrichtung und lädt weitere Zahlen mit der vorherigen Aufgaben-ID', async () => {
  const user = userEvent.setup();
  const next: RomanQuestion = {
    ...numeralQuestion,
    id: 'by.math.5.roman-random.roman-to-decimal.koenner.1.v1',
    prompt: 'Welche Zahl bedeutet I?',
  };
  vi.mocked(desktop.getRomanQuestion)
    .mockResolvedValueOnce(structuredClone(decimalQuestion))
    .mockResolvedValueOnce(structuredClone(numeralQuestion))
    .mockResolvedValueOnce(next);
  setup();
  await user.type(await screen.findByLabelText(decimalQuestion.prompt), 'X');
  await user.click(screen.getByRole('button', { name: 'Römisch → Zahl' }));
  const input = await screen.findByLabelText(numeralQuestion.prompt);
  expect(input).toHaveValue('');
  expect(input).toHaveAttribute('inputmode', 'numeric');
  expect(desktop.getRomanQuestion).toHaveBeenNthCalledWith(
    2,
    'roman-to-decimal',
    decimalQuestion.id,
  );
  await user.type(input, '2024{Enter}');
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    numeralQuestion.id,
    '2024',
  );
  await user.click(
    await screen.findByRole('button', {
      name: 'Weiter zur nächsten Zufallszahl',
    }),
  );
  expect(await screen.findByLabelText(next.prompt)).toHaveValue('');
  expect(desktop.getRomanQuestion).toHaveBeenNthCalledWith(
    3,
    'roman-to-decimal',
    numeralQuestion.id,
  );
  expect(screen.queryByText('Richtig! +2 Punkte')).not.toBeInTheDocument();
});

it('gibt schrittweise Tipps und zeigt nach einem Fehler den Lösungsweg ohne Punkte', async () => {
  const user = userEvent.setup();
  const { onWalletChange } = setup();
  vi.mocked(desktop.submitAnswer).mockResolvedValueOnce({
    ...correct,
    correct: false,
    pointsAwarded: 0,
    mistakeHint: 'Prüfe die Reihenfolge von X und L.',
    wallet: initial.wallet,
  });
  const input = await screen.findByLabelText(decimalQuestion.prompt);
  await user.click(screen.getByRole('button', { name: 'Gib mir einen Tipp' }));
  const hints = screen.getByRole('dialog', { name: 'Gib mir einen Tipp' });
  expect(within(hints).getByText(decimalQuestion.hint)).toBeVisible();
  expect(
    within(hints).queryByText(decimalQuestion.furtherHints[0]),
  ).not.toBeInTheDocument();
  await user.click(
    within(hints).getByRole('button', { name: 'Nächster Tipp' }),
  );
  expect(
    within(hints).getByText(decimalQuestion.furtherHints[0]),
  ).toBeVisible();
  await user.click(within(hints).getByRole('button', { name: 'Schließen' }));
  await user.type(input, 'LXII{Enter}');
  expect(
    await screen.findByText('Noch nicht richtig. Versuch es noch einmal!'),
  ).toBeVisible();
  expect(screen.getByText('Prüfe die Reihenfolge von X und L.')).toBeVisible();
  expect(screen.queryByText(correct.explanation)).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Lösungsweg anschauen' }),
  );
  const solution = screen.getByRole('dialog', { name: 'Lösungsweg anschauen' });
  expect(within(solution).getByText(correct.explanation)).toBeVisible();
  await user.click(within(solution).getByRole('button', { name: 'Schließen' }));
  await user.click(
    screen.getByRole('button', { name: 'Noch einmal versuchen' }),
  );
  expect(input).toHaveValue('LXII');
  expect(input).toBeEnabled();
  expect(onWalletChange).toHaveBeenCalledWith(initial.wallet);
  expect(screen.queryByText('Richtig! +2 Punkte')).not.toBeInTheDocument();
});

it('nimmt auch die lange römische Schreibweise für 9999 vollständig an', async () => {
  const user = userEvent.setup();
  const question: RomanQuestion = {
    ...decimalQuestion,
    id: 'by.math.5.roman-random.decimal-to-roman.koenner.9999.v1',
    prompt: 'Schreibe 9999 als römische Zahl.',
  };
  vi.mocked(desktop.getRomanQuestion).mockResolvedValue(question);
  setup();
  const answer = `${'M'.repeat(9)}CMXCIX`;
  const input = await screen.findByLabelText(question.prompt);
  await user.type(input, `${answer}{Enter}`);
  expect(input).toHaveValue(answer);
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    question.id,
    answer,
  );
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
});

it('behält nach Speicherfehlern die Request-ID und sperrt Eingabe und Wechsel während der Wiederholung', async () => {
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
  const { onWalletChange, onBusyChange } = setup();
  const input = await screen.findByLabelText(decimalQuestion.prompt);
  await user.type(input, 'XLII{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(input).toHaveValue('XLII');
  expect(onWalletChange).not.toHaveBeenCalled();
  expect(screen.queryByText('Richtig! +2 Punkte')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(input).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Neue Zufallszahl →' }),
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Römisch → Zahl' })).toBeDisabled();
  expect(vi.mocked(desktop.submitAnswer).mock.calls[0]).toEqual(
    vi.mocked(desktop.submitAnswer).mock.calls[1],
  );
  expect(onBusyChange).toHaveBeenLastCalledWith(true);
  await act(async () => finish(correct));
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  expect(onWalletChange).toHaveBeenCalledTimes(1);
  expect(onBusyChange).toHaveBeenLastCalledWith(false);
});

it('zeigt bei Ladefehlern keine alte Erfolgsrückmeldung und lässt das Laden wiederholen', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getRomanQuestion)
    .mockResolvedValueOnce(structuredClone(decimalQuestion))
    .mockRejectedValueOnce(new Error('Zufallszahl nicht verfügbar'))
    .mockResolvedValueOnce(structuredClone(decimalQuestion));
  const { onWalletChange } = setup();
  await user.type(
    await screen.findByLabelText(decimalQuestion.prompt),
    'XLII{Enter}',
  );
  await user.click(
    await screen.findByRole('button', {
      name: 'Weiter zur nächsten Zufallszahl',
    }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Zufallszahl nicht verfügbar',
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByText('Richtig! +2 Punkte')).not.toBeInTheDocument();
  expect(onWalletChange).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Noch einmal laden' }));
  expect(await screen.findByLabelText(decimalQuestion.prompt)).toHaveValue('');
  expect(desktop.getRomanQuestion).toHaveBeenNthCalledWith(
    3,
    'decimal-to-roman',
    decimalQuestion.id,
  );
});

it('zeigt Zufallszahlen ohne Profil, erlaubt aber noch keine Antwortbuchung', async () => {
  const user = userEvent.setup();
  const { onWalletChange } = setup(false);
  const input = await screen.findByLabelText(decimalQuestion.prompt);
  expect(input).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  await user.type(input, 'XLII{Enter}');
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  expect(onWalletChange).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Neue Zufallszahl →' }),
  ).toBeEnabled();
});

it('überträgt eine verspätete Antwort nach einem externen Stufenwechsel nicht auf die neue Frage', async () => {
  const user = userEvent.setup();
  let finish!: (result: AnswerResult) => void;
  const newQuestion: RomanQuestion = {
    ...decimalQuestion,
    id: 'by.math.5.roman-random.decimal-to-roman.streber.9999.v1',
    difficulty: 'streber',
    prompt: 'Schreibe 9999 als römische Zahl.',
  };
  vi.mocked(desktop.getRomanQuestion)
    .mockResolvedValueOnce(structuredClone(decimalQuestion))
    .mockResolvedValueOnce(structuredClone(newQuestion));
  vi.mocked(desktop.submitAnswer).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { rerender, onBusyChange, onWalletChange } = setup();
  await user.type(
    await screen.findByLabelText(decimalQuestion.prompt),
    'XLII{Enter}',
  );
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(1);
  rerender(
    <RomanPractice
      difficulty="streber"
      profileReady
      disabled={false}
      onBusyChange={onBusyChange}
      onWalletChange={onWalletChange}
    />,
  );
  const input = await screen.findByLabelText(newQuestion.prompt);
  expect(input).toHaveValue('');
  expect(desktop.getRomanQuestion).toHaveBeenNthCalledWith(
    2,
    'decimal-to-roman',
    decimalQuestion.id,
  );
  await act(async () => finish(correct));
  expect(input).toHaveValue('');
  expect(input).toBeEnabled();
  expect(screen.queryByText('Richtig! +2 Punkte')).not.toBeInTheDocument();
  expect(screen.queryByText(correct.explanation)).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Die Punkte für diese Zahl, Richtung und Stufe/),
  ).not.toBeInTheDocument();
  expect(onWalletChange).not.toHaveBeenCalled();
  expect(onBusyChange).toHaveBeenLastCalledWith(false);
  await user.type(input, `${'M'.repeat(9)}CMXCIX{Enter}`);
  expect(desktop.submitAnswer).toHaveBeenLastCalledWith(
    expect.any(String),
    newQuestion.id,
    `${'M'.repeat(9)}CMXCIX`,
  );
});
