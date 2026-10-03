import { describe, expect, it } from 'vitest';
import {
  activeWorm,
  createWorms,
  endWorms,
  fireWorm,
  moveWorm,
  predictWormShot,
  setAim,
  skipTurn,
  stepWorms,
  teamEnergy,
  type WormsState,
} from './worms';

function advanceUntil(state: WormsState, done: () => boolean, seconds = 12) {
  for (let frame = 0; frame < seconds * 60 && !done(); frame++)
    stepWorms(state, 1 / 60);
  expect(done()).toBe(true);
}

function flatDuel() {
  const state = createWorms(7);
  state.terrain.fill(320);
  state.wind = 0;
  for (const worm of state.worms) {
    worm.y = 310;
    worm.fallStart = 310;
  }
  return state;
}

function incoming(state: WormsState, x: number, y: number, vx = 0, vy = 100) {
  state.phase = 'flight';
  state.projectile = { x, y, vx, vy, age: 0.3, ownerId: state.activeId };
  state.trail = [{ x, y }];
}

describe('Worms island duel', () => {
  it('creates four grounded worms on a deterministic island without shared state', () => {
    const first = createWorms(42);
    const replay = createWorms(42);
    expect(replay).toEqual(first);
    expect(createWorms(43).terrain).not.toEqual(first.terrain);
    expect(first.worms.map((worm) => [worm.team, worm.energy])).toEqual([
      ['player', 100],
      ['player', 100],
      ['cpu', 100],
      ['cpu', 100],
    ]);
    expect(
      first.worms.every(
        (worm) => worm.y === first.terrain[Math.floor(worm.x)] - 10,
      ),
    ).toBe(true);
    expect(teamEnergy(first, 'player')).toBe(200);
    first.terrain[100] = 400;
    first.worms[0].energy = 0;
    expect(replay.terrain[100]).not.toBe(400);
    expect(replay.worms[0].energy).toBe(100);
  });

  it('limits movement to 50 world steps per turn and makes facing reversible', () => {
    const state = flatDuel();
    const worm = activeWorm(state)!;
    const start = worm.x;
    for (let i = 0; i < 120; i++) moveWorm(state, 1, 1 / 30);
    expect(worm.x).toBeCloseTo(start + 50);
    expect(state.movementLeft).toBe(0);
    moveWorm(state, -1);
    expect(worm.x).toBeCloseTo(start + 50);
    expect(worm.facing).toBe(-1);
    expect(state.turn).toBe(1);
  });

  it('prevents walking through a living teammate and over a steep upward step', () => {
    const state = flatDuel();
    const worm = activeWorm(state)!;
    state.worms[1].x = worm.x + 24;
    moveWorm(state, 1, 0.1);
    expect(worm.x).toBeLessThan(state.worms[1].x - 21);
    const x = Math.floor(worm.x + 1);
    state.terrain[x] = 270;
    const position = worm.x;
    moveWorm(state, 1, 0.1);
    expect(worm.x).toBe(position);
  });

  it('clamps angle and power, rejects non-finite input and allows choosing the facing', () => {
    const state = createWorms();
    setAim(state, 0, 999, -1);
    expect(state.angle).toBe(15);
    expect(state.power).toBe(100);
    expect(activeWorm(state)?.facing).toBe(-1);
    setAim(state, 180, -1, 1);
    expect([state.angle, state.power]).toEqual([80, 20]);
    setAim(state, NaN, Infinity);
    moveWorm(state, 1, Infinity);
    stepWorms(state, NaN);
    expect([state.angle, state.power, state.elapsed]).toEqual([80, 20, 0]);
  });

  it('fires exactly once and ignores movement, aiming and skip while the shot flies', () => {
    const state = createWorms();
    fireWorm(state);
    const projectile = { ...state.projectile! };
    const angle = state.angle;
    const position = activeWorm(state)!.x;
    fireWorm(state);
    setAim(state, 80, 100);
    moveWorm(state, 1);
    skipTurn(state);
    expect(state.projectile).toEqual(projectile);
    expect(state.phase).toBe('flight');
    expect(state.angle).toBe(angle);
    expect(activeWorm(state)!.x).toBe(position);
  });

  it('draws a bounded ballistic prediction without mutating the game and matches the real impact', () => {
    const state = flatDuel();
    const before = structuredClone(state);
    const path = predictWormShot(state);
    expect(state).toEqual(before);
    expect(path.length).toBeGreaterThan(3);
    expect(path.length).toBeLessThanOrEqual(122);
    expect(Math.min(...path.map((point) => point.y))).toBeLessThan(
      path[0].y - 40,
    );
    fireWorm(state);
    advanceUntil(state, () => state.phase === 'settle');
    const last = path[path.length - 1];
    expect(state.blast!.x).toBeCloseTo(last.x, 1);
    expect(state.blast!.y).toBeCloseTo(last.y, 1);
    expect(state.trail.length).toBeGreaterThan(5);
    expect(state.trail.length).toBeLessThanOrEqual(240);
  });

  it('applies visible direct-hit energy loss and awards game points for computer energy loss', () => {
    const state = flatDuel();
    const opponent = state.worms[2];
    opponent.x = 180;
    state.worms[1].x = 260;
    incoming(state, 140, 310, 240, 0);
    advanceUntil(state, () => state.phase === 'settle');
    expect(opponent.energy).toBeGreaterThan(0);
    expect(opponent.energy).toBeLessThan(60);
    expect(state.score).toBe((100 - opponent.energy) * 5);
    expect(state.feedback.text).toContain(opponent.name);
    expect(state.feedback.text).toContain('Energie');
  });

  it('cuts a crater only at the impact while preserving undamaged terrain', () => {
    const state = flatDuel();
    const before = [...state.terrain];
    incoming(state, 320, 310);
    advanceUntil(state, () => state.phase === 'settle');
    expect(state.terrain[320]).toBeGreaterThan(before[320] + 25);
    expect(state.terrain[270]).toBe(before[270]);
    expect(state.terrain[370]).toBe(before[370]);
    expect(
      state.terrain.every((height, x) => height >= before[x] && height <= 400),
    ).toBe(true);
    expect(state.feedback.text).toContain('Krater');
  });

  it('can hit the own team without awarding points for its energy loss', () => {
    const state = flatDuel();
    const teammate = state.worms[1];
    teammate.x = 180;
    incoming(state, 140, 310, 240, 0);
    advanceUntil(state, () => state.phase === 'settle');
    expect(teammate.energy).toBeLessThan(60);
    expect(state.score).toBe(0);
    expect(state.feedback.text).toContain(teammate.name);
  });

  it('reports a loss or a draw when only the player team or both teams fall into water', () => {
    for (const both of [false, true]) {
      const state = flatDuel();
      for (const worm of state.worms) {
        if (both || worm.team === 'player')
          state.terrain[Math.floor(worm.x)] = 393;
      }
      incoming(state, 320, 310);
      advanceUntil(state, () => state.over);
      expect(state.outcome).toBe(both ? 'draw' : 'loss');
      expect(state.won).toBe(false);
      expect(state.feedback.text).toContain(
        both ? 'unentschieden' : 'Computerteam gewinnt',
      );
    }
  });

  it('settles worms into new craters before the other team starts', () => {
    const state = flatDuel();
    const worm = state.worms[2];
    worm.x = 335;
    incoming(state, 320, 310);
    advanceUntil(state, () => state.phase === 'settle');
    const beforeFall = worm.y;
    advanceUntil(state, () => state.phase === 'cpu');
    expect(worm.y).toBeGreaterThan(beforeFall);
    expect(worm.y).toBeCloseTo(state.terrain[Math.floor(worm.x)] - 10);
    expect(state.turn).toBe(2);
  });

  it('removes worms landing in water and ends with a clear winning result and bounded score', () => {
    const state = flatDuel();
    for (const worm of state.worms.filter(
      (candidate) => candidate.team === 'cpu',
    ))
      state.terrain[Math.floor(worm.x)] = 393;
    incoming(state, 320, 310);
    advanceUntil(state, () => state.over);
    expect(teamEnergy(state, 'player')).toBe(200);
    expect(teamEnergy(state, 'cpu')).toBe(0);
    expect([state.outcome, state.won, state.score]).toEqual([
      'win',
      true,
      1700,
    ]);
    expect(state.feedback.text).toContain('gewinnt');
  });

  it('charges fall damage after a large drop and never gives negative energy', () => {
    const state = flatDuel();
    const worm = state.worms[2];
    state.terrain[Math.floor(worm.x)] = 365;
    worm.energy = 5;
    state.phase = 'settle';
    advanceUntil(state, () => state.phase === 'cpu' || state.over);
    expect(worm.energy).toBe(0);
    expect(state.worms.every((candidate) => candidate.energy >= 0)).toBe(true);
    expect(state.score).toBe(600);
    expect(state.activeId).toBe('cpu-1');
  });

  it('alternates teams and alive worms, replenishing movement once per turn', () => {
    const state = createWorms(4);
    skipTurn(state);
    expect([state.team, state.activeId, state.turn, state.phase]).toEqual([
      'cpu',
      'cpu-0',
      2,
      'cpu',
    ]);
    advanceUntil(state, () => state.team === 'player' && state.phase === 'aim');
    expect(state.activeId).toBe('player-1');
    expect(state.turn).toBe(3);
    expect(state.movementLeft).toBe(50);
    state.worms[0].energy = 0;
    skipTurn(state);
    expect(state.activeId).toBe('cpu-1');
    advanceUntil(
      state,
      () => state.over || (state.team === 'player' && state.phase === 'aim'),
    );
    if (!state.over) expect(state.activeId).toBe('player-1');
  });

  it('makes the computer aim and fire independently within a bounded interval', () => {
    const state = createWorms(2);
    skipTurn(state);
    const input = structuredClone(state);
    setAim(state, 80, 100, 1);
    moveWorm(state, 1);
    fireWorm(state);
    skipTurn(state);
    expect(state).toEqual(input);
    advanceUntil(state, () => state.phase === 'flight', 2);
    expect(state.projectile).not.toBeNull();
    expect(state.angle).toBeGreaterThanOrEqual(25);
    expect(state.power).toBeGreaterThanOrEqual(25);
    advanceUntil(
      state,
      () => state.over || (state.team === 'player' && state.phase === 'aim'),
    );
    expect(state.elapsed).toBeLessThan(12);
  });

  it('ends even the highest shot or an off-island shot instead of trapping a computer turn', () => {
    for (const direction of [-1, 1] as const) {
      const state = createWorms();
      setAim(state, 80, 100, direction);
      fireWorm(state);
      advanceUntil(state, () => state.turn >= 2 || state.over);
      expect(state.projectile).toBeNull();
      expect(state.elapsed).toBeLessThan(11);
    }
  });

  it('ends after 24 turns even when the player skips all shots', () => {
    const state = createWorms(10);
    for (let frame = 0; frame < 12000 && !state.over; frame++) {
      if (state.phase === 'aim') skipTurn(state);
      stepWorms(state, 1 / 30);
    }
    expect(state.over).toBe(true);
    expect(state.turn).toBeLessThanOrEqual(24);
    expect(state.outcome).not.toBeNull();
    expect(state.won).toBe(false);
    expect(state.score).toBeGreaterThanOrEqual(0);
    expect(state.score).toBeLessThanOrEqual(1700);
  });

  it('resolves the turn limit by team energy, including a draw', () => {
    for (const [playerEnergy, cpuEnergy, expected] of [
      [80, 40, 'win'],
      [40, 80, 'loss'],
      [70, 70, 'draw'],
    ] as const) {
      const state = createWorms();
      state.turn = 24;
      state.worms
        .filter((worm) => worm.team === 'player')
        .forEach((worm) => {
          worm.energy = playerEnergy;
        });
      state.worms
        .filter((worm) => worm.team === 'cpu')
        .forEach((worm) => {
          worm.energy = cpuEnergy;
        });
      skipTurn(state);
      expect(state.outcome).toBe(expected);
      expect(state.feedback.text).toContain('24 Zügen');
    }
  });

  it('supports early finishing exactly once and freezes subsequent actions and animation', () => {
    const state = createWorms();
    state.worms[2].energy = 65;
    fireWorm(state);
    endWorms(state);
    expect([state.outcome, state.score, state.projectile]).toEqual([
      'abandoned',
      175,
      null,
    ]);
    const ended = structuredClone(state);
    endWorms(state);
    fireWorm(state);
    skipTurn(state);
    moveWorm(state, 1);
    setAim(state, 80, 100);
    stepWorms(state, 0.1);
    expect(state).toEqual(ended);
  });

  it('keeps the fixed timestep bounded for long gaps, as pause/resume never catches up a full hidden interval', () => {
    const state = createWorms();
    stepWorms(state, 100000);
    expect(state.elapsed).toBeCloseTo(0.1);
    expect(state.phase).toBe('aim');
    const before = structuredClone(state);
    stepWorms(state, -1);
    stepWorms(state, Infinity);
    expect(state).toEqual(before);
  });
});
