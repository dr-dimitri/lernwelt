import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import VocabularyPanel from './VocabularyPanel';
import { desktop } from '../lib/desktop';
import { vocabularyInitial as initial } from '../test/vocabulary-fixture';
import type {
  VocabularyReviewResult,
  VocabularyState,
} from '../domain/vocabulary';
vi.mock('../lib/desktop', () => ({
  desktop: {
    getVocabularyState: vi.fn(),
    reviewVocabulary: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));
const done: VocabularyState = {
  ...initial,
  card: null,
  newCount: 0,
  total: 1,
  boxes: [0, 1, 0, 0, 0],
  nextDueAt: 1_800_000_000,
  wallet: { ...initial.wallet, balance: 9, totalEarned: 29 },
};
const success: VocabularyReviewResult = {
  state: done,
  boxNumber: 2,
  dueAt: 1_800_000_000,
  correct: true,
  pointsAwarded: 1,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(initial);
  vi.mocked(desktop.reviewVocabulary).mockResolvedValue(success);
});
it('prüft die Eingabe per Enter, zeigt erst danach die Lösung und aktualisiert das Guthaben', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine englische Antwort');
  expect(screen.queryByText('I say hello.')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Gewusst' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '8 Punkte',
  );
  await user.type(field, 'HELLO{Enter}');
  expect(desktop.reviewVocabulary).toHaveBeenCalledWith(
    expect.objectContaining({
      cardId: 'hello',
      deckId: 'all',
      difficulty: 'koenner',
      expectedReviews: 0,
      answer: 'HELLO',
    }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Richtig! +1 Punkt' }),
  ).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '9 Punkte',
  );
  expect(screen.getByText('I say hello.')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(done);
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  await waitFor(() =>
    expect(screen.getByText('Für jetzt geschafft!')).toHaveFocus(),
  );
  expect(screen.getByText(/Nächste Wiederholung:/)).toBeVisible();
  expect(desktop.reviewVocabulary).toHaveBeenCalledTimes(1);
});
it('lässt nach der Rückmeldung und nächsten Karte direkt per Tastatur weiterüben', async () => {
  const user = userEvent.setup();
  const next: VocabularyState = {
    ...initial,
    card: {
      ...initial.card!,
      card: {
        ...initial.card!.card,
        id: 'goodbye',
        english: 'goodbye',
        german: 'auf Wiedersehen',
      },
    },
  };
  vi.mocked(desktop.getVocabularyState)
    .mockResolvedValueOnce(initial)
    .mockResolvedValue(next);
  vi.mocked(desktop.reviewVocabulary)
    .mockResolvedValueOnce({ ...success, state: next })
    .mockResolvedValue(success);
  render(<VocabularyPanel profileVersion={0} />);
  await user.type(
    await screen.findByLabelText('Deine englische Antwort'),
    'hello{Enter}',
  );
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Richtig! +1 Punkt' }),
    ).toHaveFocus(),
  );
  await user.tab();
  expect(screen.getByRole('button', { name: 'Weiter' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'auf Wiedersehen' }),
  ).toBeVisible();
  await waitFor(() =>
    expect(screen.getByLabelText('Deine englische Antwort')).toHaveFocus(),
  );
  await user.keyboard('goodbye{Enter}');
  expect(desktop.reviewVocabulary).toHaveBeenLastCalledWith(
    expect.objectContaining({ cardId: 'goodbye', answer: 'goodbye' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Richtig! +1 Punkt' }),
    ).toHaveFocus(),
  );
});
it('behält Eingabe und bewusst gewählten Fokus bei unverändertem Zustand', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<VocabularyPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine englische Antwort');
  await user.type(field, 'helo{ArrowLeft}l');
  expect(field).toHaveValue('hello');
  expect(field).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toHaveFocus();
  rerender(<VocabularyPanel profileVersion={0} />);
  expect(screen.getByRole('button', { name: 'Prüfen' })).toHaveFocus();
  expect(field).toHaveValue('hello');
});
it('zeigt eine falsche Lösung ohne Punkte und erlaubt bewusstes Aufdecken ohne Antwort', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.reviewVocabulary).mockResolvedValue({
    ...success,
    correct: false,
    pointsAwarded: 0,
    boxNumber: 1,
    state: { ...done, wallet: initial.wallet },
  });
  render(<VocabularyPanel profileVersion={0} />);
  await user.type(
    await screen.findByLabelText('Deine englische Antwort'),
    'cat',
  );
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(
    await screen.findByText('Noch nicht ganz – wir üben das wieder!'),
  ).toBeVisible();
  expect(screen.getByText('hello', { selector: 'strong' })).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '8 Punkte',
  );
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  await user.click(await screen.findByRole('button', { name: 'Hilfe' }));
  await user.click(
    await screen.findByRole('button', {
      name: 'Lösung zeigen',
    }),
  );
  expect(desktop.reviewVocabulary).toHaveBeenLastCalledWith(
    expect.objectContaining({ answer: null }),
  );
  expect(await screen.findByText(/Kein Punkteabzug/)).toBeVisible();
});
it('behält nach Speicherfehler Antwort und Request und verhindert doppelte Punkte', async () => {
  const user = userEvent.setup();
  let resolve!: (value: VocabularyReviewResult) => void;
  vi.mocked(desktop.reviewVocabulary)
    .mockRejectedValueOnce(new Error('Transportfehler'))
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
  render(<VocabularyPanel profileVersion={0} />);
  await user.type(
    await screen.findByLabelText('Deine englische Antwort'),
    'hello',
  );
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Transportfehler');
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '8 Punkte',
  );
  expect(screen.getByLabelText('Deine englische Antwort')).toHaveValue('hello');
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  expect(screen.getByLabelText('Dein Wortthema')).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(
    screen.getByRole('button', { name: 'Wird gespeichert …' }),
  ).toBeDisabled();
  expect(vi.mocked(desktop.reviewVocabulary).mock.calls[0]).toEqual(
    vi.mocked(desktop.reviewVocabulary).mock.calls[1],
  );
  await act(async () => resolve(success));
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '9 Punkte',
  );
});
it.each(['hello\t', 'he\u000blo', 'hello\u007f', 'hello\u0085', 'hello\u009f'])(
  'lässt eingefügte Steuerzeichen vor dem Speichern korrigieren: %j',
  async (pasted) => {
    const user = userEvent.setup();
    render(<VocabularyPanel profileVersion={0} />);
    const field = await screen.findByLabelText('Deine englische Antwort');
    await user.click(field);
    await user.paste(pasted);
    expect(field).toHaveValue(pasted);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));

    expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'unsichtbares Sonderzeichen',
    );
    expect(field).toBeEnabled();
    expect(field).toHaveFocus();
    expect(field).toHaveValue(pasted);
    expect(
      screen.queryByRole('button', { name: 'Erneut versuchen' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Hilfe',
      }),
    ).toBeEnabled();

    await user.clear(field);
    await user.type(field, 'hello{Enter}');
    expect(desktop.reviewVocabulary).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ answer: 'hello' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Richtig! +1 Punkt' }),
      ).toHaveFocus(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);
