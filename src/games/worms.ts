// A small deterministic island duel. All coordinates are in the 640 × 400 world.
// The caller owns its animation clock and pause state; this model has no timers.
export type WormTeam = 'player' | 'cpu';
export type WormPhase = 'aim' | 'cpu' | 'flight' | 'settle' | 'over';
export type WormOutcome = 'win' | 'loss' | 'draw' | 'abandoned';
export interface Worm {
  id: string;
  name: string;
  team: WormTeam;
  x: number;
  y: number;
  energy: number;
  facing: -1 | 1;
  vy: number;
  fallStart: number;
}
export interface WormPoint {
  x: number;
  y: number;
}
export interface WormProjectile extends WormPoint {
  vx: number;
  vy: number;
  age: number;
  ownerId: string;
}
export interface WormsState {
  worms: Worm[];
  activeId: string;
  team: WormTeam;
  phase: WormPhase;
  turn: number;
  maxTurns: number;
  angle: number;
  power: number;
  movementLeft: number;
  projectile: WormProjectile | null;
  terrain: number[];
  waterY: number;
  wind: number;
  score: number;
  elapsed: number;
  over: boolean;
  won: boolean;
  outcome: WormOutcome | null;
  feedback: { serial: number; text: string };
  trail: WormPoint[];
  blast: (WormPoint & { radius: number; ttl: number }) | null;
  seed: number;
  cpuClock: number;
  settleClock: number;
  cursors: Record<WormTeam, number>;
}

const WIDTH = 640;
const GRAVITY = 180;
const RADIUS = 10;
const BLAST_RADIUS = 54;
const FIXED_STEP = 1 / 120;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function random(state: Pick<WormsState, 'seed'>) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

export function activeWorm(state: WormsState): Worm | undefined {
  return state.worms.find((worm) => worm.id === state.activeId);
}

export function teamEnergy(state: WormsState, team: WormTeam) {
  return state.worms
    .filter((worm) => worm.team === team)
    .reduce((sum, worm) => sum + worm.energy, 0);
}

function groundAt(state: WormsState, x: number) {
  if (x < 0 || x >= WIDTH) return 400;
  return state.terrain[Math.floor(x)];
}

function feedback(state: WormsState, text: string) {
  state.feedback = { serial: state.feedback.serial + 1, text };
}

function updateScore(state: WormsState) {
  const opponents = state.worms.filter((worm) => worm.team === 'cpu');
  state.score =
    opponents.reduce(
      (sum, worm) =>
        sum + (100 - worm.energy) * 5 + (worm.energy === 0 ? 100 : 0),
      0,
    ) + (state.won ? 500 : 0);
}

function finish(state: WormsState, outcome: WormOutcome, text: string) {
  state.over = true;
  state.phase = 'over';
  state.outcome = outcome;
  state.won = outcome === 'win';
  state.projectile = null;
  updateScore(state);
  feedback(state, text);
}

function checkTeams(state: WormsState) {
  const player = teamEnergy(state, 'player');
  const cpu = teamEnergy(state, 'cpu');
  if (player > 0 && cpu > 0) return false;
  if (player === 0 && cpu === 0)
    finish(
      state,
      'draw',
      'Beide Teams sind ausgeschieden. Das Duell endet unentschieden.',
    );
  else if (cpu === 0) finish(state, 'win', 'Dein Team gewinnt das Inselduell!');
  else
    finish(
      state,
      'loss',
      'Das Computerteam gewinnt. Probiere beim nächsten Duell eine andere Flugbahn.',
    );
  return true;
}

export function createWorms(seed = 1): WormsState {
  const state: WormsState = {
    worms: [],
    activeId: 'player-0',
    team: 'player',
    phase: 'aim',
    turn: 1,
    maxTurns: 24,
    angle: 45,
    power: 55,
    movementLeft: 50,
    projectile: null,
    terrain: [],
    waterY: 368,
    wind: 0,
    score: 0,
    elapsed: 0,
    over: false,
    won: false,
    outcome: null,
    feedback: {
      serial: 1,
      text: 'Nori ist dran. Bewege dich, stelle Winkel und Stärke ein und schieße einmal.',
    },
    trail: [],
    blast: null,
    seed: Number.isFinite(seed) ? seed >>> 0 : 1,
    cpuClock: 0,
    settleClock: 0,
    cursors: { player: 0, cpu: -1 },
  };
  const offset = random(state) * Math.PI * 2;
  state.terrain = Array.from({ length: WIDTH }, (_, x) => {
    if (x < 42 || x > 598) return 393;
    const shore = x < 70 ? (70 - x) * 2.4 : x > 570 ? (x - 570) * 2.4 : 0;
    return Math.round(
      285 +
        Math.sin(x / 75 + offset) * 15 +
        Math.sin(x / 29 + offset) * 5 +
        shore,
    );
  });
  state.wind = Math.round((random(state) * 2 - 1) * 8);
  const names = ['Nori', 'Pico', 'Zapp', 'Mox'];
  state.worms = [95, 180, 460, 545].map((x, index) => ({
    id: `${index < 2 ? 'player' : 'cpu'}-${index % 2}`,
    name: names[index],
    team: index < 2 ? 'player' : 'cpu',
    x,
    y: groundAt(state, x) - RADIUS,
    energy: 100,
    facing: index < 2 ? 1 : -1,
    vy: 0,
    fallStart: groundAt(state, x) - RADIUS,
  }));
  return state;
}

