import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { desktop } from './lib/desktop';
import { initial, mathQuestion } from './test/learning-fixture';
import { vocabularyInitial } from './test/vocabulary-fixture';
import { multiplicationInitial } from './test/multiplication-fixture';
import { missionInitial } from './test/mission-fixture';
import { solarInitial } from './test/solar-system-fixture';
import type { AnswerResult, LearningState } from './domain/learning';
vi.mock('./components/GamePreview', () => ({ default: () => null }));
vi.mock('./lib/desktop', () => ({
  desktop: {
    getProfile: vi.fn(),
    saveProfile: vi.fn(),
    getLearningState: vi.fn(),
    setDifficulty: vi.fn(),
    submitAnswer: vi.fn(),
    getArcadeState: vi.fn(),
    getVocabularyState: vi.fn(),
    getMultiplicationState: vi.fn(),
    getTypingState: vi.fn(),
    getMissionState: vi.fn(),
    startMission: vi.fn(),
    actMission: vi.fn(),
    redeemReward: vi.fn(),
  },
}));
function fixture(): LearningState {
  const state = structuredClone(initial);
  state.studyCatalog = {
    version: 1,
    areas: [
      {
        id: 'math-area',
        subject: 'mathematics',
        name: 'Größen',
        curriculumRef: 'M5',
      },
      {
        id: 'english-area',
        subject: 'english',
        name: 'Schule',
        curriculumRef: 'E5',
      },
    ],
    units: [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `math-unit-${i}`,
        areaId: 'math-area',
        subject: 'mathematics' as const,
        grade: 5,
        name: i === 0 ? 'Längen umrechnen' : `Mathethema ${i}`,
        goal: 'Längen in andere Einheiten umrechnen.',
        keywords: ['Meter'],
        curriculumRef: 'M5',
        source: 'LehrplanPLUS',
        curriculumVersion: '2026',
        languageSequence: null,
        exerciseIds: ['math', 'easy'],
        supplements: [],
      })),
      {
        id: 'english-unit',
        areaId: 'english-area',
        subject: 'english',
        grade: 5,
        name: 'Schulwörter',
        goal: 'Englische Wörter üben.',
        keywords: [],
        curriculumRef: 'E5',
        source: 'LehrplanPLUS',
        curriculumVersion: '2026',
        languageSequence: '1. Fremdsprache',
        exerciseIds: ['english'],
        supplements: [
          {
            kind: 'vocabulary',
            label: 'Schulwörter im Vokabeltrainer',
            target: 'school',
          },
        ],
      },
    ],
  };
  state.questions.push({
    ...mathQuestion,
    id: 'easy',
    difficulty: 'vorschule',
  });
  return state;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(fixture());
  vi.mocked(desktop.getProfile).mockResolvedValue({
    displayName: 'Alex',
    grade: 5,
  });
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(vocabularyInitial);
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(
    multiplicationInitial,
  );
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionInitial);
  vi.mocked(desktop.setDifficulty).mockImplementation(
    async (difficulty) => difficulty,
  );
});
it('bietet vier beschriftete Fächer und startet ein sichtbares Thema direkt', async () => {
  const user = userEvent.setup();
  render(<App />);
  const nav = screen.getByRole('navigation', { name: 'Lernwelt-Bereiche' });
  for (const name of [
    'Mathematik',
    'Englisch',
    'Natur und Technik',
    'Geographie',
    'Trainer & Spiele',
  ])
    expect(within(nav).getByRole('button', { name })).toBeVisible();
  expect(
    within(nav).getByRole('button', { name: 'Mathematik' }),
  ).toHaveAttribute('aria-current', 'page');
  await user.click(
    await screen.findByRole('button', { name: /Längen umrechnen/ }),
  );
  expect(screen.getByLabelText('Was ist 17 + 25?')).toBeVisible();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeVisible();
  expect(screen.getByLabelText('Deine Übung')).toHaveFocus();
});
it('erhält Suche, Filter, Seite und Rückfokus pro Fach während der Sitzung', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(
    await screen.findByRole('combobox', { name: 'Themen filtern' }),
    'math-area',
  );
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  await user.click(screen.getByRole('button', { name: /Mathethema 7/ }));
  await user.click(screen.getByRole('button', { name: 'Zu den Themen' }));
  expect(screen.getByRole('button', { name: /Mathethema 7/ })).toHaveFocus();
  expect(screen.getByText('Seite 2 von 2')).toBeVisible();
  await user.type(
    screen.getByRole('searchbox', { name: 'Thema suchen' }),
    'Meter',
  );
  await user.click(screen.getByRole('button', { name: 'Englisch' }));
  expect(
    await screen.findByRole('button', {
      name: /Schulwörter im Vokabeltrainer/,
    }),
  ).toBeVisible();
  await user.type(screen.getByRole('searchbox'), 'Schule');
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(await screen.findByRole('searchbox')).toHaveValue('Meter');
  expect(screen.getByRole('combobox', { name: 'Themen filtern' })).toHaveValue(
    'math-area',
  );
});
it('fragt bei ungesendeter Antwort vor Fachwechsel, mit Bleiben und Escape zum Ausgangspunkt', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    await screen.findByRole('button', { name: /Längen umrechnen/ }),
  );
  await user.type(screen.getByLabelText('Was ist 17 + 25?'), '41');
  const english = screen.getByRole('button', { name: 'Englisch' });
  await user.click(english);
  expect(screen.getByRole('dialog', { name: 'Wechseln?' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Bleiben' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(english).toHaveFocus();
  expect(screen.getByLabelText('Was ist 17 + 25?')).toHaveValue('41');
  await user.click(english);
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(
    await screen.findByRole('button', {
      name: /Schulwörter im Vokabeltrainer/,
    }),
  ).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('sperrt Navigation während Antwortübertragung und bietet Rückmeldung inline', async () => {
  const user = userEvent.setup();
  let resolve!: (answer: AnswerResult) => void;
  vi.mocked(desktop.submitAnswer).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<App />);
  await user.click(
    await screen.findByRole('button', { name: /Längen umrechnen/ }),
  );
  await user.type(screen.getByLabelText('Was ist 17 + 25?'), '42');
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(screen.getByRole('button', { name: 'Englisch' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Wird gespeichert …' }),
  ).toBeDisabled();
  await act(async () =>
    resolve({
      correct: true,
      pointsAwarded: 2,
      explanation: '17 + 25 = 42.',
      mistakeHint: null,
      wallet: initial.wallet,
    }),
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Richtig! +2 Punkte')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Weiter' })).toBeVisible();
});
it('behält bei gescheitertem Stufenwechsel bestätigte Stufe und Antwort', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.setDifficulty).mockRejectedValue(
    new Error('Speichern fehlgeschlagen'),
  );
  render(<App />);
  await user.click(
    await screen.findByRole('button', { name: /Längen umrechnen/ }),
  );
  await user.type(screen.getByLabelText('Was ist 17 + 25?'), '41');
  await user.click(screen.getByRole('button', { name: 'Stufe: Könner' }));
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(screen.getByRole('button', { name: 'Stufe: Könner' })).toBeVisible();
  expect(screen.getByLabelText('Was ist 17 + 25?')).toHaveValue('41');
});
it('öffnet erst den Spitznamenschritt im gewählten Ziel und kehrt nach Speichern dorthin zurück', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...fixture(),
    profileReady: false,
  });
  vi.mocked(desktop.getProfile).mockResolvedValue(null);
  vi.mocked(desktop.saveProfile).mockImplementation(async (profile) => {
    vi.mocked(desktop.getLearningState).mockResolvedValue(fixture());
    return profile;
  });
  render(<App />);
  await user.click(
    await screen.findByRole('button', { name: /Längen umrechnen/ }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('textbox', { name: 'Name oder Spitzname' }),
    ).toBeEnabled(),
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Name oder Spitzname' }),
    'Mia',
  );
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(await screen.findByLabelText('Was ist 17 + 25?')).toBeVisible();
  expect(desktop.saveProfile).toHaveBeenCalledWith({
    displayName: 'Mia',
    grade: 5,
  });
});
it('öffnet konkrete Trainerziele und beide Geographiemodi', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('searchbox');
  await user.click(screen.getByRole('button', { name: 'Trainer & Spiele' }));
  for (const name of [
    'Vokabeltrainer',
    'Einmaleins-Trainer',
    'Tastschreiben',
    'Naturspiele',
    'Spielhalle',
  ])
    expect(
      screen.getByRole('button', { name: new RegExp(name) }),
    ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: /Einmaleins-Trainer.*Malnehmen/ }),
  );
  expect(
    await screen.findByRole('heading', { name: '2 × 8 = ?' }),
  ).toBeVisible();
  vi.mocked(desktop.getLearningState).mockResolvedValue(solarInitial);
  await user.click(screen.getByRole('button', { name: 'Geographie' }));
  await user.click(screen.getByRole('button', { name: /Planeten erraten/ }));
  expect(await screen.findByText('Wie heißt dieser Planet?')).toBeVisible();
});
it('schließt das beschriftete Menü mit Escape und gibt den Fokus zurück', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));
  screen.getByRole('button', { name: 'Englisch' }).focus();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

