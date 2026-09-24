import type {
  MultiplicationState,
  MultiplicationResult,
} from '../domain/multiplication';
export const multiplicationInitial: MultiplicationState = {
  profileReady: true,
  mode: 'tables',
  task: { sequence: 0, left: 2, right: 8 },
  answered: 0,
  correct: 0,
  wallet: { balance: 9, totalEarned: 29, rewards: [] },
};
export const multiplicationSuccess: MultiplicationResult = {
  correct: true,
  pointsAwarded: 1,
  solution: 16,
  state: {
    ...multiplicationInitial,
    task: { sequence: 1, left: 6, right: 5 },
    answered: 1,
    correct: 1,
    wallet: { balance: 10, totalEarned: 30, rewards: [] },
  },
};
