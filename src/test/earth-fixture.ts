import content from '../../src-tauri/content/geography-earth-5-v1.json';
import type {
  AnswerResult,
  Difficulty,
  LearningState,
  Question,
  Topic,
} from '../domain/learning';
import { initial } from './learning-fixture';
export const earthQuestions: Question[] = content.exercises.map((item) => ({
  id: item.id,
  subject: 'geography',
  topicId: item.topicId,
  difficulty: item.difficulty as Difficulty,
  competencyId: item.competencyId,
  prompt: item.prompt,
  hint: item.hint,
  furtherHints: item.furtherHints,
  options: item.options,
  answerKind: item.answerKind as Question['answerKind'],
  unit: item.unit,
  earthDiagram:
    'earthDiagram' in item
      ? (item.earthDiagram as Question['earthDiagram'])
      : undefined,
  ordering:
    'ordering' in item ? (item.ordering as Question['ordering']) : undefined,
  solved: false,
}));
export const earthInitial: LearningState = {
  ...initial,
  topics: [
    ...initial.topics,
    { ...content.topics[0], subject: 'geography' } as Topic,
  ],
  questions: [...initial.questions, ...earthQuestions],
};
export function earthAnswerFor(question: Question) {
  return content.exercises.find((item) => item.id === question.id)!.answer;
}
export function earthResultFor(
  question: Question,
  correct = true,
): AnswerResult {
  return {
    correct,
    pointsAwarded: correct
      ? earthInitial.pointsByDifficulty[question.difficulty]
      : 0,
    explanation: content.exercises.find((item) => item.id === question.id)!
      .explanation,
    mistakeHint: null,
    wallet: { ...initial.wallet, balance: 12, totalEarned: 12 },
  };
}
