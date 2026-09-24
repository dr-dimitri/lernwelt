import type { SubjectId } from './subjects';

export interface Question {
  id: string;
  subject: SubjectId;
  prompt: string;
  solved: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
}

export interface Wallet {
  balance: number;
  totalEarned: number;
  rewards: Reward[];
}

export interface LearningState {
  profileReady: boolean;
  pointsPerAnswer: number;
  questions: Question[];
  wallet: Wallet;
}

export interface AnswerResult {
  correct: boolean;
  pointsAwarded: number;
  explanation: string;
  wallet: Wallet;
}
