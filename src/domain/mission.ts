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
  subject: 'mathematics';
  grade: number;
  competencyId: string;
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

export interface MissionState {
  profileReady: boolean;
  difficulty: Difficulty;
  metadata: MissionMetadata;
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
  difficulty: Difficulty;
}

export interface MissionActionInput {
  requestId: string;
  sessionId: string;
  stepIndex: number;
  action: 'answer' | 'hint' | 'reveal' | 'next' | 'skip';
  answer: string | null;
}
