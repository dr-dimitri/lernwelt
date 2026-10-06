import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import LearningPanel from './LearningPanel';
import { initial, mathQuestion } from '../test/learning-fixture';
import { desktop } from '../lib/desktop';
import type { StudyUnit } from '../domain/study';
import type { LearningState } from '../domain/learning';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    getProfile: vi.fn(),
    saveProfile: vi.fn(),
    setDifficulty: vi.fn(),
    submitAnswer: vi.fn(),
    redeemReward: vi.fn(),
  },
}));
const unit: StudyUnit = {
  id: 'length',
  areaId: 'units',
  subject: 'mathematics',
  grade: 5,
  name: 'Längen umrechnen',
  goal: 'Du wandelst Längen in andere Einheiten um.',
  keywords: ['Meter', 'Zentimeter'],
  curriculumRef: 'M5 4.1',
  source:
    'https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik',
  curriculumVersion: '02.10.2026',
  languageSequence: null,
  exerciseIds: Array.from({ length: 8 }, (_, i) => `length-${i}`).concat(
    'easy',
  ),
  supplements: [
    { kind: 'multiplication', label: 'Trainer öffnen', target: 'squares' },
  ],
};
function fixture(): LearningState {
  return {
    ...structuredClone(initial),
    studyCatalog: {
      version: 1,
      areas: [
        {
          id: 'units',
          subject: 'mathematics',
          name: 'Größen und Einheiten',
          curriculumRef: 'M5 4.1',
        },
      ],
      units: [unit],
    },
    questions: [
      ...Array.from({ length: 8 }, (_, i) => ({
        ...mathQuestion,
        id: `length-${i}`,
        prompt: `Wandle Länge ${i} um.`,
      })),
      { ...mathQuestion, id: 'easy', difficulty: 'vorschule' },
    ],
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(fixture());
  vi.mocked(desktop.setDifficulty).mockImplementation(async (d) => d);
  vi.mocked(desktop.submitAnswer).mockResolvedValue({
    correct: true,
    pointsAwarded: 2,
    explanation: 'So rechnest du um.',
    mistakeHint: null,
    wallet: initial.wallet,
  });
});
async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: /^Längen umrechnen/ }),
  );
}
it('führt direkt vom Fach zum Thema und zu einer Runde mit sechs Aufgaben', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await screen.findByRole('heading', { name: 'Was möchtest du üben?' });
  expect(
    screen.queryByRole('button', { name: 'Antwort prüfen' }),
  ).not.toBeInTheDocument();
  await start(user);
  expect(screen.getByLabelText('Wandle Länge 0 um.')).toBeVisible();
  expect(
    screen.getByText(/Aufgabe 1 von 6 in deiner kurzen Runde/),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: '← Themenübersicht' }));
  expect(
    screen.getByRole('button', { name: /^Längen umrechnen/ }),
  ).toHaveFocus();
});
it('findet Fachbegriffe und zeigt einen verständlichen Such-Leerzustand', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await user.type(
    await screen.findByRole('searchbox', { name: 'Thema suchen' }),
    'zentimeter',
  );
  expect(
    screen.getByRole('button', { name: /^Längen umrechnen/ }),
  ).toBeVisible();
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'xyz');
  expect(screen.getByText('Hier haben wir nichts gefunden.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Suche löschen' }));
  expect(
    screen.getByRole('button', { name: /^Längen umrechnen/ }),
  ).toBeVisible();
});
it('beendet die Runde ohne Endlosschleife und erlaubt übersprungene Aufgaben erneut', async () => {
  const user = userEvent.setup();
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await start(user);
  for (let i = 0; i < 6; i++)
    await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe →' }));
  expect(
    screen.getByRole('heading', { name: 'Deine Runde ist zu Ende!' }),
  ).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole('button', { name: 'Noch eine kurze Runde' }),
  );
  expect(screen.getByLabelText('Wandle Länge 0 um.')).toBeVisible();
});
it('erhält bei Speicherfehlern dieselbe Antwort und wechselt erst nach bestätigter Stufe', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockRejectedValueOnce(
    new Error('Speicherfehler'),
  );
  render(<LearningPanel subject="mathematics" profileVersion={0} />);
  await start(user);
  await user.type(screen.getByLabelText('Wandle Länge 0 um.'), '42');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  await screen.findByText('Richtig! +2 Punkte');
  expect(vi.mocked(desktop.submitAnswer).mock.calls[0]).toEqual(
    vi.mocked(desktop.submitAnswer).mock.calls[1],
  );
  await user.click(
    screen.getByRole('button', { name: 'Weiter zur nächsten Aufgabe' }),
  );
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  expect(await screen.findByLabelText(mathQuestion.prompt)).toHaveValue('');
});
it('öffnet verknüpfte Angebote mit dem konkreten Ziel', async () => {
  const user = userEvent.setup();
  const open = vi.fn();
  render(
    <LearningPanel
      subject="mathematics"
      profileVersion={0}
      onSupplement={open}
    />,
  );
  await start(user);
  await user.click(
    screen.getByRole('button', {
      name: 'Lernziel, Quellen und weitere Übungen',
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Trainer öffnen' }));
  expect(open).toHaveBeenCalledWith(unit.supplements[0]);
});

it('behält den Eingabefokus, wenn ein später Animationsframe ausgeführt wird', async () => {
  const frames: FrameRequestCallback[] = [];
  const raf = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
  try {
    const user = userEvent.setup();
    render(<LearningPanel subject="mathematics" profileVersion={0} />);
    await start(user);
    expect(screen.getByRole('generic', { name: 'Deine Übung' })).toHaveFocus();
    const input = screen.getByLabelText('Wandle Länge 0 um.');
    await user.type(input, '4');
    expect(input).toHaveFocus();
    act(() => {
      frames.splice(0).forEach((callback) => callback(0));
    });
    expect(input).toHaveFocus();
    await user.keyboard('2');
    expect(input).toHaveValue('42');
  } finally {
    raf.mockRestore();
  }
});

it('bestätigt ungesendete Eingaben vor Themenwechsel und erhält sie beim Bleiben', async () => {
  const user = userEvent.setup();
  const activity = vi.fn();
  render(
    <LearningPanel
      subject="mathematics"
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  await start(user);
  const input = screen.getByLabelText('Wandle Länge 0 um.');
  await user.type(input, '42');
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: false });
  await user.click(screen.getByRole('button', { name: 'Zu den Themen' }));
  expect(
    screen.getByRole('dialog', { name: 'Möchtest du wechseln?' }),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Bleiben' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Bleiben' }));
  expect(input).toHaveValue('42');
  expect(screen.getByRole('button', { name: 'Zu den Themen' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Zu den Themen' }));
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(
    screen.getByRole('button', { name: /^Längen umrechnen/ }),
  ).toHaveFocus();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});

it('hält Frage und Eingabe bei Tipp und Inlinefeedback stabil und zeigt genau eine Hauptaktion', async () => {
  const user = userEvent.setup();
  render(
    <LearningPanel subject="mathematics" profileVersion={0} externalControls />,
  );
  await start(user);
  const input = screen.getByLabelText('Wandle Länge 0 um.');
  await user.type(input, '42');
  await user.click(screen.getByRole('button', { name: 'Tipp' }));
  expect(screen.getByText(mathQuestion.hint)).toBeVisible();
  expect(input).toHaveValue('42');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  expect(screen.getByLabelText('Wandle Länge 0 um.')).toBe(input);
  expect(input).toHaveValue('42');
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
  expect(
    document.querySelectorAll('.exercise-main .primary-button'),
  ).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  expect(screen.getByLabelText('Wandle Länge 1 um.')).toHaveValue('');
});

it('sperrt die unklare Antwort nach Speicherfehler und versucht die identische Nutzlast erneut', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockRejectedValueOnce(
    new Error('Speichern fehlgeschlagen.'),
  );
  render(
    <LearningPanel subject="mathematics" profileVersion={0} externalControls />,
  );
  await start(user);
  const input = screen.getByLabelText('Wandle Länge 0 um.');
  await user.type(input, '42');
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen.',
  );
  expect(input).toHaveValue('42');
  expect(input).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
  expect(vi.mocked(desktop.submitAnswer).mock.calls[0]).toEqual(
    vi.mocked(desktop.submitAnswer).mock.calls[1],
  );
});

it('lädt inaktive Fächer nicht, behält beim Fachrückweg die Suche und fokussiert das Thema', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <LearningPanel
      subject="mathematics"
      profileVersion={0}
      externalControls
      active={false}
    />,
  );
  expect(desktop.getLearningState).not.toHaveBeenCalled();
  rerender(
    <LearningPanel
      subject="mathematics"
      profileVersion={0}
      externalControls
      active
    />,
  );
  await user.type(await screen.findByRole('searchbox'), 'Zentimeter');
  await start(user);
  await user.click(screen.getByRole('button', { name: 'Zu den Themen' }));
  rerender(
    <LearningPanel
      subject="mathematics"
      profileVersion={0}
      externalControls
      active={false}
    />,
  );
  rerender(
    <LearningPanel
      subject="mathematics"
      profileVersion={1}
      externalControls
      active
    />,
  );
  await waitFor(() => expect(screen.getByRole('searchbox')).toBeEnabled());
  expect(screen.getByRole('searchbox')).toHaveValue('Zentimeter');
  expect(
    screen.getByRole('button', { name: /^Längen umrechnen/ }),
  ).toHaveFocus();
});

