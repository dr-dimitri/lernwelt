export type SubjectId = 'mathematics' | 'english' | 'nature' | 'geography';

export interface Subject {
  id: SubjectId;
  name: string;
  symbol: string;
  description: string;
}

export const subjects: readonly Subject[] = [
  {
    id: 'mathematics',
    name: 'Mathematik',
    symbol: 'π',
    description: 'Zusammenhänge entdecken. Lösungen verstehen.',
  },
  {
    id: 'english',
    name: 'Englisch',
    symbol: 'Aa',
    description: 'Sprache entdecken. Mit jedem Schritt sicherer werden.',
  },
  {
    id: 'nature',
    name: 'Natur und Technik',
    symbol: '⚘',
    description: 'Forschen, staunen, ausprobieren. Entdecke deine Umwelt!',
  },
  {
    id: 'geography',
    name: 'Geographie',
    symbol: '◎',
    description: 'Auf ins Sonnensystem! Entdecke unsere kosmischen Nachbarn.',
  },
];
