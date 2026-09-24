import type { Difficulty } from './learning';
export interface VocabularyCard {
  id: string;
  deckId: string;
  english: string;
  german: string;
  example: string;
  cloze: string;
  competencyId: string;
}
export interface VocabularyState {
  profileReady: boolean;
  difficulty: Difficulty;
  decks: { id: string; name: string }[];
  source: string;
  curriculumVersion: string;
  orientation: string;
  newCount: number;
  dueCount: number;
  boxes: [number, number, number, number, number];
  total: number;
  nextDueAt: number | null;
  card: { card: VocabularyCard; boxNumber: number; reviews: number } | null;
}
export interface VocabularyReview {
  requestId: string;
  cardId: string;
  deckId: string;
  difficulty: Difficulty;
  expectedReviews: number;
  known: boolean;
}
export interface VocabularyReviewResult {
  state: VocabularyState;
  boxNumber: number;
  dueAt: number;
}
