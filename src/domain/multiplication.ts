import type { Wallet } from './learning';
export type MultiplicationMode = 'tables' | 'squares';
export type MultiplicationWorld = 'workshop' | 'island';
export type RobotDesign = 'scout' | 'garden' | 'aqua';
export type RobotPalette = 'mint' | 'amber' | 'violet';
export interface MultiplicationTask {
  id: string;
  sequence: number;
  left: number;
  right: number;
  round: number;
  position: number;
  roundSize: number;
  review: boolean;
}
export interface WorldProgress {
  answered: number;
  completedStages: number;
  stageAnswered: number;
  awaitingContinue: boolean;
}
export interface MultiplicationAdventure {
  revision: number;
  world: MultiplicationWorld;
  design: RobotDesign;
  palette: RobotPalette;
  table: number | null;
  review: boolean;
  reviewCount: number;
  stageSize: number;
  worlds: Record<MultiplicationWorld, WorldProgress>;
  robots: { design: RobotDesign; palette: RobotPalette; count: number }[];
  lastRobot: { design: RobotDesign; palette: RobotPalette } | null;
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
  adventure: MultiplicationAdventure;
}
export interface MultiplicationInput {
  mode: MultiplicationMode;
  sequence: number;
  answer: string | null;
}
export interface MultiplicationConfiguration {
  requestId: string;
  expectedRevision: number;
  mode: MultiplicationMode;
  world: MultiplicationWorld;
  design: RobotDesign;
  palette: RobotPalette;
  table: number | null;
  review: boolean;
  continueStage: boolean;
}
export interface MultiplicationResult {
  correct: boolean;
  pointsAwarded: number;
  solution: number;
  state: MultiplicationState;
}