it('wechselt die Antwortrichtung und zeigt Satzlücken ohne alten Fortschritt oder Antwort', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await user.type(
    await screen.findByLabelText('Deine englische Antwort'),
    'alt',
  );
  vi.mocked(desktop.setDifficulty).mockResolvedValue('vorschule');
  vi.mocked(desktop.getVocabularyState).mockResolvedValue({
    ...initial,
    difficulty: 'vorschule',
  });
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(
    await screen.findByLabelText('Deine deutsche Übersetzung'),
  ).toHaveValue('');
  expect(screen.getByText('I say hello.')).toBeVisible();
  expect(desktop.setDifficulty).toHaveBeenCalledWith('vorschule');
  vi.mocked(desktop.setDifficulty).mockResolvedValue('streber');
  vi.mocked(desktop.getVocabularyState).mockResolvedValue({
    ...initial,
    difficulty: 'streber',
  });
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(
    await screen.findByRole('heading', { name: 'I say ___.' }),
  ).toBeVisible();
  expect(screen.getByText('Gesuchtes Wort: hallo')).toBeVisible();
  expect(screen.getByLabelText('Deine englische Antwort')).toHaveValue('');
});
it('lädt Themen neu und entfernt alte Rückmeldungen', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await user.type(
    await screen.findByLabelText('Deine englische Antwort'),
    'hello{Enter}',
  );
  await screen.findByText('Richtig! +1 Punkt');
  await user.selectOptions(screen.getByLabelText('Dein Wortthema'), 'family');
  await screen.findByLabelText('Deine englische Antwort');
  expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('family');
  expect(screen.queryByText('Richtig! +1 Punkt')).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Fällige Karten laden' }),
  );
  await waitFor(() =>
    expect(desktop.getVocabularyState).toHaveBeenCalledTimes(3),
  );
});
it('zeigt Profilhinweis und lässt einen Ladefehler erneut versuchen', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getVocabularyState).mockRejectedValueOnce(
    new Error('Ladefehler'),
  );
  render(<VocabularyPanel profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Ladefehler');
  vi.mocked(desktop.getVocabularyState).mockResolvedValue({
    ...initial,
    profileReady: false,
    card: null,
  });
  await user.click(screen.getByRole('button', { name: 'Karten neu laden' }));
  expect(await screen.findByText(/Speichere dein Lernprofil/)).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
});
it('verwirft veraltete Ladeantworten nach einer Profiländerung', async () => {
  let resolve!: (value: VocabularyState) => void;
  vi.mocked(desktop.getVocabularyState).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { rerender } = render(<VocabularyPanel profileVersion={0} />);
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(done);
  rerender(<VocabularyPanel profileVersion={1} />);
  expect(await screen.findByText('Für jetzt geschafft!')).toBeVisible();
  await act(async () => resolve(initial));
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
});
it('zeigt nach fehlgeschlagenem Stufenwechsel keine veraltete Karte als aktuell', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByRole('button', { name: 'Prüfen' });
  vi.mocked(desktop.setDifficulty).mockRejectedValueOnce(
    new Error('Speicherfehler'),
  );
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Karten neu laden' }));
  expect(await screen.findByRole('button', { name: 'Prüfen' })).toBeVisible();
});

