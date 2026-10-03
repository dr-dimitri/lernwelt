import content from '../../src-tauri/content/geography-solar-5-v1.json';
import {
  difficulties,
  type AnswerResult,
  type LearningState,
  type Question,
  type Topic,
} from '../domain/learning';
import { planets } from '../domain/solar-system';
import { initial } from './learning-fixture';

const solarTopic: Topic = { ...content.topics[0], subject: 'geography' };

// Mirror the answer-free IPC projection, using the actual bundled exercises.
export const solarQuestions: Question[] = content.exercises.map((item) => ({
  id: item.id,
  subject: 'geography',
  topicId: item.topicId,
  difficulty: difficulties.find((value) => value.id === item.difficulty)!.id,
  competencyId: item.competencyId,
  prompt: item.prompt,
  hint: item.hint,
  furtherHints: item.furtherHints,
  options: item.options,
  answerKind: 'choice',
  unit: item.unit,
  solarSystemPlanetId: planets.find(
    (planet) => planet.id === item.solarSystemPlanetId,
  )!.id,
  solved: false,
}));

export const solarInitial: LearningState = {
  ...initial,
  topics: [...initial.topics, solarTopic],
  questions: [...initial.questions, ...solarQuestions],
};

export function solarAnswerFor(question: Question) {
  return content.exercises.find((item) => item.id === question.id)!.answer;
}

export function solarResultFor(
  question: Question,
  correct = true,
  balance = 12,
): AnswerResult {
  return {
    correct,
    pointsAwarded: correct
      ? solarInitial.pointsByDifficulty[question.difficulty]
      : 0,
    explanation: content.exercises.find((item) => item.id === question.id)!
      .explanation,
    mistakeHint: null,
    wallet: { ...initial.wallet, balance, totalEarned: balance },
  };
}
