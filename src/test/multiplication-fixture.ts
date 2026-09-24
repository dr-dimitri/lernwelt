import type {
  MultiplicationState,
  MultiplicationResult,
} from '../domain/multiplication';
export const multiplicationInitial: MultiplicationState = {
  content: {
    subject: 'mathematics',
    grade: 5,
    competencyId: 'multiply',
    source: 'Eigene Rechenaufgaben',
    curriculumVersion: 'v1',
  },
  profileReady: true,
  mode: 'tables',
  task: {
    id: '2x8',
    sequence: 0,
    left: 2,
    right: 8,
    round: 1,
    position: 1,
    roundSize: 100,
  },
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
    task: {
      id: '6x5',
      sequence: 1,
      left: 6,
      right: 5,
      round: 1,
      position: 2,
      roundSize: 100,
    },
    answered: 1,
    correct: 1,
    wallet: { balance: 10, totalEarned: 30, rewards: [] },
  },
};
