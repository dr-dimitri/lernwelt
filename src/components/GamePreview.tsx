import { useEffect, useRef } from 'react';
import type { GameId } from '../domain/arcade';
import { createGame } from '../games/engine';
import { drawGame } from '../games/draw';
import { prepareCanvas } from '../games/canvas';
import { createWorms } from '../games/worms';
import { drawWorms } from '../games/worms-draw';

export default function GamePreview({ gameId }: { gameId: GameId }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Decorative sample only: never starts a round, ticks an engine or uses IPC.
    const wormGame = gameId === 'worms' ? createWorms(42) : null;
    const game = gameId === 'worms' ? null : createGame(gameId, 42);
    if (game) game.elapsed = 8;
    if (gameId === 'blocks' && game) {
      game.board[17] = [1, 1, 2, 2, 3, 3, 3, 0, 4, 4];
      game.board[16] = [1, 1, 2, 2, 0, 3, 0, 0, 4, 4];
      game.board[15] = [0, 0, 0, 0, 0, 0, 0, 0, 4, 0];
      game.pieceY = 5;
    } else if (gameId === 'maze' && game?.maze) {
      const m = game.maze;
      m.robots[0].x = m.x + Math.cos(m.angle) * 2;
      m.robots[0].y = m.y + Math.sin(m.angle) * 2;
    } else if (gameId === 'runner' && game) {
      game.x = 390;
      game.y = 268;
    } else if (gameId === 'space' && game) {
      game.shots = [
        { x: 320, y: 266, enemy: false },
        { x: 225, y: 191, enemy: true },
      ];
    }
    const paint = () => {
      if (!canvas.current) return;
      const context = prepareCanvas(canvas.current);
      if (context && wormGame) drawWorms(context, wormGame, true);
      else if (context && game) drawGame(context, game);
    };
    paint();
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
  }, [gameId]);
  return (
    <canvas
      className="game-preview"
      ref={canvas}
      width={640}
      height={400}
      aria-hidden="true"
    />
  );
}
