import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import VocabularyPanel from './VocabularyPanel';
import { desktop } from '../lib/desktop';
import { vocabularyInitial } from '../test/vocabulary-fixture';
import { mockAudio } from '../test/audio-mock';
vi.mock('../lib/desktop', () => ({
  desktop: {
    getVocabularyState: vi.fn(),
    reviewVocabulary: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));
const initial = {
  ...vocabularyInitial,
  card: {
    ...vocabularyInitial.card!,
    card: {
      ...vocabularyInitial.card!.card,
      id: 'by.english.5.vocab.hello.hello.v1',
    },
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(initial);
  vi.mocked(desktop.reviewVocabulary).mockResolvedValue({
    state: { ...initial, card: null },
    correct: false,
    pointsAwarded: 0,
    boxNumber: 1,
    dueAt: 1_800_000_000,
  });
});
afterEach(() => vi.unstubAllGlobals());

it.each(['koenner', 'streber'] as const)(
  'verrät in %s keine versteckte Antwort durch Audio; erst nach bestätigtem Aufdecken',
  async (difficulty) => {
    mockAudio();
    vi.mocked(desktop.getVocabularyState).mockResolvedValue({
      ...initial,
      difficulty,
    });
    const user = userEvent.setup();
    render(<VocabularyPanel profileVersion={0} />);
    await screen.findByLabelText('Deine englische Antwort');
    expect(
      screen.queryByRole('button', { name: 'Wort anhören' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Beispielsatz anhören' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hilfe' }));
    await user.click(screen.getByRole('button', { name: 'Lösung zeigen' }));
    expect(
      await screen.findByRole('button', { name: 'Wort anhören' }),
    ).toBeEnabled();
    expect(
      vi.mocked(desktop.reviewVocabulary).mock.calls[0][0].answer,
    ).toBeNull();
  },
);

it('liest in Vorschule vor und stoppt beim Wechsel zur Hörrunde ohne Bewertung oder Punktebuchung', async () => {
  const { instances } = mockAudio();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue({
    ...initial,
    difficulty: 'vorschule',
  });
  const user = userEvent.setup();
  render(<VocabularyPanel profileVersion={0} />);
  await user.click(await screen.findByRole('button', { name: 'Wort anhören' }));
  await user.click(screen.getByRole('button', { name: '3 Wörter hören' }));
  expect(instances[0].pause).toHaveBeenCalledOnce();
  await user.click(
    screen.getByRole('button', { name: 'Wort und Lösung zeigen' }),
  );
  await user.click(screen.getByRole('button', { name: 'Wörter schreiben' }));
  expect(screen.getByLabelText('Deine deutsche Übersetzung')).toHaveValue('');
  expect(desktop.reviewVocabulary).not.toHaveBeenCalled();
  expect(desktop.setDifficulty).not.toHaveBeenCalled();
  expect(desktop.getVocabularyState).toHaveBeenCalledTimes(1);
});

it.each(['vorschule', 'koenner', 'streber'] as const)(
  'verrät im Salat in %s weder Lösung noch Audio vor Prüfen/Aufdecken',
  async (difficulty) => {
    mockAudio();
    const user = userEvent.setup();
    vi.mocked(desktop.getVocabularyState).mockResolvedValue({
      ...initial,
      difficulty,
    });
    render(<VocabularyPanel profileVersion={0} />);
    await screen.findByRole('button', { name: 'Buchstabensalat' });
    await user.click(screen.getByRole('button', { name: 'Buchstabensalat' }));
    await screen.findByRole('group', { name: 'Buchstabenkärtchen' });
    expect(screen.queryByText('I say hello.')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Wort anhören' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Beispielsatz anhören' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Deine englische Antwort')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Hilfe' }));
    await user.click(screen.getByRole('button', { name: 'Lösung zeigen' }));
    expect(
      await screen.findByRole('button', { name: 'Wort anhören' }),
    ).toBeEnabled();
    expect(desktop.reviewVocabulary).toHaveBeenLastCalledWith(
      expect.objectContaining({ difficulty, mode: 'scramble', answer: null }),
    );
    await user.click(screen.getByRole('button', { name: 'Wörter schreiben' }));
    expect(
      screen.getByText('Noch nicht ganz – wir üben das wieder!'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Prüfen' }),
    ).not.toBeInTheDocument();
  },
);
