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
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(initial);
  vi.mocked(desktop.reviewVocabulary).mockResolvedValue({
    state: done,
    boxNumber: 2,
    dueAt: 1_800_000_000,
  });
});
it('versteckt die Lösung bis zum Umdrehen und speichert eine ehrliche Bewertung', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByRole('button', { name: 'Karte umdrehen' });
  expect(screen.queryByText('I say hello.')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Gewusst' }),
  ).not.toBeInTheDocument();
  await user.type(
    screen.getByLabelText('Deine Antwort zum Vergleichen (freiwillig)'),
    'hello',
  );
  await user.click(screen.getByRole('button', { name: 'Karte umdrehen' }));
  expect(screen.getByText('I say hello.')).toBeVisible();
  expect(screen.getByText('Deine Antwort: hello')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Gewusst' }));
  expect(desktop.reviewVocabulary).toHaveBeenCalledWith(
    expect.objectContaining({
      cardId: 'hello',
      deckId: 'all',
      difficulty: 'koenner',
      expectedReviews: 0,
      known: true,
    }),
  );
  expect(await screen.findByText('Für jetzt geschafft!')).toBeVisible();
  expect(screen.getByText(/Nächste Wiederholung:/)).toBeVisible();
});
it('behält nach Speicherfehler Karte und Request und verhindert doppelte Bewertungen', async () => {
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
  await user.click(
    await screen.findByRole('button', { name: 'Karte umdrehen' }),
  );
  await user.click(screen.getByRole('button', { name: 'Noch üben' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Transportfehler');
  expect(screen.getByRole('button', { name: 'Gewusst' })).toBeDisabled();
  expect(screen.getByLabelText('Dein Wortthema')).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(screen.getByRole('button', { name: 'Gewusst' })).toBeDisabled();
  expect(vi.mocked(desktop.reviewVocabulary).mock.calls[0]).toEqual(
    vi.mocked(desktop.reviewVocabulary).mock.calls[1],
  );
  await act(async () =>
    resolve({ state: done, boxNumber: 1, dueAt: 1_800_000_000 }),
  );
  expect(
    screen.getByText(/Diese Karte kommt in etwa einer Minute wieder/),
  ).toBeVisible();
});
it('wechselt Stufe und zeigt Erkennen oder Satzlücke ohne Fortschritt zu übernehmen', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByRole('button', { name: 'Karte umdrehen' });
  vi.mocked(desktop.setDifficulty).mockResolvedValue('vorschule');
  vi.mocked(desktop.getVocabularyState).mockResolvedValue({
    ...initial,
    difficulty: 'vorschule',
  });
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  expect(await screen.findByRole('heading', { name: 'hello' })).toBeVisible();
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
});
it('lädt Themen neu und räumt eine zuvor umgedrehte Karte auf', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Karte umdrehen' }),
  );
  await user.selectOptions(screen.getByLabelText('Dein Wortthema'), 'family');
  await screen.findByRole('button', { name: 'Karte umdrehen' });
  expect(desktop.getVocabularyState).toHaveBeenLastCalledWith('family');
  expect(
    screen.queryByRole('button', { name: 'Gewusst' }),
  ).not.toBeInTheDocument();
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
  expect(
    await screen.findByText(/Speichere unten zuerst dein Lernprofil/),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Karte umdrehen' }),
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
    screen.queryByRole('button', { name: 'Karte umdrehen' }),
  ).not.toBeInTheDocument();
});
it('zeigt nach fehlgeschlagenem Stufenwechsel keine veraltete Karte als aktuell', async () => {
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await screen.findByRole('button', { name: 'Karte umdrehen' });
  vi.mocked(desktop.setDifficulty).mockRejectedValueOnce(
    new Error('Speicherfehler'),
  );
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(
    screen.queryByRole('button', { name: 'Karte umdrehen' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Karten neu laden' }));
  expect(
    await screen.findByRole('button', { name: 'Karte umdrehen' }),
  ).toBeVisible();
});
