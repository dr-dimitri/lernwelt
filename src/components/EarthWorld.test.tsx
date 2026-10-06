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
import { desktop } from '../lib/desktop';
import { earthLayers } from '../domain/earth';
import {
  earthAnswerFor,
  earthInitial,
  earthQuestions,
  earthResultFor,
} from '../test/earth-fixture';
import EarthWorld from './EarthWorld';
vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    submitAnswer: vi.fn(),
    setDifficulty: vi.fn(),
    getLearningExplanation: vi.fn(),
    getProfile: vi.fn(),
    saveProfile: vi.fn(),
  },
}));
const questions = earthQuestions.filter((q) => q.difficulty === 'koenner');
const first = questions[0];
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getProfile).mockResolvedValue(null);
  vi.mocked(desktop.getLearningState).mockResolvedValue(
    structuredClone(earthInitial),
  );
  vi.mocked(desktop.submitAnswer).mockResolvedValue(earthResultFor(first));
  vi.mocked(desktop.getLearningExplanation).mockResolvedValue(
    earthResultFor(first).explanation,
  );
});
async function quiz(user: ReturnType<typeof userEvent.setup>) {
  render(<EarthWorld profileVersion={0} />);
  await screen.findByRole('button', { name: 'Könner' });
  await user.click(screen.getByRole('button', { name: 'Erdschichten üben' }));
}
it('erkundet alle Schichten, die fiktive Reise und beide Kernzustände ohne Punkte', async () => {
  const user = userEvent.setup();
  render(<EarthWorld profileVersion={0} />);
  for (const layer of earthLayers) {
    await user.click(screen.getByRole('button', { name: layer.name }));
    expect(screen.getByRole('article', { name: layer.name })).toHaveTextContent(
      layer.state,
    );
  }
  await user.click(screen.getByRole('button', { name: /Reise zur Mitte/ }));
  const range = screen.getByRole('slider');
  fireEvent.change(range, { target: { value: '1' } });
  expect(range).toHaveAttribute('aria-valuetext', 'Erdmantel');
  expect(screen.getByRole('article', { name: 'Erdmantel' })).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: /Heiß und trotzdem fest/ }),
  );
  await user.click(screen.getByRole('button', { name: 'Innerer Kern · fest' }));
  expect(
    screen.getByRole('article', { name: 'Innerer Erdkern' }),
  ).toHaveTextContent('Zusammendrücken');
  expect(
    screen.getByRole('img', { name: /fester innerer Kern/ }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Äußerer Kern · flüssig' }),
  );
  expect(screen.getByRole('img', { name: /flüssiges Metall/ })).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('bedient Grafikbereiche mit Tastatur und verrät keine Schichtnamen im Rätselmodell', async () => {
  const user = userEvent.setup();
  await quiz(user);
  const model = screen.getByLabelText(
    /aufgeschnittene Erdkugel mit Bereichen A bis D von außen nach innen/i,
  );
  for (const layer of earthLayers)
    expect(model).not.toHaveTextContent(layer.name);
  const marker = screen.getByRole('button', {
    name: `Bereich ${earthAnswerFor(first)} im Modell`,
  });
  marker.focus();
  await user.keyboard('{Enter}');
  expect(
    screen.getByRole('radio', { name: `Bereich ${earthAnswerFor(first)}` }),
  ).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    first.id,
    earthAnswerFor(first),
  );
  expect(await screen.findByText('Richtig! +2 Punkte')).toBeVisible();
});
it('prüft vollständige Reihenfolge einmal und bietet echte Entfernung/Reset', async () => {
  const user = userEvent.setup();
  const q = questions.find((q) => q.ordering)!;
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...earthInitial,
    questions: [q],
  });
  vi.mocked(desktop.submitAnswer).mockResolvedValue(earthResultFor(q));
  await quiz(user);
  await user.click(screen.getByRole('button', { name: q.ordering!.items[0] }));
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  await user.click(
    screen.getByRole('button', {
      name: `${q.ordering!.items[0]} aus der Reihenfolge entfernen`,
    }),
  );
  expect(
    within(
      screen.getByRole('list', { name: 'Deine Reihenfolge' }),
    ).queryAllByRole('listitem'),
  ).toHaveLength(0);
  for (const item of earthAnswerFor(q).split('|')) {
    const b = screen.getByRole('button', { name: item });
    b.focus();
    await user.keyboard('{Enter}');
  }
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(1);
  expect(desktop.submitAnswer).toHaveBeenCalledWith(
    expect.any(String),
    q.id,
    earthAnswerFor(q),
  );
});
it('friert beim unklaren Schreibfehler Eingabe ein und wiederholt denselben Request', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer)
    .mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'))
    .mockResolvedValueOnce(earthResultFor(first));
  await quiz(user);
  await user.click(
    screen.getByRole('radio', { name: `Bereich ${earthAnswerFor(first)}` }),
  );
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(
    screen.getByRole('radio', { name: `Bereich ${earthAnswerFor(first)}` }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Lösung zeigen · 0 Punkte' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(2);
  expect(vi.mocked(desktop.submitAnswer).mock.calls[0]).toEqual(
    vi.mocked(desktop.submitAnswer).mock.calls[1],
  );
});
it('sperrt Doppelklick und Wechsel während einer laufenden Übertragung', async () => {
  const user = userEvent.setup();
  let done!: (v: ReturnType<typeof earthResultFor>) => void;
  vi.mocked(desktop.submitAnswer).mockImplementation(
    () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  );
  await quiz(user);
  await user.click(
    screen.getByRole('radio', { name: `Bereich ${earthAnswerFor(first)}` }),
  );
  await user.dblClick(screen.getByRole('button', { name: 'Prüfen' }));
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Entdecken' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Vorschule' })).toBeDisabled();
  await act(async () => done(earthResultFor(first)));
});
it('lässt nach einer falschen Antwort ruhig erneut versuchen und deckt nur freiwillig auf', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer).mockResolvedValue(
    earthResultFor(first, false),
  );
  await quiz(user);
  await user.click(screen.getByRole('radio', { name: 'Bereich A' }));
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(
    await screen.findByText(
      'Noch nicht ganz. Probiere es in Ruhe noch einmal.',
    ),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Noch einmal versuchen' }),
  );
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Lösung zeigen · 0 Punkte' }),
  );
  expect(await screen.findByText('Dein Lösungsweg · 0 Punkte')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  expect(desktop.getLearningExplanation).toHaveBeenCalledExactlyOnceWith(
    first.id,
  );
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(1);
});
it('erhält Stufe/Eingabe bei fehlgeschlagenem Stufenwechsel und fragt vor Verwerfen', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.setDifficulty).mockRejectedValue(
    new Error('Stufe nicht gespeichert'),
  );
  await quiz(user);
  await user.click(screen.getByRole('radio', { name: 'Bereich A' }));
  await user.click(screen.getByRole('button', { name: 'Vorschule' }));
  expect(screen.getByRole('dialog', { name: 'Übung wechseln?' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Stufe nicht gespeichert',
  );
  expect(screen.getByRole('radio', { name: 'Bereich A' })).toBeChecked();
  expect(screen.getByRole('button', { name: 'Könner' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
it('zeigt bestehenden gelösten Stand und den kurzen Rundenabschluss', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...earthInitial,
    questions: [{ ...first, solved: true }],
  });
  vi.mocked(desktop.submitAnswer).mockResolvedValue({
    ...earthResultFor(first),
    pointsAwarded: 0,
  });
  await quiz(user);
  expect(screen.getByText(/Schon gelöst/)).toBeVisible();
  await user.click(
    screen.getByRole('radio', { name: `Bereich ${earthAnswerFor(first)}` }),
  );
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(
    await screen.findByText('Richtig! Diese Aufgabe hast du schon gelöst.'),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  expect(
    screen.getByRole('heading', { name: 'Zur Mitte und zurück!' }),
  ).toHaveFocus();
  expect(screen.getByText(/1 von 1 Aufgaben/)).toBeVisible();
});
it('erlaubt Entdecken ohne Profil und zeigt Laden/Browserfehler ehrlich mit Retry', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockRejectedValueOnce(new Error('Bitte Desktop-App öffnen.'))
    .mockResolvedValueOnce({ ...earthInitial, profileReady: false });
  render(<EarthWorld profileVersion={0} initialMode="quiz" />);
  expect(screen.getByRole('status')).toHaveTextContent('wird geladen');
  expect(await screen.findByRole('alert')).toHaveTextContent('Desktop-App');
  await user.click(screen.getByRole('button', { name: 'Entdecken' }));
  expect(screen.getByRole('article', { name: 'Erdkruste' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Erneut laden' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Könner' })).toBeVisible(),
  );
  await user.click(screen.getByRole('button', { name: 'Erdschichten üben' }));
  expect(screen.getByText(/Speichere dein Profil für Antworten/)).toBeVisible();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('bietet Bildfehler-Alternative, Retry, Escape und Fokusrückgabe im lokalen Erdfoto', async () => {
  const user = userEvent.setup();
  render(<EarthWorld profileVersion={0} />);
  await user.click(screen.getByRole('button', { name: 'Oberfläche ansehen' }));
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('status')).toHaveTextContent('Textalternative');
  await user.click(screen.getByRole('button', { name: 'Bild erneut laden' }));
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    '/images/solar-system/earth-pia00123.webp',
  );
  const trigger = screen.getByRole('button', { name: 'Erdfoto vergrößern' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Erdfoto in Großansicht' });
  expect(
    within(dialog).getByRole('button', { name: 'Schließen' }),
  ).toHaveFocus();
  fireEvent(dialog, new Event('cancel', { bubbles: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it.each(['diagram', 'order'])(
  'schützt ungeprüfte %s-Korrekturen nach einer falschen Antwort beim Wechsel',
  async (kind) => {
    const user = userEvent.setup();
    const q = questions.find((q) =>
      kind === 'diagram' ? q.earthDiagram : q.ordering,
    )!;
    vi.mocked(desktop.getLearningState).mockResolvedValue({
      ...earthInitial,
      questions: [q],
    });
    vi.mocked(desktop.submitAnswer).mockResolvedValue(earthResultFor(q, false));
    await quiz(user);
    if (q.ordering) {
      for (const item of q.ordering.items)
        await user.click(screen.getByRole('button', { name: item }));
    } else await user.click(screen.getByRole('radio', { name: 'Bereich A' }));
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    await screen.findByText(
      'Noch nicht ganz. Probiere es in Ruhe noch einmal.',
    );
    if (q.ordering)
      await user.click(
        screen.getByRole('button', {
          name: `${q.ordering.items[0]} aus der Reihenfolge entfernen`,
        }),
      );
    else {
      screen.getByRole('button', { name: 'Bereich C im Modell' }).focus();
      await user.keyboard('{Enter}');
    }
    await user.click(screen.getByRole('button', { name: 'Entdecken' }));
    expect(
      screen.getByRole('dialog', { name: 'Übung wechseln?' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Bleiben' }));
    expect(screen.getByRole('heading', { name: q.prompt })).toBeVisible();
  },
);
