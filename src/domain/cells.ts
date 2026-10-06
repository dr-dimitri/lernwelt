import type { Difficulty, Question } from './learning';

export type CellType = 'animal' | 'plant';
export type CellPart =
  | 'membrane'
  | 'plasma'
  | 'nucleus'
  | 'wall'
  | 'vacuole'
  | 'chloroplast'
  | 'envelope'
  | 'information';
export type CellStation = 'cell' | 'nucleus' | 'microscope' | 'life';
export type CellFilter = CellStation | 'all';
export const cellParts: Record<
  CellPart,
  { name: string; explanation: string }
> = {
  membrane: {
    name: 'Zellmembran',
    explanation:
      'Diese dünne Grenze umgibt die ganze Zelle. Sie hilft zu regeln, welche Stoffe hinein- und hinausgelangen.',
  },
  plasma: {
    name: 'Zellplasma',
    explanation:
      'Das Zellplasma ist das Material im Zellinneren um die Zellbestandteile. Hier laufen viele Vorgänge ab.',
  },
  nucleus: {
    name: 'Zellkern',
    explanation:
      'Im Zellkern liegt ein großer Teil der Erbinformation. Sie enthält Anleitungen, die für Aufbau und Arbeit der Zelle wichtig sind.',
  },
  wall: {
    name: 'Zellwand',
    explanation:
      'Diese feste äußere Hülle stützt die Pflanzenzelle. Sie liegt außerhalb der Zellmembran. Tierzellen haben keine Zellwand.',
  },
  vacuole: {
    name: 'Vakuole',
    explanation:
      'Ein großer, mit Flüssigkeit gefüllter Raum. Er kann viel Platz in einer Pflanzenzelle einnehmen.',
  },
  chloroplast: {
    name: 'Chloroplasten',
    explanation:
      'Diese Zellbestandteile enthalten Blattgrün. Mit Licht kann die grüne Pflanzenzelle hier Zucker herstellen. Nicht jede Pflanzenzelle hat Chloroplasten.',
  },
  envelope: {
    name: 'Kernhülle',
    explanation:
      'Die Kernhülle grenzt den Zellkern vom übrigen Zellinneren ab. Sie ist eine andere Grenze als die Zellmembran.',
  },
  information: {
    name: 'Erbinformation',
    explanation:
      'Anleitungen für Aufbau und Arbeit der Zelle. DNA ist ein Träger dieser Information. Die geschwungenen Linien im Modell sind keine sichtbare DNA-Aufnahme.',
  },
};
export const cellStations: { id: CellFilter; label: string }[] = [
  { id: 'all', label: 'Alle Zellrätsel' },
  { id: 'cell', label: 'Zellteile' },
  { id: 'nucleus', label: 'Zellkern' },
  { id: 'microscope', label: 'Forscherblick' },
  { id: 'life', label: 'Was lebt?' },
];
export const cellPhoto = {
  src: '/images/cells/cheek-cells.jpg',
  width: 640,
  height: 480,
  alt: 'Lichtmikroskopaufnahme gefärbter menschlicher Wangenzellen. Ein dunkler ovaler Bereich liegt im Inneren der großen Zelle.',
  credit: 'Krishna satya 333 · CC BY-SA 4.0',
  source:
    'https://commons.wikimedia.org/wiki/File:Nucleus_in_human_cheek_cells.jpg',
  license: 'https://creativecommons.org/licenses/by-sa/4.0/',
  description:
    'Menschliche Wangenzellen, mit Methylenblau gefärbt. Die dunklen ovalen Bereiche sind Zellkerne. Eine Wangenzelle ist eine Tierzelle.',
};
export function isCellQuestion(question: Question) {
  return (
    question.subject === 'nature' &&
    ['nature-cells', 'nature-nucleus'].includes(question.topicId)
  );
}
export function cellQuestionStation(id: string): CellStation {
  const newTask = /\.nucleus\.\w+\.(\d+)\.v1$/.exec(id);
  if (newTask)
    return [4, 5].includes(Number(newTask[1])) ? 'microscope' : 'nucleus';
  const original = /\.cells\.(\d+)\.v1$/.exec(id);
  if (original)
    return (
      (
        {
          1: 'life',
          3: 'microscope',
          6: 'microscope',
          7: 'life',
          9: 'microscope',
        } as Record<number, CellStation>
      )[Number(original[1])] ?? 'cell'
    );
  const focus = /\.focus\.cells\.\w+\.(\d+)\.v1$/.exec(id);
  if (focus)
    return [1, 11].includes(Number(focus[1]))
      ? 'life'
      : [3, 12].includes(Number(focus[1]))
        ? 'microscope'
        : 'cell';
  return 'cell';
}
export function cellQuestionVisual(question: Question): {
  kind: 'animal' | 'plant' | 'nucleus' | 'micro' | 'compare' | 'relation';
  target?: CellPart;
} | null {
  if (!question.id.includes('.nucleus.')) return null;
  const number = Number(question.id.split('.').at(-2));
  const kind = (
    ['animal', 'plant', 'nucleus', 'micro', 'compare', 'relation'] as const
  )[number - 1];
  if (kind === 'animal')
    return {
      kind,
      target: question.difficulty === 'koenner' ? 'membrane' : 'nucleus',
    };
  if (kind === 'plant') return { kind, target: 'nucleus' };
  if (kind === 'nucleus') return { kind, target: 'envelope' };
  return { kind };
}
/** New and existing tasks share identities and alternate; six tasks never gate discovery. */
export function cellQuestions(
  questions: Question[],
  difficulty: Difficulty,
  filter: CellFilter = 'all',
) {
  const bank = questions.filter(
    (q) =>
      isCellQuestion(q) &&
      q.difficulty === difficulty &&
      (filter === 'all' || cellQuestionStation(q.id) === filter),
  );
  const newTasks = bank.filter((q) => q.topicId === 'nature-nucleus');
  const oldTasks = bank.filter((q) => q.topicId === 'nature-cells');
  const mixed: Question[] = [];
  for (let i = 0; i < Math.max(newTasks.length, oldTasks.length); i++) {
    if (newTasks[i]) mixed.push(newTasks[i]);
    if (oldTasks[i]) mixed.push(oldTasks[i]);
  }
  return mixed;
}
