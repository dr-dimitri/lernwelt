import { describe, expect, it } from 'vitest';
import { actGame, createGame, hitChicken, pointAt, stepGame } from './engine';

describe('Klötzchen-Kosmos', () => {
  it('löscht volle Reihen, zählt den Bonus und erzeugt den nächsten Stein', () => {
    const g = createGame('blocks', 1);
    g.board[17] = [1, 1, 1, 1, 0, 0, 1, 1, 1, 1];
    g.piece = [[1, 1]];
    g.pieceX = 4;
    g.pieceY = 16;
    actGame(g, 'drop');
    expect(g.score).toBe(100);
    expect(g.board.every((row) => row.every((cell) => !cell))).toBe(true);
    expect(g.pieceY).toBe(0);
  });
  it('verhindert Rand- und Steinkollisionen und beendet einen vollen Turm', () => {
    const g = createGame('blocks', 4);
    g.piece = [[1], [1], [1], [1]];
    g.pieceX = 0;
    actGame(g, 'left');
    expect(g.pieceX).toBe(0);
    actGame(g, 'rotate');
    expect(g.piece).toEqual([[1, 1, 1, 1]]);
    g.board[0][4] = 2;
    actGame(g, 'right');
    expect(g.pieceX).toBe(0);
    g.board = g.board.map(() => [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]);
    g.piece = [[1]];
    g.pieceX = 9;
    g.pieceY = 0;
    actGame(g, 'drop');
    expect(g.over).toBe(true);
  });
  it('endet nach zwei Minuten ohne automatische neue Runde', () => {
    const g = createGame('blocks');
    g.elapsed = 119.99;
    stepGame(g, 0.02);
    expect(g.over).toBe(true);
    const snapshot = structuredClone(g);
    actGame(g, 'drop');
    stepGame(g, 0.04);
    expect(g).toEqual(snapshot);
  });
});
describe('Wolkenflitzer', () => {
  it('springt, landet, sammelt Sterne und verliert bei Hindernissen Herzen', () => {
    const g = createGame('runner');
    actGame(g, 'jump');
    stepGame(g, 0.04);
    expect(g.y).toBeLessThan(310);
    const velocity = g.vy;
    actGame(g, 'jump');
    expect(g.vy).toBe(velocity);
    for (let i = 0; i < 40; i++) stepGame(g, 0.04);
    expect(g.y).toBe(310);
    g.coins = [{ x: g.x + 5, y: 310, w: 20, h: 20, alive: true }];
    stepGame(g, 0.01);
    expect(g.score).toBe(50);
    g.entities = [{ x: g.x + 5, y: 310, w: 50, h: 40, alive: true }];
    stepGame(g, 0.01);
    expect(g.lives).toBe(2);
    stepGame(g, 0.01);
    expect(g.lives).toBe(2);
    g.entities = [];
    g.x = 3399;
    stepGame(g, 0.02);
    expect(g.over).toBe(true);
    expect(g.won).toBe(true);
    expect(g.score).toBe(550);
  });
});
describe('Sternenwache', () => {
  it('trifft Roboter, startet die nächste Welle und gewinnt nach drei Wellen', () => {
    const g = createGame('space', 1);
    g.entities = [{ x: 300, y: 100, w: 30, h: 25, alive: true }];
    g.shots = [{ x: 315, y: 124, enemy: false }];
    stepGame(g, 0.02);
    expect(g.score).toBe(25);
    expect(g.wave).toBe(2);
    g.wave = 3;
    g.entities.forEach((e) => (e.alive = false));
    stepGame(g, 0.02);
    expect(g.over).toBe(true);
    expect(g.won).toBe(true);
  });
  it('begrenzt Feuerfrequenz und endet bei Verlust der Herzen oder Station', () => {
    const g = createGame('space');
    actGame(g, 'fire');
    actGame(g, 'fire');
    expect(g.shots).toHaveLength(1);
    g.lives = 1;
    g.shots = [{ x: g.x + 15, y: 345, enemy: true }];
    stepGame(g, 0.03);
    expect(g.lives).toBe(0);
    expect(g.over).toBe(true);
    const invasion = createGame('space');
    invasion.entities[0].y = 320;
    stepGame(invasion, 0.02);
    expect(invasion.over).toBe(true);
  });
});
describe('Hühner-Rummel', () => {
  it('wertet nur Hühner-Treffer, mit Wartezeit und festem Rundenende', () => {
    const g = createGame('chickens', 1);
    pointAt(g, 635, 395);
    expect(g.score).toBe(0);
    pointAt(g, 65, 90);
    expect(g.score).toBe(50);
    hitChicken(g, 1);
    expect(g.score).toBe(50);
    for (let i = 0; i < 10; i++) stepGame(g, 0.04);
    hitChicken(g, 1);
    expect(g.score).toBe(100);
    hitChicken(g, 99);
    expect(g.score).toBe(100);
    g.elapsed = 44.99;
    stepGame(g, 0.02);
    expect(g.over).toBe(true);
    hitChicken(g, 2);
    expect(g.score).toBe(100);
  });
});