it('zeigt im gewählten Lernweg den Spitznamenschritt und setzt nach gespeichertem Profil dasselbe Ziel fort', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockResolvedValueOnce({ ...fixture(), profileReady: false })
    .mockResolvedValueOnce(fixture());
  vi.mocked(desktop.getProfile).mockResolvedValue(null);
  vi.mocked(desktop.saveProfile).mockResolvedValue({
    displayName: 'Mia',
    grade: 5,
  });
  const saved = vi.fn();
  const { rerender } = render(
    <LearningPanel
      subject="mathematics"
      profileVersion={0}
      externalControls
      onProfileSaved={saved}
    />,
  );
  await start(user);
  expect(
    screen.getByRole('heading', { name: 'Längen umrechnen' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
  await user.type(await screen.findByLabelText('Name oder Spitzname'), 'Mia');
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(saved).toHaveBeenCalledOnce();
  rerender(
    <LearningPanel
      subject="mathematics"
      profileVersion={1}
      externalControls
      onProfileSaved={saved}
    />,
  );
  expect(await screen.findByLabelText('Wandle Länge 0 um.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeEnabled();
});

it('prüft nach fehlgeschlagenem Neuladen keine alte Aufgabe auf einer unbestätigten Ansicht', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockResolvedValueOnce(fixture())
    .mockRejectedValueOnce(
      new Error('Der neue Lernstand konnte nicht geladen werden.'),
    );
  const { rerender } = render(
    <LearningPanel subject="mathematics" profileVersion={0} externalControls />,
  );
  await start(user);
  rerender(
    <LearningPanel subject="mathematics" profileVersion={1} externalControls />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Der neue Lernstand konnte nicht geladen werden.',
  );
  expect(screen.getByLabelText('Wandle Länge 0 um.')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Erneut laden' })).toBeEnabled();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
