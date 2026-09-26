import type { Difficulty, Wallet } from './learning';

export interface MissionDiagram {
  width: number | null;
  height: number | null;
  unit: string;
}

export interface MissionMetadata {
  id: string;
  title: string;
  description: string;
  subject: 'mathematics' | 'english' | 'nature';
  grade: number;
  competencyId: string;
  foreignLanguageSequence: number | null;
  source: string;
  curriculumVersion: string;
  variantCount: number;
}

export interface MissionFeedback {
  correct: boolean | null;
  revealed: boolean;
  explanation: string;
  pointsAwarded: number;
  independent: boolean;
}

export interface MissionStep {
  index: number;
  kind: 'recall' | 'discover' | 'solve' | 'detect' | 'activity';
  title: string;
  prompt: string;
  instructions: string[];
  diagram: MissionDiagram | null;
  unit: string | null;
  answerKind: 'number' | 'choice' | null;
  options: string[];
  hint: string | null;
  feedback: MissionFeedback | null;
}

export interface MissionSession {
  id: string;
  round: number;
  variant: number;
  completed: boolean;
  currentStep: MissionStep | null;
}

export interface MissionTopic {
  metadata: MissionMetadata;
  activeStep: number | null;
  dueAt: number | null;
  due: boolean;
}

export const missionSubjects = {
  mathematics: 'Mathematik',
  english: 'Englisch',
  nature: 'Natur und Technik',
} as const;

export interface MissionState {
  profileReady: boolean;
  difficulty: Difficulty;
  metadata: MissionMetadata;
  topics: MissionTopic[];
  progress: {
    tried: boolean;
    solvedIndependently: boolean;
    recalledLater: boolean;
    completedRounds: number;
  };
  dueAt: number | null;
  due: boolean;
  wallet: Wallet;
  session: MissionSession | null;
}

export interface MissionStartInput {
  requestId: string;
  topicId?: string;
  difficulty: Difficulty;
}

export interface MissionActionInput {
  requestId: string;
  sessionId: string;
  stepIndex: number;
  action: 'answer' | 'hint' | 'reveal' | 'next' | 'skip';
  answer: string | null;
}
