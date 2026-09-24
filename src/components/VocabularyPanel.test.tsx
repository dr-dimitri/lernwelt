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
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
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
    screen.queryByRole('button', { name: 'Antwort prüfen' }),
  ).not.toBeInTheDocument();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(done);
  await user.click(screen.getByRole('button', { name: 'Nächste Karte' }));
  expect(await screen.findByText('Für jetzt geschafft!')).toHaveFocus();
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
  expect(
    await screen.findByRole('heading', { name: 'Richtig! +1 Punkt' }),
  ).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Nächste Karte' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'auf Wiedersehen' }),
  ).toBeVisible();
  expect(screen.getByLabelText('Deine englische Antwort')).toHaveFocus();
  await user.keyboard('goodbye{Enter}');
  expect(desktop.reviewVocabulary).toHaveBeenLastCalledWith(
    expect.objectContaining({ cardId: 'goodbye', answer: 'goodbye' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Richtig! +1 Punkt' }),
  ).toHaveFocus();
});
it('behält Eingabe und bewusst gewählten Fokus bei unverändertem Zustand', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<VocabularyPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine englische Antwort');
  await user.type(field, 'helo{ArrowLeft}l');
  expect(field).toHaveValue('hello');
  expect(field).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toHaveFocus();
  rerender(<VocabularyPanel profileVersion={0} />);
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toHaveFocus();
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
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(
    await screen.findByText('Noch nicht ganz – wir üben das wieder!'),
  ).toBeVisible();
  expect(screen.getByText('hello', { selector: 'strong' })).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '8 Punkte',
  );
  await user.click(screen.getByRole('button', { name: 'Nächste Karte' }));
  await user.click(
    await screen.findByRole('button', {
      name: 'Weiß ich noch nicht · Lösung zeigen',
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
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Transportfehler');
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '8 Punkte',
  );
  expect(screen.getByLabelText('Deine englische Antwort')).toHaveValue('hello');
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  expect(screen.getByLabelText('Dein Wortthema')).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  expect(vi.mocked(desktop.reviewVocabulary).mock.calls[0]).toEqual(
    vi.mocked(desktop.reviewVocabulary).mock.calls[1],
  );
  await act(async () => resolve(success));
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '9 Punkte',
  );
});
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
    screen.queryByRole('button', { name: 'Antwort prüfen' }),
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
    screen.queryByRole('button', { name: 'Antwort prüfen' }),
  ).not.toBeInTheDocument();
});
it('zeigt nach fehlgeschlagenem Stufenwechsel keine veraltete Karte als aktuell', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByRole('button', { name: 'Antwort prüfen' });
  vi.mocked(desktop.setDifficulty).mockRejectedValueOnce(
    new Error('Speicherfehler'),
  );
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(
    screen.queryByRole('button', { name: 'Antwort prüfen' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Karten neu laden' }));
  expect(
    await screen.findByRole('button', { name: 'Antwort prüfen' }),
  ).toBeVisible();
});
