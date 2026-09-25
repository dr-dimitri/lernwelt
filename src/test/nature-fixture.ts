import type { LearningState, Question, Topic } from '../domain/learning';
import { initial } from './learning-fixture';

export const natureTopic: Topic = {
  id: 'nature-research',
  name: 'Forscher-Werkstatt',
  subject: 'nature',
  grade: 5,
  curriculumRef: 'NT5 1.1',
  description: 'Beobachten, fragen und fair vergleichen.',
  lesson: 'Bei einem fairen Vergleich veränderst du nur eine Bedingung.',
  activities: [
    {
      title: 'Genau beobachten',
      prompt: 'Zeichne ein Blatt.',
      check: 'Vergleiche Form und Adern.',
    },
  ],
  languageSequence: null,
  source: 'https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym',
  curriculumVersion: 'LehrplanPLUS, Quellenstand 25.09.2026',
};
const natureQuestion: Question = {
  id: 'by.nature.5.research.4.v1',
  subject: 'nature',
  topicId: natureTopic.id,
  difficulty: 'koenner',
  competencyId: 'by.nature.5.research.fair-test',
  prompt: 'Wie vergleichst du zwei Pflanzen fair?',
  hint: 'Nur eine Bedingung ist anders.',
  options: ['Nur die Wassermenge ändern', 'Alles gleichzeitig ändern'],
  answerKind: 'choice',
  unit: null,
  solved: false,
};
export const natureInitial: LearningState = {
  ...initial,
  topics: [...initial.topics, natureTopic],
  questions: [
    ...initial.questions,
    natureQuestion,
    {
      ...natureQuestion,
      id: 'by.nature.5.research.7.v1',
      difficulty: 'streber',
      prompt: 'Was macht diesen Vergleich unfair?',
    },
  ],
};
