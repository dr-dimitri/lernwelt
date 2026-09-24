import type { GameId } from '../domain/arcade';

export type Action =
  'left' | 'right' | 'down' | 'rotate' | 'jump' | 'fire' | 'drop';
export interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
}
export interface Shot {
  x: number;
  y: number;
  enemy: boolean;
}
export interface Game {
  id: GameId;
  score: number;
  elapsed: number;
  over: boolean;
  won: boolean;
  seed: number;
  x: number;
  y: number;
  vy: number;
  lives: number;
  cooldown: number;
  invincible: number;
  entities: Entity[];
  coins: Entity[];
  shots: Shot[];
  direction: number;
  wave: number;
  enemyClock: number;
  board: number[][];
  piece: number[][];
  pieceX: number;
  pieceY: number;
  next: number;
  fallClock: number;
  color: number;
  bursts: { x: number; y: number; ttl: number }[];
}
const shapes = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
];
function random(g: Game) {
  g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0;
  return g.seed / 4294967296;
}
export function overlaps(a: Entity, b: Entity) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
function wave(g: Game) {
  g.entities = Array.from({ length: 24 }, (_, i) => ({
    x: 80 + (i % 8) * 58,
    y: 65 + Math.floor(i / 8) * 42,
    w: 30,
    h: 25,
    alive: true,
  }));
  g.direction = 1;
  g.enemyClock = 0;
  g.shots = [];
}
export function createGame(id: GameId, seed = Date.now()): Game {
  const g: Game = {
    id,
    score: 0,
    elapsed: 0,
    over: false,
    won: false,
    seed,
    x: 100,
    y: 310,
    vy: 0,
    lives: 3,
    cooldown: 0,
    invincible: 0,
    entities: [],
    coins: [],
    shots: [],
    direction: 1,
    wave: 1,
    enemyClock: 0,
    board: Array.from({ length: 18 }, () => Array<number>(10).fill(0)),
    piece: [],
    pieceX: 3,
    pieceY: 0,
    next: 0,
    fallClock: 0,
    color: 1,
    bursts: [],
  };
  if (id === 'blocks') {
    g.next = Math.floor(random(g) * 7);
    spawn(g);
  }
  if (id === 'runner') {
    g.entities = Array.from({ length: 10 }, (_, i) => ({
      x: 480 + i * 300,
      y: 316,
      w: 36,
      h: 34,
      alive: true,
    }));
    g.coins = Array.from({ length: 20 }, (_, i) => ({
      x: 350 + i * 150,
      y: i % 2 ? 238 : 290,
      w: 20,
      h: 20,
      alive: true,
    }));
  }
  if (id === 'space') {
    g.x = 305;
    g.y = 350;
    wave(g);
  }
  if (id === 'chickens') {
    g.entities = Array.from({ length: 5 }, (_, i) => ({
      x: 60 + i * 115,
      y: 80 + (i % 3) * 70,
      w: 56,
      h: 45,
      alive: true,
    }));
  }
  return g;
}
function fits(g: Game, piece = g.piece, x = g.pieceX, y = g.pieceY) {
  return piece.every((row, dy) =>
    row.every(
      (cell, dx) =>
        !cell ||
        (x + dx >= 0 &&
          x + dx < 10 &&
          y + dy >= 0 &&
          y + dy < 18 &&
          !g.board[y + dy][x + dx]),
    ),
  );
}
function spawn(g: Game) {
  g.color = g.next + 1;
  g.piece = shapes[g.next].map((row) => [...row]);
  g.next = Math.floor(random(g) * 7);
  g.pieceX = Math.floor((10 - g.piece[0].length) / 2);
  g.pieceY = 0;
  if (!fits(g)) g.over = true;
}
function descend(g: Game) {
  if (fits(g, g.piece, g.pieceX, g.pieceY + 1)) {
    g.pieceY++;
    return;
  }
  g.piece.forEach((row, dy) =>
    row.forEach((cell, dx) => {
      if (cell) g.board[g.pieceY + dy][g.pieceX + dx] = g.color;
    }),
  );
  const remaining = g.board.filter((row) => row.some((cell) => !cell));
  const lines = 18 - remaining.length;
  g.score += lines * lines * 100;
  g.board = [
    ...Array.from({ length: lines }, () => Array<number>(10).fill(0)),
    ...remaining,
  ];
  spawn(g);
}
export function actGame(g: Game, action: Action) {
  if (g.over) return;
  if (g.id === 'blocks') {
    if (action === 'left' && fits(g, g.piece, g.pieceX - 1)) g.pieceX--;
    if (action === 'right' && fits(g, g.piece, g.pieceX + 1)) g.pieceX++;
    if (action === 'rotate') {
      const rotated = g.piece[0].map((_, x) =>
        g.piece.map((row) => row[x]).reverse(),
      );
      for (const offset of [0, -1, 1, -2, 2])
        if (fits(g, rotated, g.pieceX + offset)) {
          g.piece = rotated;
          g.pieceX += offset;
          break;
        }
    }
    if (action === 'down') descend(g);
    if (action === 'drop') {
      while (fits(g, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++;
      descend(g);
      g.fallClock = 0;
    }
  }
  if (g.id === 'runner' && action === 'jump' && g.y >= 310) g.vy = -500;
  if (g.id === 'space' && action === 'fire' && g.cooldown <= 0) {
    g.shots.push({ x: g.x + 15, y: g.y, enemy: false });
    g.cooldown = 0.22;
  }
}
export function hitChicken(g: Game, index: number) {
  if (g.id !== 'chickens' || g.over || g.cooldown > 0) return;
  const target = g.entities[index];
  if (!target?.alive) return;
  g.score += 50;
  g.cooldown = 0.35;
  g.bursts.push({ x: target.x + 28, y: target.y + 22, ttl: 0.5 });
  target.x = 20 + random(g) * 550;
  target.y = 65 + random(g) * 210;
}
export function pointAt(g: Game, x: number, y: number) {
  const i = g.entities.findIndex(
    (e) => e.alive && x >= e.x && x <= e.x + e.w && y >= e.y && y <= e.y + e.h,
  );
  if (i >= 0) hitChicken(g, i);
}
export function stepGame(
  g: Game,
  dt: number,
  held: ReadonlySet<Action> = new Set(),
) {
  if (g.over) return;
  dt = Math.min(Math.max(dt, 0), 0.04);
  g.elapsed += dt;
  g.cooldown -= dt;
  g.invincible -= dt;
  g.bursts = g.bursts.filter((b) => (b.ttl -= dt) > 0);
  if (g.id === 'blocks') {
    g.fallClock += dt;
    if (g.fallClock >= Math.max(0.12, 0.65 - g.score / 6000)) {
      descend(g);
      g.fallClock = 0;
    }
    if (g.elapsed >= 120) {
      g.over = true;
      g.won = true;
    }
  }
  if (g.id === 'runner') {
    g.x += (held.has('left') ? 95 : held.has('right') ? 195 : 145) * dt;
    g.vy += 1150 * dt;
    g.y = Math.min(310, g.y + g.vy * dt);
    if (g.y >= 310) g.vy = 0;
    const player = { x: g.x, y: g.y, w: 28, h: 40, alive: true };
    for (const coin of g.coins)
      if (coin.alive && overlaps(player, coin)) {
        coin.alive = false;
        g.score += 50;
      }
    if (g.invincible <= 0 && g.entities.some((e) => overlaps(player, e))) {
      g.lives--;
      g.invincible = 1.5;
      if (!g.lives) g.over = true;
    }
    if (!g.over && g.x >= 3400) {
      g.over = true;
      g.won = true;
      g.score += 500;
    }
  }
  if (g.id === 'space') {
    g.x = Math.max(
      10,
      Math.min(
        600,
        g.x +
          ((held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0)) * 300 * dt,
      ),
    );
    if (held.has('fire')) actGame(g, 'fire');
    const alive = g.entities.filter((e) => e.alive);
    if (alive.some((e) => e.x <= 10 || e.x + e.w >= 630)) {
      g.direction *= -1;
      alive.forEach((e) => {
        e.y += 17;
        e.x = Math.max(11, Math.min(599, e.x));
      });
    }
    alive.forEach((e) => {
      e.x += g.direction * (25 + g.wave * 12) * dt;
    });
    g.enemyClock += dt;
    if (g.enemyClock >= 1.1 && alive.length) {
      const shooter = alive[Math.floor(random(g) * alive.length)];
      g.shots.push({ x: shooter.x + 15, y: shooter.y + 25, enemy: true });
      g.enemyClock = 0;
    }
    for (const shot of g.shots) {
      shot.y += (shot.enemy ? 180 + g.wave * 20 : -440) * dt;
      const box = { x: shot.x - 3, y: shot.y, w: 6, h: 12, alive: true };
      if (shot.enemy) {
        if (
          g.invincible <= 0 &&
          overlaps(box, { x: g.x, y: g.y, w: 30, h: 30, alive: true })
        ) {
          g.lives--;
          g.invincible = 1;
          shot.y = 500;
        }
      } else {
        const target = alive.find((e) => e.alive && overlaps(box, e));
        if (target) {
          target.alive = false;
          g.score += 25;
          shot.y = -100;
        }
      }
    }
    g.shots = g.shots.filter((s) => s.y > -20 && s.y < 410);
    if (g.lives <= 0 || alive.some((e) => e.alive && e.y + e.h >= 340))
      g.over = true;
    else if (g.entities.every((e) => !e.alive)) {
      if (g.wave === 3) {
        g.over = true;
        g.won = true;
      } else {
        g.wave++;
        wave(g);
      }
    }
  }
  if (g.id === 'chickens') {
    g.entities.forEach((e, i) => {
      e.x += (i % 2 ? -1 : 1) * (35 + i * 10) * dt;
      if (e.x > 584) e.x = 0;
      if (e.x < 0) e.x = 584;
      e.y += Math.sin(g.elapsed * 2 + i * 2) * 24 * dt;
    });
    if (g.elapsed >= 45) {
      g.over = true;
      g.won = true;
    }
  }
  g.score = Math.min(g.score, 1_000_000);
}
