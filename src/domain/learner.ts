import type { SubjectId } from './subjects';

export interface LearnerProfile {
  displayName: string;
  grade: number;
}

export interface LearningProgress {
  subject: SubjectId;
  competencyId: string;
  attempts: number;
  correct: number;
}
