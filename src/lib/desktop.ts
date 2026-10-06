import {
  withWallet,
  withStateWallet,
  withDirectWallet,
} from './wallet-updates';
import type {
  MultiplicationMode,
  MultiplicationInput,
  MultiplicationConfiguration,
  MultiplicationState,
  MultiplicationResult,
} from '../domain/multiplication';
import type {
  VocabularyState,
  VocabularySelection,
  VocabularyReview,
  VocabularyReviewResult,
} from '../domain/vocabulary';
import type { ArcadeState, GameId } from '../domain/arcade';
import type { TypingState, TypingInput, TypingResult } from '../domain/typing';
import type {
  MissionState,
  MissionStartInput,
  MissionActionInput,
} from '../domain/mission';
import { invoke, isTauri } from '@tauri-apps/api/core';
import type { LearnerProfile, LearningProgress } from '../domain/learner';
import type {
  AnswerResult,
  Difficulty,
  LearningState,
  Wallet,
} from '../domain/learning';
import type { RomanDirection, RomanQuestion } from '../domain/roman';

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
  getTypingState: () =>
    withWallet(callDesktop<TypingState>('get_typing_state')),
  submitTyping: (input: TypingInput) =>
    withWallet(callDesktop<TypingResult>('submit_typing', { input })),
  getMissionState: (topicId?: string) =>
    withWallet(callDesktop<MissionState>('get_mission_state', { topicId })),
  startMission: (input: MissionStartInput) =>
    withWallet(callDesktop<MissionState>('start_mission', { input })),
  actMission: (input: MissionActionInput) =>
    withWallet(callDesktop<MissionState>('act_mission', { input })),
  getMultiplicationState: (mode?: MultiplicationMode) =>
    withWallet(
      callDesktop<MultiplicationState>('get_multiplication_state', { mode }),
    ),
  configureMultiplication: (input: MultiplicationConfiguration) =>
    withWallet(
      callDesktop<MultiplicationState>('configure_multiplication', { input }),
    ),
  answerMultiplication: (input: MultiplicationInput) =>
    withStateWallet(
      callDesktop<MultiplicationResult>('answer_multiplication', { input }),
    ),
  getVocabularyState: (deckId: string, selection?: VocabularySelection) =>
    withWallet(
      callDesktop<VocabularyState>('get_vocabulary_state', {
        deckId,
        ...(selection ? { selection } : {}),
      }),
    ),
  reviewVocabulary: (input: VocabularyReview) =>
    withStateWallet(
      callDesktop<VocabularyReviewResult>('review_vocabulary', { input }),
    ),
  getArcadeState: () =>
    withWallet(callDesktop<ArcadeState>('get_arcade_state')),
  startGame: (sessionId: string, gameId: GameId) =>
    withWallet(callDesktop<ArcadeState>('start_game', { sessionId, gameId })),
  finishGame: (sessionId: string, score: number) =>
    withWallet(callDesktop<ArcadeState>('finish_game', { sessionId, score })),
  getProfile: () => callDesktop<LearnerProfile | null>('get_profile'),
  saveProfile: (profile: LearnerProfile) =>
    callDesktop<LearnerProfile>('save_profile', { profile }),
  listProgress: () => callDesktop<LearningProgress[]>('list_progress'),
  getLearningState: () =>
    withWallet(callDesktop<LearningState>('get_learning_state')),
  getLearningExplanation: (questionId: string) =>
    callDesktop<string>('get_learning_explanation', { questionId }),
  getRomanQuestion: (direction: RomanDirection, previousQuestionId?: string) =>
    callDesktop<RomanQuestion>('get_roman_question', {
      direction,
      previousQuestionId,
    }),
  setDifficulty: (difficulty: Difficulty) =>
    callDesktop<Difficulty>('set_difficulty', { difficulty }),
  submitAnswer: (requestId: string, questionId: string, answer: string) =>
    withWallet(
      callDesktop<AnswerResult>('submit_answer', {
        requestId,
        questionId,
        answer,
      }),
    ),
  redeemReward: (rewardId: string) =>
    withDirectWallet(callDesktop<Wallet>('redeem_reward', { rewardId })),
};
