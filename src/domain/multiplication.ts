import type { Wallet } from './learning';
export type MultiplicationMode = 'tables' | 'squares';
export interface MultiplicationTask {
  sequence: number;
  left: number;
  right: number;
}
export interface MultiplicationState {
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