it('öffnet das verknüpfte Wortthema und erlaubt danach eine eigene Auswahl', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} initialDeck="hello" />);
  await screen.findByLabelText('Deine englische Antwort');
  expect(desktop.getVocabularyState).toHaveBeenCalledWith('hello');
  expect(screen.getByLabelText('Dein Wortthema')).toHaveValue('hello');
  await user.selectOptions(screen.getByLabelText('Dein Wortthema'), 'all');
  await waitFor(() =>
    expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all'),
  );
});

it('bewahrt beim abgebrochenen Hörmoduswechsel die Übersetzung und meldet sie an die Navigation', async () => {
  const user = userEvent.setup();
  const activity = vi.fn();
  render(
    <VocabularyPanel
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  const field = await screen.findByLabelText('Deine englische Antwort');
  await waitFor(() => expect(field).toHaveFocus());
  expect(
    screen.queryByLabelText('Schwierigkeitsgrad für alle Fächer'),
  ).not.toBeInTheDocument();
  await user.type(field, 'hello');
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: false });
  const listen = screen.getByRole('button', { name: '3 Wörter hören' });
  await user.click(listen);
  expect(screen.getByRole('button', { name: 'Bleiben' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(listen).toHaveFocus();
  expect(field).toHaveValue('hello');
  expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
});

it('hält andere Fächer erreichbar, solange nur die Modul-Daten geladen werden', () => {
  vi.mocked(desktop.getVocabularyState).mockImplementation(
    () => new Promise(() => {}),
  );
  const activity = vi.fn();
  render(
    <VocabularyPanel
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  expect(activity).toHaveBeenLastCalledWith({ dirty: false, busy: false });
});

it('übt Buchstabensalat auf Englisch, nutzt einzelne Kärtchen und behält Mischung bei Tipps und Retry', async () => {
  const user = userEvent.setup();
  const apple = {
    ...initial,
    card: {
      ...initial.card!,
      card: {
        ...initial.card!.card,
        id: 'apple',
        english: 'apple',
        german: 'Apfel',
        example: 'I eat an apple.',
        cloze: 'I eat an ___.',
      },
    },
  };
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(apple);
  vi.mocked(desktop.reviewVocabulary)
    .mockRejectedValueOnce(new Error('Salat speichern fehlgeschlagen'))
    .mockResolvedValue(success);
  const { rerender } = render(<VocabularyPanel profileVersion={0} />);
  await screen.findByLabelText('Deine englische Antwort');
  await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
  await screen.findByRole('group', { name: 'Buchstabenkärtchen' });
  expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all', {
    mode: 'scramble',
    previousCardId: 'apple',
  });
  const mixed = screen.getByLabelText('Gemischte Buchstaben').textContent;
  expect(mixed).not.toBe('apple');
  expect(screen.queryByText('I eat an apple.')).not.toBeInTheDocument();
  const pTiles = screen.getAllByRole('button', { name: /^Buchstabe p/ });
  expect(pTiles).toHaveLength(2);
  await user.click(pTiles[0]);
  expect(pTiles[0]).toBeDisabled();
  expect(pTiles[1]).toBeEnabled();
  await user.click(
    screen.getByRole('button', { name: 'Letzten Buchstaben entfernen' }),
  );
  expect(pTiles[0]).toBeEnabled();
  expect(screen.getByLabelText('Deine englische Antwort')).toHaveValue('');
  await user.click(screen.getByRole('button', { name: 'Hilfe' }));
  await user.click(
    screen.getByRole('button', { name: 'Anfangsbuchstaben-Tipp' }),
  );
  expect(screen.getByText(/Das Wort beginnt mit/)).toHaveTextContent('a');
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  rerender(<VocabularyPanel profileVersion={0} />);
  expect(screen.getByLabelText('Gemischte Buchstaben')).toHaveTextContent(
    mixed!,
  );
  await user.type(
    screen.getByLabelText('Deine englische Antwort'),
    'APPLE{Enter}',
  );
  await screen.findByText('Salat speichern fehlgeschlagen');
  expect(screen.getByLabelText('Gemischte Buchstaben')).toHaveTextContent(
    mixed!,
  );
  expect(
    screen.getByRole('button', { name: 'Buchstabensalat' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Karten neu laden' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  await screen.findByText('Richtig! +1 Punkt');
  expect(vi.mocked(desktop.reviewVocabulary).mock.calls[0]).toEqual(
    vi.mocked(desktop.reviewVocabulary).mock.calls[1],
  );
  expect(desktop.reviewVocabulary).toHaveBeenLastCalledWith(
    expect.objectContaining({
      mode: 'scramble',
      answer: 'APPLE',
      cardId: 'apple',
    }),
  );
  expect(screen.getByText('I eat an apple.')).toBeVisible();
});
it('behandelt Vorschule-Exposition mit anderer Karte und ehrlichem leeren Zustand ohne Bewertung', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getVocabularyState)
    .mockResolvedValueOnce({ ...initial, difficulty: 'vorschule' })
    .mockResolvedValue({
      ...initial,
      difficulty: 'vorschule',
      mode: 'scramble',
      card: null,
      temporarilyExcluded: true,
      newCount: 0,
    });
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByLabelText('Deine deutsche Übersetzung');
  await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
  expect(
    await screen.findByText('Gerade keine passende Salatkarte'),
  ).toBeVisible();
  expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all', {
    mode: 'scramble',
    excludeCardId: 'hello',
    previousCardId: 'hello',
  });
  expect(screen.getByText(/Die eben gezeigte Karte lassen wir/)).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Fällige Karten laden' }),
  );
  await waitFor(() =>
    expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all', {
      mode: 'scramble',
      excludeCardId: 'hello',
      previousCardId: 'hello',
    }),
  );
  expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
});
it('nennt das Hello-Deck im Salat neutral und verrät das gesuchte hello nicht im Seitenpanel', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} initialDeck="hello" />);
  await screen.findByLabelText('Deine englische Antwort');
  await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
  await screen.findByRole('group', { name: 'Buchstabenkärtchen' });
  expect(screen.getByLabelText('Dein Wortthema')).toHaveValue('hello');
  expect(screen.getByRole('option', { name: 'Das bin ich' })).toHaveProperty(
    'selected',
    true,
  );
  expect(
    screen.queryByRole('option', { name: /Hello!/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('I say hello.')).not.toBeInTheDocument();
  expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
});
it('bewahrt den offenen Vorschule-Ausschluss auch bei externer Profilinvalidierung im Salat', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getVocabularyState)
    .mockResolvedValueOnce({ ...initial, difficulty: 'vorschule' })
    .mockResolvedValue({
      ...initial,
      difficulty: 'vorschule',
      mode: 'scramble',
      card: null,
      temporarilyExcluded: true,
      newCount: 0,
    });
  const { rerender } = render(
    <VocabularyPanel profileVersion={0} externalControls />,
  );
  await screen.findByLabelText('Deine deutsche Übersetzung');
  await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
  await screen.findByText('Gerade keine passende Salatkarte');
  rerender(<VocabularyPanel profileVersion={1} externalControls />);
  await waitFor(() =>
    expect(desktop.getVocabularyState).toHaveBeenCalledTimes(3),
  );
  expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all', {
    mode: 'scramble',
    excludeCardId: 'hello',
    previousCardId: 'hello',
  });
  expect(
    await screen.findByText('Gerade keine passende Salatkarte'),
  ).toBeVisible();
  expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
});
it('erhält bestätigte und aufgedeckte Ergebnisse beim Moduswechsel statt erneut Punkte anzubieten', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await user.type(
    await screen.findByLabelText('Deine englische Antwort'),
    'hello{Enter}',
  );
  await screen.findByText('Richtig! +1 Punkt');
  await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
  expect(screen.getByText('Richtig! +1 Punkt')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Prüfen' }),
  ).not.toBeInTheDocument();
  expect(desktop.getVocabularyState).toHaveBeenCalledTimes(1);
  expect(desktop.reviewVocabulary).toHaveBeenCalledTimes(1);
});
it.each([
  ['write', 'correct'],
  ['write', 'reveal'],
  ['scramble', 'correct'],
  ['scramble', 'reveal'],
] as const)(
  'lädt nach %s-%s-Rückmeldung und externem Stufenwechsel die gewählte Übungsart',
  async (sourceMode, outcome) => {
    const user = userEvent.setup();
    const { rerender } = render(
      <VocabularyPanel profileVersion={0} externalControls />,
    );
    await screen.findByLabelText('Deine englische Antwort');
    if (sourceMode === 'scramble') {
      await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
      await screen.findByRole('group', { name: 'Buchstabenkärtchen' });
    }
    if (outcome === 'correct')
      await user.type(
        screen.getByLabelText('Deine englische Antwort'),
        'hello{Enter}',
      );
    else {
      vi.mocked(desktop.reviewVocabulary).mockResolvedValueOnce({
        ...success,
        correct: false,
        pointsAwarded: 0,
      });
      await user.click(screen.getByRole('button', { name: 'Hilfe' }));
      await user.click(screen.getByRole('button', { name: 'Lösung zeigen' }));
    }
    await screen.findByRole('button', { name: 'Weiter' });
    const loadsBeforeSwitch = vi.mocked(desktop.getVocabularyState).mock.calls
      .length;
    const targetMode = sourceMode === 'write' ? 'scramble' : 'write';
    await user.click(
      screen.getByRole('button', {
        name:
          targetMode === 'scramble' ? 'Buchstabensalat' : 'Wörter schreiben',
      }),
    );
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeVisible();
    expect(desktop.getVocabularyState).toHaveBeenCalledTimes(loadsBeforeSwitch);
    const next: VocabularyState = {
      ...initial,
      difficulty: 'vorschule' as const,
      mode: targetMode,
    };
    vi.mocked(desktop.getVocabularyState).mockResolvedValueOnce(next);
    rerender(<VocabularyPanel profileVersion={1} externalControls />);
    if (targetMode === 'scramble') {
      await screen.findByRole('group', { name: 'Buchstabenkärtchen' });
      expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all', {
        mode: 'scramble',
      });
      expect(screen.getByRole('heading', { name: 'hallo' })).toBeVisible();
      expect(screen.queryByText('I say hello.')).not.toBeInTheDocument();
      await user.type(
        screen.getByLabelText('Deine englische Antwort'),
        'hello{Enter}',
      );
      await waitFor(() =>
        expect(desktop.reviewVocabulary).toHaveBeenLastCalledWith(
          expect.objectContaining({
            mode: 'scramble',
            difficulty: 'vorschule',
            answer: 'hello',
          }),
        ),
      );
    } else {
      const field = await screen.findByLabelText('Deine deutsche Übersetzung');
      expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all');
      expect(
        screen.queryByRole('group', { name: 'Buchstabenkärtchen' }),
      ).not.toBeInTheDocument();
      await user.type(field, 'hallo{Enter}');
      await waitFor(() => {
        const review = vi
          .mocked(desktop.reviewVocabulary)
          .mock.calls.at(-1)![0];
        expect(review.difficulty).toBe('vorschule');
        expect(review.answer).toBe('hallo');
        expect(review.mode).toBeUndefined();
      });
    }
  },
);
it('überspringt ohne Bewertung und setzt Ausschlüsse beim Themenwechsel zurück', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByLabelText('Deine englische Antwort');
  await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
  await screen.findByRole('group', { name: 'Buchstabenkärtchen' });
  await user.click(screen.getByRole('button', { name: 'Überspringen' }));
  await waitFor(() =>
    expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('all', {
      mode: 'scramble',
      excludeCardId: 'hello',
      previousCardId: 'hello',
    }),
  );
  expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
  await user.selectOptions(screen.getByLabelText('Dein Wortthema'), 'family');
  await waitFor(() =>
    expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('family', {
      mode: 'scramble',
    }),
  );
});
