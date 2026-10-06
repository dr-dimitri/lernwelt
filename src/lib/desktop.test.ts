import { invoke, isTauri } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { desktop } from './desktop';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isTauri).mockReturnValue(true);
});

describe('Desktop-Schnittstelle', () => {
  it('fordert einen Lösungsweg nur ausdrücklich per Aufgaben-ID an', async () => {
    await desktop.getLearningExplanation('by.geography.5.earth.example.v1');
    expect(invoke).toHaveBeenCalledExactlyOnceWith('get_learning_explanation', {
      questionId: 'by.geography.5.earth.example.v1',
    });
  });
  it('lädt römische Zufallsaufgaben mit Richtung und vorheriger Aufgabe ohne Lösungsschlüssel', async () => {
    await desktop.getRomanQuestion('decimal-to-roman');
    expect(invoke).toHaveBeenCalledWith('get_roman_question', {
      direction: 'decimal-to-roman',
      previousQuestionId: undefined,
    });
    await desktop.getRomanQuestion('roman-to-decimal', 'previous-task');
    expect(invoke).toHaveBeenCalledWith('get_roman_question', {
      direction: 'roman-to-decimal',
      previousQuestionId: 'previous-task',
    });
  });
  it('übermittelt beim Tastschreiben nur Aufgabe, Text und Request-ID', async () => {
    await desktop.getTypingState();
    expect(invoke).toHaveBeenCalledWith('get_typing_state', undefined);
    const input = {
      requestId: 'typing-1',
      taskId: 'typing.home.koenner.1.v1',
      answer: 'fj jf',
    };
    await desktop.submitTyping(input);
    expect(invoke).toHaveBeenCalledWith('submit_typing', { input });
    vi.mocked(isTauri).mockReturnValue(false);
    await expect(desktop.submitTyping(input)).rejects.toThrow('Desktop-App');
  });
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

it.each([
  {
    name: 'Fach- und Planetenantwort',
    command: 'submit_answer',
    nested: false,
    call: () => desktop.submitAnswer('test-1', 'math', '42'),
  },
  {
    name: 'römische Zufallsantwort',
    command: 'submit_answer',
    nested: false,
    call: () =>
      desktop.submitAnswer(
        'roman-1',
        'by.math.5.roman-random.decimal-to-roman.koenner.42.v1',
        'XLII',
      ),
  },
  {
    name: 'Tastschreiben',
    command: 'submit_typing',
    nested: false,
    call: () =>
      desktop.submitTyping({
        requestId: 'typing-1',
        taskId: 'typing-1',
        answer: 'fj',
      }),
  },
  {
    name: 'Missionsantwort',
    command: 'act_mission',
    nested: false,
    call: () =>
      desktop.actMission({
        requestId: 'mission-1',
        sessionId: 'mission-1',
        stepIndex: 0,
        action: 'answer',
        answer: '22',
      }),
  },
  {
    name: 'Missionsstart',
    command: 'start_mission',
    nested: false,
    call: () =>
      desktop.startMission({ requestId: 'start-1', difficulty: 'koenner' }),
  },
  {
    name: 'Vokabelantwort',
    command: 'review_vocabulary',
    nested: true,
    call: () =>
      desktop.reviewVocabulary({
        requestId: 'word-1',
        cardId: 'word-1',
        deckId: 'school',
        difficulty: 'koenner',
        expectedReviews: 0,
        answer: 'school',
      }),
  },
  {
    name: 'Einmaleinsantwort',
    command: 'answer_multiplication',
    nested: true,
    call: () =>
      desktop.answerMultiplication({
        mode: 'tables',
        sequence: 0,
        answer: '16',
      }),
  },
  {
    name: 'bezahlter Spielstart',
    command: 'start_game',
    nested: false,
    call: () => desktop.startGame('game-1', 'blocks'),
  },
  {
    name: 'Spielabschluss',
    command: 'finish_game',
    nested: false,
    call: () => desktop.finishGame('game-1', 20),
  },
  {
    name: 'gekaufte Sammelbelohnung',
    command: 'redeem_reward',
    nested: false,
    direct: true,
    call: () => desktop.redeemReward('star'),
  },
])(
  'meldet bestätigten Wallet sofort aus $name, ohne Zusatzabfrage',
  async ({ command, nested, direct, call }) => {
    const { subscribeWallet } = await import('./wallet-updates');
    const { initial } = await import('../test/learning-fixture');
    const listener = vi.fn();
    const unsubscribe = subscribeWallet(listener);
    const result = direct
      ? initial.wallet
      : nested
        ? { state: { wallet: initial.wallet } }
        : { wallet: initial.wallet };
    vi.mocked(invoke).mockResolvedValue(result);
    await expect(call()).resolves.toBe(result);
    expect(listener).toHaveBeenCalledExactlyOnceWith(initial.wallet);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(vi.mocked(invoke).mock.calls[0][0]).toBe(command);
    unsubscribe();
  },
);

it('sendet den begrenzten Salatmodus und vorübergehenden Ausschluss an die native Auswahl', async () => {
  await desktop.getVocabularyState('school', {
    mode: 'scramble',
    excludeCardId: 'old-card',
    previousCardId: 'last-card',
  });
  expect(invoke).toHaveBeenCalledWith('get_vocabulary_state', {
    deckId: 'school',
    selection: {
      mode: 'scramble',
      excludeCardId: 'old-card',
      previousCardId: 'last-card',
    },
  });
});
