import { describe, expect, it } from 'vitest';
import { actGame, createGame, stepGame } from './engine';
import { mazeRoute, moveMaze, visible, wallAt } from './maze';

describe('Sternenlabyrinth', () => {
  it('erzeugt verschiedene, reproduzierbare Welten mit erreichbaren Sternen und Portal', () => {
    const worlds = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const m = createGame('maze', seed).maze!;
      expect(m).toEqual(createGame('maze', seed).maze);
      worlds.add(JSON.stringify(m.cells));
      const reached = new Set(['1,1']);
      const pending = [[1, 1]];
      for (let i = 0; i < pending.length; i++) {
        const [x, y] = pending[i];
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx,
            ny = y + dy,
            key = `${nx},${ny}`;
          if (!wallAt(m, nx, ny) && !reached.has(key)) {
            reached.add(key);
            pending.push([nx, ny]);
          }
        }
      }
      for (const item of [...m.stars, ...m.robots, m.exit])
        expect(reached.has(`${Math.floor(item.x)},${Math.floor(item.y)}`)).toBe(
          true,
        );
      expect(
        new Set([...m.stars, ...m.robots].map((s) => `${s.x},${s.y}`)).size,
      ).toBe(13);
      expect(mazeRoute(m).length).toBeGreaterThan(1);
      expect(m.cells[0].every(Boolean) && m.cells[14].every(Boolean)).toBe(
        true,
      );
    }
    expect(worlds.size).toBe(100);
  });
  it('stoppt an Wänden, dreht und bewegt sich per gehaltener Taste', () => {
    const g = createGame('maze', 2),
      m = g.maze!;
    m.x = 1.25;
    m.y = 1.25;
    moveMaze(m, m, -0.1, -0.1);
    expect([m.x, m.y]).toEqual([1.25, 1.25]);
    const angle = m.angle;
    stepGame(g, 0.04, new Set(['right']));
    expect(m.angle).toBeGreaterThan(angle);
    m.angle = angle;
    const before = [m.x, m.y];
    stepGame(g, 0.04, new Set(['forward']));
    expect([m.x, m.y]).not.toEqual(before);
  });
  it('Blasen treffen nur sichtbare Roboter im Fadenkreuz und vergeben den Bonus einmal', () => {
    const g = createGame('maze', 1),
      m = g.maze!;
    m.cells = Array.from({ length: 7 }, (_, y) =>
      Array.from(
        { length: 7 },
        (_, x) => +(x === 0 || y === 0 || x === 6 || y === 6),
      ),
    );
    m.x = 1.5;
    m.y = 1.5;
    m.angle = 0;
    m.robots = [
      { x: 3.5, y: 1.5, alive: true },
      { x: 1.5, y: 3.5, alive: true },
    ];
    m.cells[1][2] = 1;
    expect(visible(m, m.x, m.y, m.robots[0])).toBe(false);
    actGame(g, 'fire');
    expect(g.score).toBe(0);
    m.cells[1][2] = 0;
    g.cooldown = 0;
    actGame(g, 'fire');
    expect(g.score).toBe(75);
    actGame(g, 'fire');
    expect(g.score).toBe(75);
    expect(m.robots[1].alive).toBe(true);
  });
  it('sammelt Sterne einmal, öffnet das Ziel erst danach und beendet die Runde einmalig', () => {
    const g = createGame('maze', 9),
      m = g.maze!;
    m.robots = [];
    m.x = m.exit.x;
    m.y = m.exit.y;
    stepGame(g, 0.01);
    expect(g.over).toBe(false);
    for (const star of m.stars) {
      m.x = star.x;
      m.y = star.y;
      stepGame(g, 0.01);
      stepGame(g, 0.01);
    }
    expect(g.score).toBe(500);
    m.x = m.exit.x;
    m.y = m.exit.y;
    stepGame(g, 0.01);
    expect(g.won).toBe(true);
    expect(g.score).toBe(1000);
    stepGame(g, 0.04);
    expect(g.score).toBe(1000);
  });
  it('begrenzt Roboterschaden und endet bei null Herzen oder nach vier Minuten', () => {
    const g = createGame('maze', 1),
      m = g.maze!;
    m.robots = [{ x: m.x, y: m.y, alive: true }];
    stepGame(g, 0.02);
    expect(g.lives).toBe(4);
    stepGame(g, 0.02);
    expect(g.lives).toBe(4);
    g.invincible = 0;
    g.lives = 1;
    stepGame(g, 0.02);
    expect(g.over).toBe(true);
    const timed = createGame('maze', 1);
    timed.elapsed = 239.99;
    stepGame(timed, 0.02);
    expect(timed.over).toBe(true);
    expect(timed.won).toBe(false);
  });
});
