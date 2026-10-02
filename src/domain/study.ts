import type { Difficulty, LearningState, Question } from './learning';
import type { SubjectId } from './subjects';

export interface StudyArea {
  id: string;
  subject: SubjectId;
  name: string;
  curriculumRef: string;
}
export interface StudySupplement {
  kind: 'multiplication' | 'vocabulary' | 'mission';
  label: string;
  target: string;
}
export interface StudyUnit {
  id: string;
  areaId: string;
  subject: SubjectId;
  grade: number;
  name: string;
  goal: string;
  keywords: string[];
  curriculumRef: string;
  source: string;
  curriculumVersion: string;
  languageSequence: string | null;
  exerciseIds: string[];
  supplements: StudySupplement[];
}
export interface StudyCatalog {
  version: number;
  areas: StudyArea[];
  units: StudyUnit[];
}
export function unitQuestions(
  state: LearningState,
  unit: StudyUnit,
  difficulty: Difficulty = state.difficulty,
): Question[] {
  const ids = new Set(unit.exerciseIds);
  return state.questions.filter(
    (q) =>
      q.subject === unit.subject &&
      q.difficulty === difficulty &&
      ids.has(q.id),
  );
}
export function studyRound(questions: Question[], offset = 0): string[] {
  const ordered = [
    ...questions.filter((q) => !q.solved),
    ...questions.filter((q) => q.solved),
  ];
  return ordered.slice(offset, offset + 6).map((q) => q.id);
}
export function matchesUnit(
  unit: StudyUnit,
  area: StudyArea | undefined,
  query: string,
): boolean {
  const normalize = (text: string) =>
    text
      .toLocaleLowerCase('de')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ß/g, 'ss');
  const haystack = normalize(
    [unit.name, unit.goal, ...unit.keywords, area?.name ?? ''].join(' '),
  );
  return normalize(query)
    .trim()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}
