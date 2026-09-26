import type { LearningState, Question, Topic } from '../domain/learning';

export const mathQuestion: Question = {
  id: 'math',
  subject: 'mathematics',
  topicId: 'add',
  difficulty: 'koenner',
  competencyId: 'math.add',
  prompt: 'Was ist 17 + 25?',
  hint: 'Ergänze zuerst um 20.',
  furtherHints: ['Jetzt fehlen noch die 5 Einer. Zähle sie dazu.'],
  options: [],
  answerKind: 'number',
  unit: 'Nur die Zahl eingeben.',
  solved: false,
};
export const mathTopic: Topic = {
  id: 'add',
  subject: 'mathematics',
  grade: 5,
  curriculumRef: 'M5 1.2',
  name: 'Plus & Minus',
  description: 'Schlau rechnen.',
  lesson: 'Du darfst Summanden vertauschen.',
  languageSequence: null,
  activities: [
    {
      title: 'Rechenwege',
      prompt: 'Erkläre deinen Weg.',
      check: 'Viele Wege sind möglich.',
    },
  ],
};
export const initial: LearningState = {
  profileReady: true,
  difficulty: 'koenner',
  pointsByDifficulty: { vorschule: 1, koenner: 2, streber: 3 },
  curriculumSource:
    'https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik',
  curriculumVersion: 'LehrplanPLUS 2026-09-24',
  topics: [
    mathTopic,
    {
      ...mathTopic,
      id: 'english',
      name: 'English warm-up',
      subject: 'english',
      languageSequence: '1. Fremdsprache',
      activities: [],
    },
  ],
  questions: [
    mathQuestion,
    {
      ...mathQuestion,
      id: 'english',
      subject: 'english',
      topicId: 'english',
      prompt: 'Katze auf Englisch?',
      answerKind: 'text',
      unit: null,
    },
  ],
  wallet: {
    balance: 10,
    totalEarned: 10,
    rewards: [
      {
        id: 'star',
        name: 'Sternsammler',
        description: 'Dein Abzeichen.',
        cost: 20,
        owned: false,
      },
    ],
  },
};
