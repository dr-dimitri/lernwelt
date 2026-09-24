// A seeded, connected world. Generation, collision and aiming stay independent of drawing.
export interface MazeActor {
  x: number;
  y: number;
  alive: boolean;
}
export interface Maze {
  cells: number[][];
  x: number;
  y: number;
  angle: number;
  exit: { x: number; y: number };
  stars: MazeActor[];
  robots: MazeActor[];
  flash: number;
  theme: number;
}
export function createMaze(random: () => number): Maze {
  const size = 15;
  const cells = Array.from({ length: size }, () => Array<number>(size).fill(1));
  const stack = [[1, 1]];
  cells[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const choices = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ].filter(
      ([dx, dy]) =>
        x + dx > 0 &&
        x + dx < size - 1 &&
        y + dy > 0 &&
        y + dy < size - 1 &&
        cells[y + dy][x + dx] === 1,
    );
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const [dx, dy] = choices[Math.floor(random() * choices.length)];
    cells[y + dy / 2][x + dx / 2] = 0;
    cells[y + dy][x + dx] = 0;
    stack.push([x + dx, y + dy]);
  }
  // A few loops give children alternate routes around robots.
  for (let i = 0; i < 16; i++) {
    const x = 1 + Math.floor(random() * (size - 2));
    const y = 1 + Math.floor(random() * (size - 2));
    if (
      (!cells[y][x - 1] && !cells[y][x + 1]) ||
      (!cells[y - 1][x] && !cells[y + 1][x])
    )
      cells[y][x] = 0;
  }
  const available: MazeActor[] = [];
  cells.forEach((row, y) =>
    row.forEach((wall, x) => {
      if (!wall && x + y > 5 && !(x === 13 && y === 13))
        available.push({ x: x + 0.5, y: y + 0.5, alive: true });
    }),
  );
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return {
    cells,
    x: 1.5,
    y: 1.5,
    angle: cells[1][2] ? Math.PI / 2 : 0,
    exit: { x: 13.5, y: 13.5 },
    stars: available.slice(0, 5),
    robots: available.slice(5, 13),
    flash: 0,
    theme: Math.floor(random() * 3),
  };
}
export function wallAt(m: Maze, x: number, y: number) {
  return m.cells[Math.floor(y)]?.[Math.floor(x)] !== 0;
}
export function moveMaze(
  m: Maze,
  actor: { x: number; y: number },
  dx: number,
  dy: number,
) {
  const free = (x: number, y: number) =>
    [-0.2, 0.2].every((ox) =>
      [-0.2, 0.2].every((oy) => !wallAt(m, x + ox, y + oy)),
    );
  if (free(actor.x + dx, actor.y)) actor.x += dx;
  if (free(actor.x, actor.y + dy)) actor.y += dy;
}
export function visible(
  m: Maze,
  x: number,
  y: number,
  target: { x: number; y: number },
) {
  const distance = Math.hypot(target.x - x, target.y - y);
  const steps = Math.ceil(distance / 0.04);
  for (let i = 1; i <= steps; i++)
    if (
      wallAt(
        m,
        x + ((target.x - x) * i) / steps,
        y + ((target.y - y) * i) / steps,
      )
    )
      return false;
  return true;
}
export function aimRobot(m: Maze): MazeActor | undefined {
  return m.robots
    .filter((r) => r.alive)
    .sort(
      (a, b) =>
        Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y),
    )
    .find((r) => {
      const angle = Math.atan2(r.y - m.y, r.x - m.x) - m.angle;
      return (
        Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < 0.18 &&
        Math.hypot(r.x - m.x, r.y - m.y) < 8 &&
        visible(m, m.x, m.y, r)
      );
    });
}
// Shortest route to a remaining star, then the portal. Used as an accessible map hint.
export function mazeRoute(m: Maze): [number, number][] {
  const target = m.stars.filter((s) => s.alive);
  const goals = target.length ? target : [m.exit];
  const start: [number, number] = [Math.floor(m.x), Math.floor(m.y)];
  const queue: [number, number][][] = [[start]];
  const seen = new Set([start.join(',')]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i],
      [x, y] = path[path.length - 1];
    if (goals.some((g) => Math.floor(g.x) === x && Math.floor(g.y) === y))
      return path;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        key = `${nx},${ny}`;
      if (!wallAt(m, nx, ny) && !seen.has(key)) {
        seen.add(key);
        queue.push([...path, [nx, ny]]);
      }
    }
  }
  return [];
}
