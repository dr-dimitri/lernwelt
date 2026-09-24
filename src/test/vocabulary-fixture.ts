import type { VocabularyState } from '../domain/vocabulary';
export const vocabularyInitial: VocabularyState = {
  profileReady: true,
  difficulty: 'koenner',
  decks: [
    { id: 'hello', name: 'Hello! Das bin ich' },
    { id: 'family', name: 'Meine Familie' },
  ],
  source: 'https://www.lehrplanplus.bayern.de/',
  curriculumVersion: '24.09.2026',
  orientation: 'Eigene Wörter',
  newCount: 370,
  dueCount: 0,
  boxes: [0, 0, 0, 0, 0],
  total: 370,
  catalogTotal: 370,
  wallet: { balance: 8, totalEarned: 28, rewards: [] },
  nextDueAt: null,
  card: {
    card: {
      id: 'hello',
      deckId: 'hello',
      english: 'hello',
      german: 'hallo',
      example: 'I say hello.',
      cloze: 'I say ___.',
      competencyId: 'E5 1.2',
    },
    boxNumber: 1,
    reviews: 0,
  },
};
