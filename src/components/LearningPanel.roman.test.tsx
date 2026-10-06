import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LearningPanel from './LearningPanel';
import { desktop } from '../lib/desktop';
import type {
  AnswerResult,
  Difficulty,
  LearningState,
  Question,
} from '../domain/learning';
import type { StudyUnit } from '../domain/study';
import type { RomanQuestion } from '../domain/roman';
import { initial, mathQuestion, mathTopic } from '../test/learning-fixture';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    getRomanQuestion: vi.fn(),
    submitAnswer: vi.fn(),
    redeemReward: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));

const romanRound: Question = {
  ...mathQuestion,
  id: 'roman-round',
  competencyId: 'by.math.5.numbers.roman',
  topicId: 'numbers',
  prompt: 'Schreibe 14 als römische Zahl.',
  answerKind: 'text',
};
const hardRound: Question = {
  ...romanRound,
  id: 'roman-round-hard',
  difficulty: 'streber',
  prompt: 'Schreibe 3999 als römische Zahl.',
};
const randomQuestion: RomanQuestion = {
  ...romanRound,
  id: 'by.math.5.roman-random.decimal-to-roman.koenner.42.v1',
  prompt: 'Schreibe 42 als römische Zahl.',
  grade: 5,
  source: 'Eigene Lernwelt-Zufallsübungen; Bezug M5 1.1.',
  curriculumVersion: 'LehrplanPLUS-Zuordnung 2026-10-03; Zufallsübungen v1',
};
const hardRandom: RomanQuestion = {
  ...randomQuestion,
  id: 'by.math.5.roman-random.decimal-to-roman.streber.9999.v1',
  difficulty: 'streber',
  prompt: 'Schreibe 9999 als römische Zahl.',
};
const romanUnit: StudyUnit = {
  id: 'math-roman',
  areaId: 'numbers',
  subject: 'mathematics',
  grade: 5,
  name: 'Römische Zahlen',
  goal: 'Du übersetzt Zahlen in römische Zeichen und zurück.',
  keywords: ['Römisch'],
  curriculumRef: 'M5 1.1',
  source: initial.curriculumSource,
  curriculumVersion: initial.curriculumVersion,
  languageSequence: null,
  exerciseIds: [romanRound.id, hardRound.id],
  supplements: [],
};
const addUnit: StudyUnit = {
  ...romanUnit,
  id: 'math-add',
  name: 'Plus & Minus',
  exerciseIds: [mathQuestion.id],
};
const state: LearningState = {
  ...initial,
  topics: [
    { ...mathTopic, id: 'numbers', name: 'Zahlen entdecken' },
    mathTopic,
  ],
  questions: [romanRound, hardRound, mathQuestion],
  studyCatalog: {
    version: 1,
    areas: [
      {
        id: 'numbers',
        subject: 'mathematics',
        name: 'Zahlen entdecken',
        curriculumRef: 'M5 1.1',
      },
    ],
    units: [romanUnit, addUnit],
  },
};
const correct: AnswerResult = {
  correct: true,
  pointsAwarded: 2,
  mistakeHint: null,
  explanation: 'XLII = 42.',
  wallet: { ...initial.wallet, balance: 12, totalEarned: 12 },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(structuredClone(state));
  vi.mocked(desktop.getRomanQuestion).mockResolvedValue(
    structuredClone(randomQuestion),
  );
  vi.mocked(desktop.submitAnswer).mockResolvedValue(structuredClone(correct));
  vi.mocked(desktop.setDifficulty).mockImplementation(async (value) => value);
});

async function startRoman(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: /Römische Zahlen/ }),
  );
  await screen.findByLabelText(romanRound.prompt);
}

it('ergänzt math-roman um Zufallsübungen und kehrt zur bisherigen Runde und Themenübersicht zurück', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await startRoman(user);
  expect(desktop.getRomanQuestion).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Kurze Lernrunde' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await user.type(screen.getByLabelText(romanRound.prompt), 'X');
  await user.click(screen.getByRole('button', { name: 'Zufallsübung 1–9999' }));
  await user.type(
    await screen.findByLabelText(randomQuestion.prompt),
    'XLII{Enter}',
  );
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '12 Punkte',
  );
  expect(screen.queryByLabelText(romanRound.prompt)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Kurze Lernrunde' }));
  expect(await screen.findByLabelText(romanRound.prompt)).toHaveValue('X');
  expect(
    screen.queryByLabelText(randomQuestion.prompt),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Zufallsübung 1–9999' }));
  await screen.findByLabelText(randomQuestion.prompt);
  await user.click(screen.getByRole('button', { name: '← Themenübersicht' }));
  expect(screen.getByRole('button', { name: /Römische Zahlen/ })).toHaveFocus();
  expect(
    screen.queryByLabelText(randomQuestion.prompt),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Plus & Minus/ }));
  expect(await screen.findByLabelText(mathQuestion.prompt)).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Zufallsübung 1–9999' }),
  ).not.toBeInTheDocument();
});

