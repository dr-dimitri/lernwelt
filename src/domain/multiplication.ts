import type { Wallet } from './learning';
export type MultiplicationMode = 'tables' | 'squares';
export interface MultiplicationTask {
  id: string;
  sequence: number;
  left: number;
  right: number;
  round: number;
  position: number;
  roundSize: number;
}
export interface MultiplicationState {
  content: {
    subject: string;
    grade: number;
    competencyId: string;
    source: string;
    curriculumVersion: string;
  };
  profileReady: boolean;
  mode: MultiplicationMode;
  task: MultiplicationTask | null;
  answered: number;
  correct: number;
  wallet: Wallet;
}
export interface MultiplicationInput {
  mode: MultiplicationMode;
  sequence: number;
  answer: string | null;
}
export interface MultiplicationResult {
  correct: boolean;
  pointsAwarded: number;
  solution: number;
  state: MultiplicationState;
}
