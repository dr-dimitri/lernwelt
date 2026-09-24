import type {
  VocabularyState,
  VocabularyReview,
  VocabularyReviewResult,
} from '../domain/vocabulary';
import type { ArcadeState, GameId } from '../domain/arcade';
import { invoke, isTauri } from '@tauri-apps/api/core';
import type { LearnerProfile, LearningProgress } from '../domain/learner';
import type {
  AnswerResult,
  Difficulty,
  LearningState,
  Wallet,
} from '../domain/learning';

async function callDesktop<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauri()) {
    throw new Error(
      'Bitte öffne die Lernwelt-Desktop-App, um dein Lernprofil zu verwenden.',
    );
  }
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(
      typeof error === 'string'
        ? error
        : 'Die lokalen Lerndaten sind nicht verfügbar.',
    );
  }
}

export const desktop = {
  getVocabularyState: (deckId: string) =>
    callDesktop<VocabularyState>('get_vocabulary_state', { deckId }),
  reviewVocabulary: (input: VocabularyReview) =>
    callDesktop<VocabularyReviewResult>('review_vocabulary', { input }),
  getArcadeState: () => callDesktop<ArcadeState>('get_arcade_state'),
  startGame: (sessionId: string, gameId: GameId) =>
    callDesktop<ArcadeState>('start_game', { sessionId, gameId }),
  finishGame: (sessionId: string, score: number) =>
    callDesktop<ArcadeState>('finish_game', { sessionId, score }),
  getProfile: () => callDesktop<LearnerProfile | null>('get_profile'),
  saveProfile: (profile: LearnerProfile) =>
    callDesktop<LearnerProfile>('save_profile', { profile }),
  listProgress: () => callDesktop<LearningProgress[]>('list_progress'),
  getLearningState: () => callDesktop<LearningState>('get_learning_state'),
  setDifficulty: (difficulty: Difficulty) =>
    callDesktop<Difficulty>('set_difficulty', { difficulty }),
  submitAnswer: (requestId: string, questionId: string, answer: string) =>
    callDesktop<AnswerResult>('submit_answer', {
      requestId,
      questionId,
      answer,
    }),
  redeemReward: (rewardId: string) =>
    callDesktop<Wallet>('redeem_reward', { rewardId }),
};
