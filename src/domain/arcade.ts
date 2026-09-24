import type { Wallet } from './learning';

export type GameId = 'blocks' | 'runner' | 'space' | 'chickens';
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
      'Fülle ganze Reihen ohne Lücken. ← → bewegen, ↑ drehen, ↓ schneller fallen, Leertaste sofort ablegen. Eine Reihe bringt 100 Spielpunkte. Die Runde endet nach 2 Minuten oder wenn der Turm oben ankommt.',
  },
  {
    id: 'runner',
    name: 'Wolkenflitzer',
    icon: '↗',
    description: 'Hüpf über Baumstämme und sammle Sterne.',
    instructions:
      'Du läufst von selbst. Springe mit ↑ oder Leertaste über Baumstämme. ← → bremsen oder beschleunigen. Sterne bringen 50 Spielpunkte. Erreiche die Zielfahne mit deinen 3 Herzen!',
  },
  {
    id: 'space',
    name: 'Sternenwache',
    icon: '✦',
    description: 'Rette die Raumstation vor frechen Robotern.',
    instructions:
      '← → steuern dein Raumschiff. Leertaste schickt Lichtblitze zu den Robotern (je 25 Spielpunkte). Weiche ihren Blitzen aus! Besiege 3 Wellen. Du hast 3 Herzen; erreicht ein Roboter deine Station, endet die Runde.',
  },
  {
    id: 'chickens',
    name: 'Hühner-Rummel',
    icon: '♧',
    description: 'Erwische die flinken Hühner mit Konfetti!',
    instructions:
      'Tippe auf die fliegenden Hühner oder drücke ihre Nummer (1 bis 5). Ein Treffer gibt 50 Spielpunkte und eine Konfettiwolke. Nach jedem Wurf wartest du kurz. Du hast 45 Sekunden – wie viele erwischst du?',
  },
];
