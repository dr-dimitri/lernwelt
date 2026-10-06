import original from '../../src-tauri/content/nature-5-v1.json';
import extra from '../../src-tauri/content/topic-practice-v1.json';
import nucleus from '../../src-tauri/content/nature-nucleus-5-v1.json';
import catalog from '../../src-tauri/content/study-catalog-v1.json';
import type { LearningState, Question, Topic } from '../domain/learning';
import type { StudyCatalog } from '../domain/study';
import { initial } from './learning-fixture';

export const cellExercises = [
  ...original.exercises.filter((e) => e.topicId === 'nature-cells'),
  ...extra.filter((e) => e.topicId === 'nature-cells'),
  ...nucleus.exercises,
];
export const cellFixture: LearningState = {
  ...initial,
  questions: cellExercises.map((e) => ({
    id: e.id,
    topicId: e.topicId,
    subject: 'nature',
    difficulty: e.difficulty,
    competencyId: e.competencyId,
    prompt: e.prompt,
    hint: e.hint,
    furtherHints: 'furtherHints' in e ? e.furtherHints : [],
    options: e.options,
    answerKind: e.answerKind,
    unit: e.unit,
    solved: false,
  })) as Question[],
  topics: [...original.topics, ...nucleus.topics] as Topic[],
  studyCatalog: catalog as StudyCatalog,
};