function canControl(state: WormsState) {
  return !state.over && state.team === 'player' && state.phase === 'aim';
}

export function setAim(
  state: WormsState,
  angle: number,
  power: number,
  direction?: -1 | 1,
) {
  if (!canControl(state)) return;
  if (Number.isFinite(angle)) state.angle = clamp(angle, 15, 80);
  if (Number.isFinite(power)) state.power = clamp(power, 20, 100);
  const worm = activeWorm(state);
  if (worm && (direction === -1 || direction === 1)) worm.facing = direction;
}

export function moveWorm(state: WormsState, direction: -1 | 1, dt = 1 / 30) {
  if (
    !canControl(state) ||
    (direction !== -1 && direction !== 1) ||
    !Number.isFinite(dt) ||
    dt <= 0
  )
    return;
  const worm = activeWorm(state);
  if (!worm || worm.energy === 0) return;
  worm.facing = direction;
  const distance = Math.min(state.movementLeft, 52 * Math.min(dt, 0.1));
  // Small spatial steps prevent stepping through another worm or over a cliff.
  let remaining = distance;
  while (remaining > 0.001) {
    const step = Math.min(remaining, 1);
    const nextX = clamp(worm.x + direction * step, 16, WIDTH - 16);
    const nextY = groundAt(state, nextX) - RADIUS;
    if (
      nextX === worm.x ||
      nextY < worm.y - 7 ||
      state.worms.some(
        (other) =>
          other.id !== worm.id &&
          other.energy > 0 &&
          Math.hypot(nextX - other.x, nextY - other.y) < 22,
      )
    )
      break;
    worm.x = nextX;
    state.movementLeft = Math.max(0, state.movementLeft - step);
    remaining -= step;
    if (nextY > worm.y + 8) {
      worm.fallStart = worm.y;
      state.phase = 'settle';
      state.settleClock = 0;
      feedback(
        state,
        `${worm.name} setzt nach dem Schritt wieder auf. Danach ist das andere Team dran.`,
      );
      break;
    }
    worm.y = nextY;
    worm.fallStart = worm.y;
    if (worm.y + RADIUS >= state.waterY) {
      worm.energy = 0;
      state.phase = 'settle';
      state.settleClock = 0;
      feedback(state, `${worm.name} ist im Wasser und scheidet aus.`);
      break;
    }
  }
}

function makeProjectile(
  state: WormsState,
  angle = state.angle,
  power = state.power,
  facing = activeWorm(state)?.facing ?? 1,
): WormProjectile | null {
  const worm = activeWorm(state);
  if (!worm || worm.energy === 0) return null;
  const radians = (angle * Math.PI) / 180;
  const speed = 125 + power * 3.2;
  return {
    x: worm.x + Math.cos(radians) * facing * 18,
    y: worm.y - Math.sin(radians) * 18 - 3,
    vx: Math.cos(radians) * speed * facing,
    vy: -Math.sin(radians) * speed,
    age: 0,
    ownerId: worm.id,
  };
}

function launch(state: WormsState) {
  state.projectile = makeProjectile(state);
  if (!state.projectile) {
    nextTurn(state);
    return;
  }
  state.trail = [{ x: state.projectile.x, y: state.projectile.y }];
  state.phase = 'flight';
  feedback(
    state,
    `${activeWorm(state)?.name} schießt mit ${Math.round(state.angle)}° und ${Math.round(state.power)} % Stärke.`,
  );
}

export function fireWorm(state: WormsState) {
  if (canControl(state)) launch(state);
}

export function skipTurn(state: WormsState) {
  if (!canControl(state)) return;
  feedback(state, `${activeWorm(state)?.name} gibt den Zug ab.`);
  nextTurn(state);
}

export function endWorms(state: WormsState) {
  if (!state.over)
    finish(
      state,
      'abandoned',
      'Du hast das Duell beendet. Deine bisherigen Spielpunkte zählen.',
    );
}

