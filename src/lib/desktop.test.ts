import { invoke, isTauri } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { desktop } from './desktop';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isTauri).mockReturnValue(true);
});

describe('Desktop-Schnittstelle', () => {
  it('täuscht in der Browser-Vorschau keine Speicherung vor', async () => {
    vi.mocked(isTauri).mockReturnValue(false);
    await expect(
      desktop.saveProfile({ displayName: 'Alex', grade: 7 }),
    ).rejects.toThrow('Desktop-App');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('übersetzt Rust-Fehler in darstellbare Fehler', async () => {
    vi.mocked(invoke).mockRejectedValue(
      'Bitte wähle eine Jahrgangsstufe zwischen 5 und 13.',
    );
    await expect(
      desktop.saveProfile({ displayName: 'Alex', grade: 2 }),
    ).rejects.toThrow('Jahrgangsstufe');
  });

  it('übermittelt die Antwort statt eines vom Client behaupteten Ergebnisses', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    await desktop.submitAnswer('request-1', 'sample.english.cat.v1', 'cat');
    expect(invoke).toHaveBeenCalledWith('submit_answer', {
      requestId: 'request-1',
      questionId: 'sample.english.cat.v1',
      answer: 'cat',
    });
  });
});

it('übermittelt bei Wortkarten nur Selbsteinschätzung und Versionsschutz, keine Fälligkeit', async () => {
  vi.mocked(invoke).mockResolvedValue(undefined);
  await desktop.getVocabularyState('family');
  expect(invoke).toHaveBeenCalledWith('get_vocabulary_state', {
    deckId: 'family',
  });
  const input = {
    requestId: 'review-1',
    cardId: 'word-1',
    deckId: 'family',
    difficulty: 'koenner' as const,
    expectedReviews: 2,
    known: false,
  };
  await desktop.reviewVocabulary(input);
  expect(invoke).toHaveBeenCalledWith('review_vocabulary', { input });
});
