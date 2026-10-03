import type { Wallet } from './learning';

export type GameId =
  'blocks' | 'maze' | 'runner' | 'space' | 'chickens' | 'worms';
export interface GameSession {
  id: string;
  gameId: GameId;
}
export interface ArcadeState {
  profileReady: boolean;
  entryCost: number;
  wallet: Wallet;
  activeSession: GameSession | null;
  bestScores: { gameId: GameId; score: number }[];
}
export const games: {
  id: GameId;
  name: string;
  icon: string;
  description: string;
  goal: string;
  controlsHint: string;
  theme: string;
  instructions: string;
}[] = [
  {
    id: 'blocks',
    name: 'Klötzchen-Kosmos',
    icon: '▦',
    description: 'Drehen, stapeln, Reihen knacken.',
    goal: 'Fülle ganze Reihen ohne Lücken.',
    controlsHint: 'Pfeiltasten & Leertaste',
    theme: 'Knobeln im All',
    instructions:
      'Fülle ganze Reihen ohne Lücken. ← → bewegen, ↑ drehen, ↓ schneller fallen, Leertaste sofort ablegen. Eine Reihe bringt 100 Spielpunkte. Die Runde endet nach 4 Minuten oder wenn der Turm oben ankommt.',
  },
  {
    id: 'maze',
    name: 'Sternenlabyrinth',
    icon: '◈',
    description: 'Dein 3D-Abenteuer in einer neuen Sternenwelt.',
    goal: 'Sammle 5 Sterne. Finde dann das grüne Portal.',
    controlsHint: 'Pfeiltasten oder WASD & Leertaste',
    theme: 'Entdecken in 3D',
    instructions:
      'Sammle 5 Sterne und finde das grüne Portal! ↑ ↓ oder W S laufen, ← → oder A D drehen. Leertaste wirft Blasen: Roboter schweben davon. Die Karte zeigt dir den Weg. Du hast 5 Herzen und bis zu 4 Minuten.',
  },
  {
    id: 'space',
    name: 'Sternenwache',
    icon: '✦',
    description: 'Rette die Raumstation vor frechen Robotern.',
    goal: 'Schicke die Roboter mit Lichtblitzen nach Hause.',
    controlsHint: '← → & Leertaste',
    theme: 'Deine Weltraummission',
    instructions:
      '← → steuern dein Raumschiff. Leertaste schickt Lichtblitze zu den Robotern (je 25 Spielpunkte). Weiche ihren Blitzen aus! Besiege 6 Wellen. Du hast 3 Herzen; erreicht ein Roboter deine Station, endet die Runde.',
  },
  {
    id: 'worms',
    name: 'Worms',
    icon: '〰',
    description: 'Zwei Teams, eine Insel und deine Flugbahn.',
    goal: 'Gewinne das Inselduell mit deinem Zweierteam.',
    controlsHint: 'Pfeiltasten, W/S & Leertaste oder Regler',
    theme: 'Dein Inselduell',
    instructions:
      'Deine zwei Würmer spielen gegen ein Computerteam. Bewege deinen aktiven Wurm ein Stück, wähle Richtung, Winkel und Stärke und schieße einmal pro Zug. Treffer nehmen Energie und hinterlassen Krater. Der Wind verschiebt die Flugbahn. ← → bewegen, ↑ ↓ Winkel, W S Stärke, Leertaste schießt. Die Bildschirmtasten und Regler gehen auch. Nach 24 Zügen entscheidet die verbleibende Teamenergie. Jeder Energiepunkt, den das Computerteam verliert, bringt 5 Spielpunkte. Ein ausgeschiedener Computerwurm gibt 100 extra, ein Sieg 500 extra.',
  },
  {
    id: 'chickens',
    name: 'Hühner-Rummel',
    icon: '♧',
    description: 'Erwische die flinken Hühner mit Konfetti!',
    goal: 'Begrüße jedes der 5 Hühner mit Konfetti.',
    controlsHint: 'Anklicken oder Tasten 1–5',
    theme: 'Konfettiparty auf dem Hof',
    instructions:
      'Tippe auf die fliegenden Hühner oder drücke ihre Nummer (1 bis 5). Ein Treffer gibt 50 Spielpunkte und eine Konfettiwolke. Nach jedem Wurf wartest du kurz. Du hast 90 Sekunden – wie viele erwischst du?',
  },
];

// Only already-paid legacy sessions can still launch the old game.
export const legacyRunner = {
  id: 'runner',
  name: 'Wolkenflitzer',
  icon: '↗',
  description: 'Hüpf über Baumstämme und sammle Sterne.',
  goal: 'Sammle Sterne und erreiche die Zielfahne.',
  controlsHint: 'Pfeiltasten & Leertaste',
  theme: 'Über Stock und Stein',
  instructions:
    'Du läufst von selbst. Springe mit ↑ oder Leertaste über Baumstämme. ← → bremsen oder beschleunigen. Sterne bringen 50 Spielpunkte. Erreiche die Zielfahne mit deinen 3 Herzen!',
};
export const gameDefinition = (id: GameId) =>
  id === 'runner' ? legacyRunner : games.find((g) => g.id === id)!;