it('fragt vor einer Sammlungsmutation und erhält die Antwort bei Bleiben', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...fixture(),
    wallet: { ...initial.wallet, balance: 40 },
  });
  render(<App />);
  await user.click(
    await screen.findByRole('button', { name: /Längen umrechnen/ }),
  );
  await user.type(screen.getByLabelText('Was ist 17 + 25?'), '41');
  await user.click(
    screen.getByRole('button', { name: 'Sammlung & Abzeichen' }),
  );
  await user.click(
    await screen.findByRole('button', { name: '20 Punkte · Einlösen' }),
  );
  await user.click(screen.getByRole('button', { name: 'Bleiben' }));
  expect(desktop.redeemReward).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  expect(screen.getByLabelText('Was ist 17 + 25?')).toHaveValue('41');
});
it('sperrt Profil-Dialogschließen und globale Navigation während einer Speicherung', async () => {
  const user = userEvent.setup();
  let resolve!: (profile: { displayName: string; grade: number }) => void;
  vi.mocked(desktop.saveProfile).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<App />);
  await screen.findByRole('button', { name: /Längen umrechnen/ });
  await user.click(screen.getByRole('button', { name: 'Dein Profil' }));
  await waitFor(() =>
    expect(
      screen.getByRole('textbox', { name: 'Name oder Spitzname' }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
  expect(screen.getByRole('button', { name: 'Schließen' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Englisch' })).toBeDisabled();
  const dialog = screen.getByRole('dialog', { name: 'Dein Profil' });
  dialog.dispatchEvent(
    new Event('cancel', { bubbles: true, cancelable: true }),
  );
  expect(dialog).toBeVisible();
  await act(async () => resolve({ displayName: 'Alex', grade: 5 }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeEnabled(),
  );
});

it('hält andere Bereiche bei hängenden Lesedaten erreichbar', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockImplementation(
    () => new Promise(() => {}),
  );
  render(<App />);
  expect(
    screen.getByRole('button', { name: 'Trainer & Spiele' }),
  ).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Trainer & Spiele' }));
  await user.click(screen.getByRole('button', { name: /Vokabeltrainer/ }));
  expect(await screen.findByLabelText('Deine englische Antwort')).toBeVisible();
});
