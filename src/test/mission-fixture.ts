import type {
  MissionFeedback,
  MissionState,
  MissionStep,
} from '../domain/mission';

export const missionInitial: MissionState = {
  profileReady: true,
  difficulty: 'koenner',
  metadata: {
    id: 'garden',
    title: 'Ein Zaun für unseren Garten',
    description: 'Eigene Lernwelt-Aufgaben zum Umfang eines Rechtecks.',
    subject: 'mathematics',
    grade: 5,
    competencyId: 'by.math.5.area.perimeter',
    source:
      'https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik',
    curriculumVersion: 'LehrplanPLUS Gymnasium Bayern · abgerufen 24.09.2026',
    variantCount: 3,
  },
  progress: {
    tried: false,
    solvedIndependently: false,
    recalledLater: false,
    completedRounds: 0,
  },
  dueAt: null,
  due: false,
  wallet: { balance: 8, totalEarned: 8, rewards: [] },
  session: null,
};

export const missionSteps: MissionStep[] = [
  {
    index: 0,
    kind: 'recall',
    title: 'Was weißt du noch?',
    prompt:
      'Ein rechteckiges Beet ist 7 m lang und 4 m breit. Wie groß ist sein Umfang in m?',
    instructions: [],
    diagram: { width: 7, height: 4, unit: 'm' },
    unit: 'm',
    answerKind: 'number',
    options: [],
    hint: null,
    feedback: null,
  },
  {
    index: 1,
    kind: 'discover',
    title: 'Einmal außen herum',
    prompt:
      'Die gegenüberliegenden Seiten sind gleich lang. 6 + 4 + 6 + 4 = 20 m. Kurz geht es auch: 2 × (6 + 4) = 20 m.',
    instructions: [],
    diagram: { width: 6, height: 4, unit: 'm' },
    unit: null,
    answerKind: null,
    options: [],
    hint: null,
    feedback: null,
  },
  {
    index: 2,
    kind: 'solve',
    title: 'Dein eigener Zaun',
    prompt:
      'Unser rechteckiger Garten ist 9 m lang und 5 m breit. Wie viele Meter Zaun brauchen wir für alle vier Seiten?',
    instructions: [],
    diagram: { width: 9, height: 5, unit: 'm' },
    unit: 'm',
    answerKind: 'number',
    options: [],
    hint: null,
    feedback: null,
  },
  {
    index: 3,
    kind: 'detect',
    title: 'Fehlerdetektiv',
    prompt:
      'Milo rechnet 8 × 3 = 24 und plant 24 m Zaun. Was hat er verwechselt?',
    instructions: [],
    diagram: { width: 8, height: 3, unit: 'm' },
    unit: null,
    answerKind: 'choice',
    options: [
      'Er hat nur eine Seite gemessen.',
      'Er hat den Flächeninhalt statt des Umfangs berechnet.',
      'Er hat zu viele Seiten addiert.',
    ],
    hint: null,
    feedback: null,
  },
  {
    index: 4,
    kind: 'activity',
    title: 'Dein eigener Rand',
    prompt: 'Du brauchst ein Lineal und ein rechteckiges Heft.',
    instructions: [
      'Miss die Länge und Breite der Vorderseite in cm.',
      'Berechne den Umfang.',
      'Fahre mit dem Finger einmal um den Rand. Erkläre dabei deine Rechnung.',
    ],
    diagram: null,
    unit: null,
    answerKind: null,
    options: [],
    hint: null,
    feedback: null,
  },
];

export const missionCorrect: MissionFeedback = {
  correct: true,
  revealed: false,
  explanation:
    '7 + 4 + 7 + 4 = 22 m. Die Länge einmal außen herum heißt Umfang.',
  pointsAwarded: 2,
  independent: true,
};

export function missionAt(
  index: number,
  feedback: MissionFeedback | null = null,
): MissionState {
  return {
    ...missionInitial,
    progress: {
      ...missionInitial.progress,
      tried: true,
      solvedIndependently: feedback?.independent ?? false,
    },
    wallet: { ...missionInitial.wallet, balance: feedback ? 10 : 8 },
    session: {
      id: 'garden-session-koenner-1',
      round: 1,
      variant: 0,
      completed: false,
      currentStep: { ...missionSteps[index], feedback },
    },
  };
}

export const missionActive = missionAt(0);
export const missionCompleted: MissionState = {
  ...missionInitial,
  progress: {
    tried: true,
    solvedIndependently: true,
    recalledLater: false,
    completedRounds: 1,
  },
  dueAt: 1_800_000_000,
  session: {
    id: 'garden-session-koenner-1',
    round: 1,
    variant: 0,
    completed: true,
    currentStep: null,
  },
};
