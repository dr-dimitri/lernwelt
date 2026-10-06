import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import type { AnswerResult } from '../domain/learning';
import { cellQuestions } from '../domain/cells';
import { cellFixture, cellExercises } from '../test/cell-fixture';
import { desktop } from '../lib/desktop';
import CellWorld from './CellWorld';
import StudyBrowser from './StudyBrowser';
vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    submitAnswer: vi.fn(),
    setDifficulty: vi.fn(),
    getLearningExplanation: vi.fn(),
  },
}));
const bank = cellQuestions(cellFixture.questions, 'koenner');
const first = bank[0];
const correct = cellExercises.find((q) => q.id === first.id)!.answer;
function answerResult(isCorrect = true, points = 2): AnswerResult {
  return {
    correct: isCorrect,
    pointsAwarded: points,
    explanation: 'Die Zellmembran begrenzt die ganze Zelle.',
    mistakeHint: null,
    wallet: { ...cellFixture.wallet, balance: 10 + points },
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(
    structuredClone(cellFixture),
  );
  vi.mocked(desktop.submitAnswer).mockResolvedValue(answerResult());
  vi.mocked(desktop.getLearningExplanation).mockResolvedValue(
    'Die Zellmembran begrenzt die ganze Zelle.',
  );
});
async function quiz(user: ReturnType<typeof userEvent.setup>) {
  render(<CellWorld profileVersion={0} />);
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: 'Zellrätsel' }));
}
it('erkundet Zelltypen, Zellteile, Detailmodell und die Anleitungsfolge mit Tastatur', async () => {
  const user = userEvent.setup();
  render(<CellWorld profileVersion={0} />);
  await screen.findByRole('button', { name: 'Könner' });
  const membrane = screen.getByRole('button', {
    name: 'Zellmembran im Modell',
  });
  membrane.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: 'Zellmembran' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Pflanzenzelle' }));
  expect(
    screen.getByRole('button', { name: 'Zellwand im Modell' }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Vakuole' }));
  expect(screen.getByRole('heading', { name: 'Vakuole' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Reise zum Zellkern' }));
  expect(
    screen.getByRole('button', { name: 'Kernhülle im Modell' }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Erbinformation im Modell' }),
  );
  expect(screen.getByRole('heading', { name: 'Erbinformation' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: '3. Erbinformation' }));
  expect(screen.getByText(/keine echten Bücher/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Zur Gesamtzelle' }));
  expect(screen.getByRole('heading', { name: 'Winzige Welt' })).toHaveFocus();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('vergleicht die echte Aufnahme, zeigt Markierungen und führt Fokus aus der Großansicht zurück', async () => {
  const user = userEvent.setup();
  render(<CellWorld profileVersion={0} />);
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: /Forscherblick/ }));
  const image = screen.getByRole('img', { name: /Lichtmikroskopaufnahme/ });
  expect(image).toHaveAttribute('src', '/images/cells/cheek-cells.jpg');
  fireEvent.load(image);
  await user.click(
    screen.getByRole('button', { name: 'Markierung einblenden' }),
  );
  expect(screen.getByText('Zellkern', { selector: 'text' })).toBeVisible();
  const trigger = screen.getByRole('button', { name: 'Bild vergrößern' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', {
    name: 'Wangenzellen vergrößert',
  });
  expect(
    within(dialog).getByRole('button', { name: 'Schließen' }),
  ).toHaveFocus();
  fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
  expect(trigger).toHaveFocus();
  fireEvent.error(image);
  expect(screen.getByRole('alert')).toHaveTextContent('Textbeobachtung');
  await user.click(screen.getByRole('button', { name: 'Bild erneut laden' }));
  const reloaded = screen.getByRole('img', { name: /Lichtmikroskopaufnahme/ });
  fireEvent.load(reloaded);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('bindet beide ursprünglichen Aktivitäten ohne Bewertung ein', async () => {
  const user = userEvent.setup();
  render(<CellWorld profileVersion={0} />);
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: /Forscherzeichnung/ }));
  expect(
    screen.getByRole('heading', { name: 'Eine Zelle als Modell' }),
  ).toBeVisible();
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  await user.click(
    screen.getByRole('button', { name: 'Leben oder Bewegung?' }),
  );
  expect(
    screen.getByRole('heading', { name: 'Leben oder Bewegung?' }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Meine Selbstkontrolle' }),
  );
  expect(screen.getByText(/Ein Baum läuft nicht/)).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('zeigt im Rätsel keinen Lösungsschlüssel im Bild und speichert nur die gewählte Antwort', async () => {
  const user = userEvent.setup();
  await quiz(user);
  expect(screen.getByRole('heading', { name: first.prompt })).toHaveFocus();
  const art = screen.getByRole('complementary', { name: 'Bild zur Aufgabe' });
  expect(
    within(art).queryByRole('button', { name: /Zellmembran/ }),
  ).not.toBeInTheDocument();
  expect(art).not.toHaveTextContent('Zellmembran');
  await user.click(screen.getByRole('radio', { name: correct }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Richtig! +2 Punkte',
  );
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    first.id,
    correct,
  );
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  expect(screen.getByRole('heading', { name: bank[1].prompt })).toHaveFocus();
});
it('erlaubt falschen Versuch, Hilfe und erneuten Versuch ohne erfundenen Erfolg', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockResolvedValueOnce(answerResult(false, 0));
  await quiz(user);
  await user.click(screen.getByRole('button', { name: 'Gib mir einen Tipp' }));
  expect(screen.getByText(first.hint)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await user.click(
    screen.getByRole('radio', {
      name: first.options.find((o) => o !== correct)!,
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Noch nicht ganz',
  );
  await user.click(
    screen.getByRole('button', { name: 'Noch einmal versuchen' }),
  );
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: correct }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Richtig!');
});
it('wiederholt bei einem Speicherfehler dieselbe Request-ID und wartet auf bestätigte Punkte', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockRejectedValueOnce(
    new Error('Speichern fehlgeschlagen'),
  );
  await quiz(user);
  await user.click(screen.getByRole('radio', { name: correct }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(screen.getByRole('radio', { name: correct })).toBeChecked();
  const call = vi.mocked(desktop.submitAnswer).mock.calls[0];
  await user.click(screen.getByRole('button', { name: 'Erneut speichern' }));
  expect(await screen.findByRole('status')).toHaveTextContent('+2 Punkte');
  expect(vi.mocked(desktop.submitAnswer).mock.calls[1]).toEqual(call);
});
it('sperrt Navigation während einer laufenden Speicherung', async () => {
  const user = userEvent.setup();
  let resolve!: (value: AnswerResult) => void;
  vi.mocked(desktop.submitAnswer).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const activity = vi.fn();
  render(<CellWorld profileVersion={0} onActivityChange={activity} />);
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: 'Zellrätsel' }));
  await user.click(screen.getByRole('radio', { name: correct }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(screen.getByRole('button', { name: 'Entdecken' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Weiter' })).toBeDisabled();
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: true });
  await act(async () => resolve(answerResult()));
  expect(activity).toHaveBeenLastCalledWith({ dirty: false, busy: false });
});
it('deckt freiwillig ohne Antwortbuchung auf und erlaubt erst spätere Aufgaben zu bewerten', async () => {
  const user = userEvent.setup();
  await quiz(user);
  await user.click(
    screen.getByRole('button', { name: 'Lösung aufdecken · 0 Punkte' }),
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Aufgedeckt · keine Punkte',
  );
  expect(desktop.getLearningExplanation).toHaveBeenCalledWith(first.id);
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: correct })).toBeDisabled();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  expect(
    screen.getByRole('button', { name: 'Lösung aufdecken · 0 Punkte' }),
  ).toBeEnabled();
});
it('erhält nach Fehler die gewählte Stufe und wechselt nach Bestätigung frei', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.setDifficulty)
    .mockRejectedValueOnce(new Error('Stufe nicht gespeichert'))
    .mockResolvedValueOnce('vorschule');
  await quiz(user);
  await user.click(screen.getByRole('radio', { name: correct }));
  await user.click(screen.getByRole('button', { name: 'Vorschule' }));
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Stufe nicht gespeichert',
  );
  expect(screen.getByRole('radio', { name: correct })).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Vorschule' }));
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Vorschule' })).toHaveAttribute(
      'aria-pressed',
      'true',
    ),
  );
  expect(screen.getByText(/bringt 1 Punkt/)).toBeVisible();
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
});
it('schließt nach sechs Aufgaben ab und macht die übrigen Aufgaben erreichbar', async () => {
  const user = userEvent.setup();
  await quiz(user);
  for (let i = 0; i < 6; i++)
    await user.click(
      screen.getByRole('button', {
        name: i === 5 ? 'Runde abschließen' : 'Weiter',
      }),
    );
  expect(
    screen.getByRole('heading', { name: 'Eine Forscherpause für dich!' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Weitere Zellrätsel' }));
  expect(screen.getByRole('heading', { name: bank[6].prompt })).toHaveFocus();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('lässt bei IPC-Ladefehler frei entdecken und lädt nach Retry echte Rätsel', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockRejectedValueOnce(new Error('Daten nicht verfügbar'))
    .mockResolvedValueOnce(cellFixture);
  render(<CellWorld profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Daten nicht verfügbar',
  );
  await user.click(screen.getByRole('button', { name: 'Pflanzenzelle' }));
  expect(screen.getByRole('button', { name: 'Zellwand' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Erneut laden' }));
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: 'Zellrätsel' }));
  expect(screen.getByRole('heading', { name: first.prompt })).toBeVisible();
});
it('bewertet ohne Profil keine Antworten und bewahrt bestätigte Alt-Erstlösungen', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValueOnce({
    ...cellFixture,
    profileReady: false,
  });
  const { rerender } = render(<CellWorld profileVersion={0} />);
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: 'Zellrätsel' }));
  expect(screen.getByRole('radio', { name: correct })).toBeDisabled();
  expect(screen.getByText(/Speichere oben/)).toBeVisible();
  const known = structuredClone(cellFixture);
  known.questions.find((q) => q.id === bank[1].id)!.solved = true;
  vi.mocked(desktop.getLearningState).mockResolvedValueOnce(known);
  rerender(<CellWorld profileVersion={1} />);
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: correct })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  expect(screen.getByText(/Schon gelöst · Wiederholen/)).toBeVisible();
});
it('öffnet das Modul direkt sowie über die vorhandene Zellthemenwahl', async () => {
  const user = userEvent.setup();
  const onCells = vi.fn(),
    onSelect = vi.fn();
  render(
    <StudyBrowser
      state={cellFixture}
      subject="nature"
      disabled={false}
      onSelect={(unit) =>
        unit.id === 'nature-cells' ? onCells() : onSelect(unit)
      }
      onCells={onCells}
    />,
  );
  await user.click(screen.getByRole('button', { name: /Expedition Zellkern/ }));
  expect(onCells).toHaveBeenCalledTimes(1);
  await user.type(screen.getByRole('searchbox'), 'Zellen');
  await user.click(
    screen.getByRole('button', { name: /Zellen und Lebewesen/ }),
  );
  expect(onCells).toHaveBeenCalledTimes(2);
});

it('hält bei fehlendem Prüfbild die gleiche Aufgabe und den schriftlichen Antwortweg erreichbar', async () => {
  const user = userEvent.setup();
  await quiz(user);
  await user.click(screen.getByRole('button', { name: /^Forscherblick/ }));
  const question = cellExercises.find(
    (q) => q.id === 'by.nature.5.nucleus.koenner.04.v1',
  )!;
  expect(screen.getByRole('heading', { name: question.prompt })).toBeVisible();
  fireEvent.error(screen.getByRole('img', { name: /Lichtmikroskopaufnahme/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('dunkler ovaler Bereich');
  expect(
    screen.getByRole('img', { name: /Vereinfachter Ersatz/ }),
  ).toBeVisible();
  await user.click(screen.getByRole('radio', { name: question.answer }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    question.id,
    question.answer,
  );
});

it('behält nach einem Fehler beim Aufdecken die Aufgabe und lässt die Erklärung erneut laden', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningExplanation)
    .mockRejectedValueOnce(new Error('Lösung nicht verfügbar'))
    .mockResolvedValueOnce('Erklärung');
  await quiz(user);
  await user.click(
    screen.getByRole('button', { name: 'Lösung aufdecken · 0 Punkte' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Lösung nicht verfügbar',
  );
  expect(screen.getByRole('radio', { name: correct })).toBeEnabled();
  await user.click(
    screen.getByRole('button', { name: 'Lösung aufdecken · 0 Punkte' }),
  );
  expect(await screen.findByRole('status')).toHaveTextContent('Erklärung');
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