it('lädt nach dem gespeicherten Stufenwechsel eine neue Zufallszahl und verwendet anschließend die reguläre Stufe', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getRomanQuestion)
    .mockResolvedValueOnce(structuredClone(randomQuestion))
    .mockResolvedValueOnce(structuredClone(hardRandom));
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await startRoman(user);
  await user.click(screen.getByRole('button', { name: 'Zufallsübung 1–9999' }));
  await user.type(await screen.findByLabelText(randomQuestion.prompt), 'XL');
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(desktop.setDifficulty).toHaveBeenCalledWith('streber');
  expect(await screen.findByLabelText(hardRandom.prompt)).toHaveValue('');
  expect(desktop.getRomanQuestion).toHaveBeenNthCalledWith(
    2,
    'decimal-to-roman',
    randomQuestion.id,
  );
  expect(screen.getByRole('button', { name: /Streber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    screen.getByText(/Eine neue Aufgabe gelöst\? \+3 Punkte!/),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Kurze Lernrunde' }));
  expect(await screen.findByLabelText(hardRound.prompt)).toHaveValue('');
  expect(screen.queryByLabelText(hardRandom.prompt)).not.toBeInTheDocument();
});

it('behält ohne Lernprofil die Zufallsoption und die Hinweise, sperrt aber die Buchung', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...structuredClone(state),
    profileReady: false,
  });
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await startRoman(user);
  await user.click(screen.getByRole('button', { name: 'Zufallsübung 1–9999' }));
  expect(await screen.findByLabelText(randomQuestion.prompt)).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  expect(screen.getByText(/Speichere dein Lernprofil/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Tipp' }));
  expect(screen.getByText(randomQuestion.hint)).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
});

it('sperrt alte Zufallsantworten, solange der globale Stufenwechsel gespeichert wird', async () => {
  const user = userEvent.setup();
  let saveDifficulty!: (value: Difficulty) => void;
  vi.mocked(desktop.setDifficulty).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        saveDifficulty = resolve;
      }),
  );
  vi.mocked(desktop.getRomanQuestion)
    .mockResolvedValueOnce(structuredClone(randomQuestion))
    .mockResolvedValueOnce(structuredClone(hardRandom));
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await startRoman(user);
  await user.click(screen.getByRole('button', { name: 'Zufallsübung 1–9999' }));
  const input = await screen.findByLabelText(randomQuestion.prompt);
  await user.type(input, 'XLII');
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(input).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Römisch → Zahl' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Neue Zufallszahl →' }),
  ).toBeDisabled();
  await user.type(input, '{Enter}');
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  await act(async () => saveDifficulty('streber'));
  expect(await screen.findByLabelText(hardRandom.prompt)).toHaveValue('');
  expect(screen.queryByText('Richtig! +2 Punkte')).not.toBeInTheDocument();
});

it('macht dieselbe allgemeine Anleitung in beiden Übungsarten erreichbar und erhält Antwort, Fortschritt und Punkte', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await startRoman(user);
  const regularInput = screen.getByLabelText(romanRound.prompt);
  await user.type(regularInput, 'X');
  const help = screen.getByRole('button', {
    name: 'Römische Zahlen verstehen',
  });
  await user.click(help);
  const guide = screen.getByRole('dialog', {
    name: 'Römische Zahlen verstehen',
  });
  expect(
    within(guide).getByRole('table', { name: 'Die römischen Zeichen' }),
  ).toBeVisible();
  expect(within(guide).queryByText(/XIV/)).not.toBeInTheDocument();
  for (let page = 0; page < 5; page++) {
    await user.click(within(guide).getByRole('button', { name: 'Weiter →' }));
  }
  expect(
    within(guide).getByRole('heading', { name: 'Rechnen: erst übersetzen' }),
  ).toBeVisible();
  expect(within(guide).getByText('XVI + XXVII = XLIII')).toBeVisible();
  fireEvent(guide, new Event('cancel', { cancelable: true }));
  expect(help).toHaveFocus();
  expect(regularInput).toHaveValue('X');
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );

  await user.click(screen.getByRole('button', { name: 'Zufallsübung 1–9999' }));
  const randomInput = await screen.findByLabelText(randomQuestion.prompt);
  await user.type(randomInput, 'XL');
  await user.click(
    screen.getByRole('button', { name: 'Römische Zahlen verstehen' }),
  );
  const randomGuide = screen.getByRole('dialog', {
    name: 'Römische Zahlen verstehen',
  });
  expect(
    within(randomGuide).getByRole('table', { name: 'Die römischen Zeichen' }),
  ).toBeVisible();
  for (let page = 0; page < 6; page++) {
    await user.click(
      within(randomGuide).getByRole('button', { name: 'Weiter →' }),
    );
  }
  expect(
    within(randomGuide).getByRole('heading', {
      name: 'Unsere Übung für 4000–9999',
    }),
  ).toBeVisible();
  expect(within(randomGuide).queryByText(/XLII/)).not.toBeInTheDocument();
  await user.click(
    within(randomGuide).getByRole('button', { name: 'Schließen' }),
  );
  expect(randomInput).toHaveValue('XL');
  expect(desktop.getRomanQuestion).toHaveBeenCalledTimes(1);
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  await user.type(randomInput, 'II{Enter}');
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    randomQuestion.id,
    'XLII',
  );
});
