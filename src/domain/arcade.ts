import type { Wallet } from './learning';

export type GameId = 'blocks' | 'maze' | 'runner' | 'space' | 'chickens';
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
  instructions: string;
}[] = [
  {
    id: 'blocks',
    name: 'Klötzchen-Kosmos',
    icon: '▦',
    description: 'Drehen, stapeln, Reihen knacken.',
    instructions:
      'Fülle ganze Reihen ohne Lücken. ← → bewegen, ↑ drehen, ↓ schneller fallen, Leertaste sofort ablegen. Eine Reihe bringt 100 Spielpunkte. Die Runde endet nach 4 Minuten oder wenn der Turm oben ankommt.',
  },
  {
    id: 'maze',
    name: 'Sternenlabyrinth',
    icon: '◈',
    description: 'Dein 3D-Abenteuer in einer neuen Sternenwelt.',
    instructions:
      'Sammle 5 Sterne und finde das grüne Portal! ↑ ↓ oder W S laufen, ← → oder A D drehen. Leertaste wirft Blasen: Roboter schweben davon. Die Karte zeigt dir den Weg. Du hast 5 Herzen und bis zu 4 Minuten.',
  },
  {
    id: 'space',
    name: 'Sternenwache',
    icon: '✦',
    description: 'Rette die Raumstation vor frechen Robotern.',
    instructions:
      '← → steuern dein Raumschiff. Leertaste schickt Lichtblitze zu den Robotern (je 25 Spielpunkte). Weiche ihren Blitzen aus! Besiege 6 Wellen. Du hast 3 Herzen; erreicht ein Roboter deine Station, endet die Runde.',
  },
  {
    id: 'chickens',
    name: 'Hühner-Rummel',
    icon: '♧',
    description: 'Erwische die flinken Hühner mit Konfetti!',
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
  instructions:
    'Du läufst von selbst. Springe mit ↑ oder Leertaste über Baumstämme. ← → bremsen oder beschleunigen. Sterne bringen 50 Spielpunkte. Erreiche die Zielfahne mit deinen 3 Herzen!',
};
export const gameDefinition = (id: GameId) =>
  id === 'runner' ? legacyRunner : games.find((g) => g.id === id)!;
