import type { SubjectId } from './subjects';

export type Difficulty = 'vorschule' | 'koenner' | 'streber';
export const difficulties: {
  id: Difficulty;
  name: string;
  description: string;
  symbol: string;
}[] = [
  {
    id: 'vorschule',
    name: 'Vorschule',
    description: 'Locker warm werden',
    symbol: '☀',
  },
  {
    id: 'koenner',
    name: 'Könner',
    description: 'Wissen ausprobieren',
    symbol: '✦',
  },
  {
    id: 'streber',
    name: 'Streber',
    description: 'Lust auf Knobeln?',
    symbol: '⚡',
  },
];

export interface Topic {
  id: string;
  name: string;
  subject: SubjectId;
  grade: number;
  curriculumRef: string;
  description: string;
  lesson: string;
  tables?: {
    caption: string;
    headers: string[];
    rows: string[][];
    note: string;
  }[];
  languageSequence: string | null;
  activities: { title: string; prompt: string; check: string }[];
}

export interface Question {
  id: string;
  subject: SubjectId;
  topicId: string;
  difficulty: Difficulty;
  competencyId: string;
  prompt: string;
  hint: string;
  options: string[];
  answerKind: 'number' | 'text' | 'choice';
  unit: string | null;
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
  difficulty: Difficulty;
  topics: Topic[];
  curriculumSource: string;
  curriculumVersion: string;
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
