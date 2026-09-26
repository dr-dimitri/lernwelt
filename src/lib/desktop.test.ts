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

it('übermittelt bei Wortkarten die Antwort und den Versionsschutz, keine Punkte oder Richtig-Behauptung', async () => {
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
    answer: 'cat',
  };
  await desktop.reviewVocabulary(input);
  expect(invoke).toHaveBeenCalledWith('review_vocabulary', { input });
});

it('übermittelt beim Einmaleins nur Rechenart, Aufgabenstand und Antwort', async () => {
  vi.mocked(invoke).mockResolvedValue(undefined);
  await desktop.getMultiplicationState('squares');
  expect(invoke).toHaveBeenCalledWith('get_multiplication_state', {
    mode: 'squares',
  });
  const input = { mode: 'tables' as const, sequence: 0, answer: '16' };
  await desktop.answerMultiplication(input);
  expect(invoke).toHaveBeenCalledWith('answer_multiplication', { input });
});

it('übermittelt die Themenwahl der Lernrunde und lässt alte Gartenstarts ohne Thema zu', async () => {
  await desktop.getMissionState('by.english.5.round.school.v1');
  expect(invoke).toHaveBeenCalledWith('get_mission_state', {
    topicId: 'by.english.5.round.school.v1',
  });
  const input = {
    requestId: 'mission-1',
    difficulty: 'koenner' as const,
    topicId: 'by.nature.5.round.research.v1',
  };
  await desktop.startMission(input);
  expect(invoke).toHaveBeenCalledWith('start_mission', { input });
  await desktop.startMission({ requestId: 'legacy', difficulty: 'koenner' });
  expect(invoke).toHaveBeenCalledWith('start_mission', {
    input: { requestId: 'legacy', difficulty: 'koenner' },
  });
});
