import type { Question } from './learning';

export type RomanDirection = 'decimal-to-roman' | 'roman-to-decimal';

export interface RomanQuestion extends Question {
  grade: number;
  source: string;
  curriculumVersion: string;
}

export const romanDirections: { id: RomanDirection; label: string }[] = [
  { id: 'decimal-to-roman', label: 'Zahl → römisch' },
  { id: 'roman-to-decimal', label: 'Römisch → Zahl' },
];