function nextTurn(state: WormsState) {
  updateScore(state);
  if (checkTeams(state)) return;
  if (state.turn >= state.maxTurns) {
    const difference = teamEnergy(state, 'player') - teamEnergy(state, 'cpu');
    finish(
      state,
      difference > 0 ? 'win' : difference < 0 ? 'loss' : 'draw',
      `Nach ${state.maxTurns} Zügen endet das Duell. ${difference > 0 ? 'Dein Team hat mehr Energie und gewinnt!' : difference < 0 ? 'Das Computerteam hat mehr Energie und gewinnt.' : 'Beide Teams haben gleich viel Energie: unentschieden.'}`,
    );
    return;
  }
  state.team = state.team === 'player' ? 'cpu' : 'player';
  const team = state.worms.filter((worm) => worm.team === state.team);
  let index = state.cursors[state.team];
  for (let tries = 0; tries < team.length; tries++) {
    index = (index + 1) % team.length;
    if (team[index].energy > 0) break;
  }
  state.cursors[state.team] = index;
  state.activeId = team[index].id;
  state.turn++;
  state.phase = state.team === 'cpu' ? 'cpu' : 'aim';
  state.angle = 45;
  state.power = 55;
  state.movementLeft = 50;
  state.cpuClock = 0;
  state.settleClock = 0;
  state.wind = Math.round((random(state) * 2 - 1) * 8);
  feedback(
    state,
    state.team === 'cpu'
      ? `${team[index].name} vom Computerteam plant seinen Schuss.`
      : `${team[index].name} ist dran. Du kannst bis zu 50 Schritte bewegen, zielen und einmal schießen.`,
  );
}

function hitAt(state: WormsState, projectile: WormProjectile) {
  const hitWorm = state.worms.find(
    (worm) =>
      worm.energy > 0 &&
      (worm.id !== projectile.ownerId || projectile.age > 0.2) &&
      Math.hypot(projectile.x - worm.x, projectile.y - worm.y) <= RADIUS + 4,
  );
  if (hitWorm) return { x: projectile.x, y: projectile.y, worm: hitWorm };
  if (projectile.x < 0 || projectile.x >= WIDTH || projectile.y >= state.waterY)
    return {
      x: projectile.x,
      y: Math.min(projectile.y, state.waterY),
      worm: undefined,
    };
  if (projectile.y >= groundAt(state, projectile.x))
    return { x: projectile.x, y: projectile.y, worm: undefined };
  return null;
}

function advanceProjectile(
  state: WormsState,
  projectile: WormProjectile,
  dt: number,
) {
  projectile.x += projectile.vx * dt + (state.wind * dt * dt) / 2;
  projectile.y += projectile.vy * dt + (GRAVITY * dt * dt) / 2;
  projectile.vx += state.wind * dt;
  projectile.vy += GRAVITY * dt;
  projectile.age += dt;
}

function impact(state: WormsState, point: WormPoint, directId?: string) {
  state.blast = { ...point, radius: BLAST_RADIUS, ttl: 0.65 };
  const losses: string[] = [];
  for (const worm of state.worms) {
    if (worm.energy === 0) continue;
    const distance = Math.hypot(worm.x - point.x, worm.y - point.y);
    const damage =
      Math.round(Math.max(0, (1 - distance / BLAST_RADIUS) * 56)) +
      (worm.id === directId ? 20 : 0);
    if (damage <= 0) continue;
    const lost = Math.min(worm.energy, damage);
    worm.energy -= lost;
    losses.push(
      `${worm.name}: −${lost} Energie${worm.energy === 0 ? ', ausgeschieden' : ''}`,
    );
  }
  if (point.x >= 0 && point.x < WIDTH && point.y < state.waterY) {
    const radius = 36;
    for (
      let x = Math.max(0, Math.floor(point.x - radius));
      x <= Math.min(WIDTH - 1, Math.ceil(point.x + radius));
      x++
    ) {
      const cut = Math.sqrt(Math.max(0, radius * radius - (x - point.x) ** 2));
      state.terrain[x] = Math.max(
        state.terrain[x],
        Math.min(400, point.y + cut * 0.85),
      );
    }
  }
  for (const worm of state.worms) {
    worm.fallStart = worm.y;
    worm.vy = 0;
  }
  state.projectile = null;
  state.phase = 'settle';
  state.settleClock = 0;
  updateScore(state);
  feedback(
    state,
    losses.length
      ? `Treffer! ${losses.join(' · ')}.`
      : point.y >= state.waterY || point.x < 0 || point.x >= WIDTH
        ? 'Der Schuss landet außerhalb der Insel.'
        : 'Der Schuss hinterlässt einen Krater. Kein Wurm wurde getroffen.',
  );
}

