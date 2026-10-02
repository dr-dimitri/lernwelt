import { act, render, screen } from '@testing-library/react';
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
    await screen.findByRole('button', { name: /Größen und Einheiten/ }),
  );
  await user.click(screen.getByRole('button', { name: /Längen umrechnen/ }));
}
it('führt vom Fach über Bereich und Unterthema zu einer Runde mit sechs Aufgaben', async () => {
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
    screen.getByRole('heading', { name: 'Was möchtest du üben?' }),
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
    screen.getByRole('button', { name: /Längen umrechnen/ }),
  ).toBeVisible();
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'xyz');
  expect(screen.getByText('Hier haben wir nichts gefunden.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Suche löschen' }));
  expect(
    screen.getByRole('button', { name: /Größen und Einheiten/ }),
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