/** Exact bounded simulation for a dotted aiming aid; it never mutates the duel. */
export function predictWormShot(state: WormsState): WormPoint[] {
  const projectile = makeProjectile(state);
  if (!projectile) return [];
  const points: WormPoint[] = [{ x: projectile.x, y: projectile.y }];
  for (let i = 0; i < 960; i++) {
    advanceProjectile(state, projectile, FIXED_STEP);
    if (i % 8 === 0) points.push({ x: projectile.x, y: projectile.y });
    const hit = hitAt(state, projectile);
    if (hit || projectile.age >= 8) {
      points.push({ x: projectile.x, y: projectile.y });
      break;
    }
  }
  return points;
}

// Search a fixed grid of trajectories once per computer turn, including wind and terrain.
// Nearby team members penalize a shot; the search never reads future/random outcomes.
function planCpu(state: WormsState) {
  const worm = activeWorm(state);
  if (!worm) return;
  const targets = state.worms.filter(
    (target) => target.team === 'player' && target.energy > 0,
  );
  const target = targets.sort(
    (a, b) => Math.abs(a.x - worm.x) - Math.abs(b.x - worm.x),
  )[0];
  if (!target) return;
  worm.facing = target.x < worm.x ? -1 : 1;
  let best = Number.POSITIVE_INFINITY;
  let aim = { angle: 45, power: 55 };
  for (const angle of [25, 35, 45, 55, 65, 75]) {
    for (let power = 25; power <= 95; power += 5) {
      const projectile = makeProjectile(state, angle, power, worm.facing);
      if (!projectile) continue;
      for (let step = 0; step < 480; step++) {
        advanceProjectile(state, projectile, 1 / 60);
        const hit = hitAt(state, projectile);
        if (hit || projectile.age >= 8) break;
      }
      const distance = Math.hypot(
        projectile.x - target.x,
        projectile.y - target.y,
      );
      const risk = state.worms
        .filter((ally) => ally.team === 'cpu' && ally.energy > 0)
        .reduce(
          (sum, ally) =>
            sum +
            Math.max(
              0,
              65 - Math.hypot(projectile.x - ally.x, projectile.y - ally.y),
            ) *
              2,
          0,
        );
      const quality = distance + risk;
      if (quality < best) {
        best = quality;
        aim = { angle, power };
      }
    }
  }
  state.angle = aim.angle;
  state.power = aim.power;
}

function settle(state: WormsState, dt: number) {
  state.settleClock += dt;
  let falling = false;
  for (const worm of state.worms) {
    if (worm.energy === 0) continue;
    const ground = groundAt(state, worm.x) - RADIUS;
    if (worm.y >= ground - 0.01) {
      worm.y = ground;
      worm.vy = 0;
      continue;
    }
    worm.vy += GRAVITY * dt;
    worm.y = Math.min(ground, worm.y + worm.vy * dt);
    if (worm.y + RADIUS >= state.waterY) {
      worm.energy = 0;
      feedback(state, `${worm.name} landet im Wasser und scheidet aus.`);
    } else if (worm.y >= ground) {
      const damage = Math.round(
        clamp((worm.y - worm.fallStart - 26) * 0.7, 0, 40),
      );
      const lost = Math.min(worm.energy, damage);
      worm.energy -= lost;
      worm.vy = 0;
      if (lost)
        feedback(
          state,
          `${worm.name} verliert beim Aufsetzen ${lost} Energie${worm.energy === 0 ? ' und scheidet aus' : ''}.`,
        );
    } else falling = true;
  }
  updateScore(state);
  // A bounded fallback also ends a settling phase if callers supply unusual terrain.
  if (state.settleClock >= 2.5 || (!falling && state.settleClock >= 0.7))
    nextTurn(state);
}

export function stepWorms(state: WormsState, dt: number) {
  if (state.over || !Number.isFinite(dt) || dt <= 0) return;
  let remaining = Math.min(dt, 0.1);
  while (remaining > 0.000001 && !state.over) {
    const tick = Math.min(FIXED_STEP, remaining);
    remaining -= tick;
    state.elapsed += tick;
    if (state.blast) {
      state.blast.ttl = Math.max(0, state.blast.ttl - tick);
      if (state.blast.ttl === 0) state.blast = null;
    }
    if (state.phase === 'cpu') {
      state.cpuClock += tick;
      if (state.cpuClock >= 0.8) {
        planCpu(state);
        launch(state);
      }
    } else if (state.phase === 'flight' && state.projectile) {
      advanceProjectile(state, state.projectile, tick);
      const last = state.trail[state.trail.length - 1];
      if (
        !last ||
        Math.hypot(state.projectile.x - last.x, state.projectile.y - last.y) >=
          4
      )
        state.trail.push({ x: state.projectile.x, y: state.projectile.y });
      if (state.trail.length > 240) state.trail.shift();
      const hit = hitAt(state, state.projectile);
      if (hit || state.projectile.age >= 8)
        impact(state, hit ?? state.projectile, hit?.worm?.id);
    } else if (state.phase === 'settle') settle(state, tick);
  }
}
