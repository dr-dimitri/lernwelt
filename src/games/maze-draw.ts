import type { Game } from './engine';
import { mazeRoute, wallAt } from './maze';

export function drawMaze(c: CanvasRenderingContext2D, g: Game) {
  const m = g.maze;
  if (!m) return;
  const themes = [
    [184, 268],
    [274, 328],
    [153, 204],
  ];
  const [hue, accent] = themes[m.theme];
  const sky = c.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#111e46');
  sky.addColorStop(0.5, '#5360a0');
  sky.addColorStop(0.51, '#203449');
  sky.addColorStop(1, '#091a2c');
  c.fillStyle = sky;
  c.fillRect(0, 0, 640, 400);
  for (let i = 0; i < 32; i++) {
    c.fillStyle = '#ffffff80';
    c.fillRect((i * 97 + 19) % 640, (i * 37 + 11) % 180, 2, 2);
  }
  const depth: number[] = [];
  const fov = Math.PI / 3;
  for (let column = 0; column < 320; column++) {
    const rayAngle =
      m.angle + Math.atan((column / 160 - 1) * Math.tan(fov / 2));
    const dx = Math.cos(rayAngle),
      dy = Math.sin(rayAngle);
    let mx = Math.floor(m.x),
      my = Math.floor(m.y);
    const deltaX = Math.abs(1 / dx),
      deltaY = Math.abs(1 / dy);
    const sx = dx < 0 ? -1 : 1,
      sy = dy < 0 ? -1 : 1;
    let sideX = (dx < 0 ? m.x - mx : mx + 1 - m.x) * deltaX;
    let sideY = (dy < 0 ? m.y - my : my + 1 - m.y) * deltaY;
    let distance = 0,
      side = false;
    for (let i = 0; i < 64; i++) {
      if (sideX < sideY) {
        distance = sideX;
        sideX += deltaX;
        mx += sx;
        side = false;
      } else {
        distance = sideY;
        sideY += deltaY;
        my += sy;
        side = true;
      }
      if (wallAt(m, mx, my)) break;
    }
    const z = Math.max(0.05, distance * Math.cos(rayAngle - m.angle));
    depth[column] = z;
    const height = 340 / z,
      top = 200 - height / 2;
    const hit = side ? m.x + dx * distance : m.y + dy * distance;
    const seam = hit - Math.floor(hit);
    const light = Math.max(15, 62 - z * 4 - (side ? 8 : 0));
    c.fillStyle = `hsl(${(mx + my) % 3 ? hue : accent} 52% ${light}%)`;
    c.fillRect(column * 2, top, 2, height);
    c.fillStyle = seam < 0.025 || seam > 0.975 ? '#06162c80' : '#a7ffef55';
    if (seam < 0.025 || seam > 0.975) c.fillRect(column * 2, top, 2, height);
    for (let line = 1; line < 4; line++) {
      c.fillStyle = '#07142b55';
      c.fillRect(
        column * 2,
        top + (height * line) / 4,
        2,
        Math.max(1, height * 0.008),
      );
    }
    c.fillStyle = '#bcfff2';
    c.fillRect(column * 2, top + height * 0.12, 2, Math.max(1, height * 0.018));
    c.fillStyle = '#ffffff33';
    c.fillRect(column * 2, top, 2, Math.max(1, height * 0.02));
  }
  const sprites = [
    ...m.stars.filter((s) => s.alive).map((s) => ({ ...s, kind: 'star' })),
    ...m.robots.filter((r) => r.alive).map((r) => ({ ...r, kind: 'robot' })),
    { ...m.exit, kind: 'portal' },
  ]
    .map((s) => ({
      ...s,
      z: (s.x - m.x) * Math.cos(m.angle) + (s.y - m.y) * Math.sin(m.angle),
      lateral:
        -(s.x - m.x) * Math.sin(m.angle) + (s.y - m.y) * Math.cos(m.angle),
    }))
    .sort((a, b) => b.z - a.z);
  const oval = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
  ) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
    c.fill();
  };
  for (const s of sprites) {
    if (s.z < 0.1) continue;
    const x = 320 + (s.lateral / s.z) * (320 / Math.tan(fov / 2));
    const size = Math.min(650, 270 / s.z),
      y = 200 + Math.sin(g.elapsed * 3 + s.x) * size * 0.035;
    c.save();
    c.beginPath();
    for (
      let col = Math.max(0, Math.floor((x - size / 2) / 2));
      col < Math.min(320, (x + size / 2) / 2);
      col++
    )
      if (depth[col] > s.z) c.rect(col * 2, 0, 2, 400);
    c.clip();
    if (s.kind === 'star') {
      oval(x, y, size * 0.24, size * 0.24, '#ffe57330');
      c.fillStyle = '#ffe57a';
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2,
          r = size * (i % 2 ? 0.1 : 0.24);
        if (!i) c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
      oval(
        x - size * 0.04,
        y - size * 0.06,
        size * 0.03,
        size * 0.05,
        '#fffbdc',
      );
    } else if (s.kind === 'portal') {
      const open = m.stars.every((star) => !star.alive);
      oval(x, y, size * 0.36, size * 0.53, open ? '#7effbf' : '#aa94e8');
      oval(x, y, size * 0.27, size * 0.45, '#183959');
      oval(x, y, size * 0.18, size * 0.36, open ? '#6de2bd88' : '#a3a1e044');
      c.fillStyle = '#ffffff';
      c.font = `bold ${Math.max(8, size * 0.13)}px system-ui`;
      c.textAlign = 'center';
      c.fillText(open ? 'ZIEL' : '5 ★', x, y);
    } else {
      oval(x, y + size * 0.3, size * 0.27, size * 0.06, '#09172c70');
      oval(x, y, size * 0.28, size * 0.3, '#ffa0cd');
      oval(x, y - size * 0.06, size * 0.24, size * 0.18, '#d0fcff');
      oval(
        x - size * 0.09,
        y - size * 0.08,
        size * 0.045,
        size * 0.065,
        '#1e3756',
      );
      oval(
        x + size * 0.09,
        y - size * 0.08,
        size * 0.045,
        size * 0.065,
        '#1e3756',
      );
      oval(x, y + size * 0.04, size * 0.07, size * 0.025, '#ffffff');
      oval(x, y - size * 0.38, size * 0.045, size * 0.045, '#ffed91');
      oval(
        x - size * 0.3,
        y + size * 0.07,
        size * 0.09,
        size * 0.09,
        '#c99aff',
      );
      oval(
        x + size * 0.3,
        y + size * 0.07,
        size * 0.09,
        size * 0.09,
        '#c99aff',
      );
    }
    c.restore();
  }
  // Toy bubble launcher and reticle, intentionally no weapon imagery.
  oval(367, 417, 61, 71, '#bc91eb');
  oval(340, 365, 34, 32, '#8bebea');
  oval(339, 355, 19, 18, '#193d58');
  c.strokeStyle = '#d4fff1';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(320, 200, 7, 0, Math.PI * 2);
  c.stroke();
  if (m.flash > 0)
    for (let i = 0; i < 5; i++) {
      const t = 1 - m.flash / 0.22;
      c.strokeStyle = '#b6ffeff0';
      c.beginPath();
      c.arc(
        330 + Math.sin(i * 5) * t * 65,
        335 - t * (125 + i * 12),
        5 + t * 13,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
  // Map includes a shortest path to the next star. Only recomputed on cell/goal changes.
  const key = `${Math.floor(m.x)},${Math.floor(m.y)}:${m.stars.map((s) => +s.alive).join('')}`;
  let cached = routes.get(m);
  if (!cached || cached.key !== key) {
    cached = { key, route: mazeRoute(m) };
    routes.set(m, cached);
  }
  c.fillStyle = '#0a1831dc';
  c.fillRect(514, 12, 114, 142);
  m.cells.forEach((row, y) =>
    row.forEach((wall, x) => {
      c.fillStyle = wall ? '#789aac' : '#233e59';
      c.fillRect(519 + x * 7, 17 + y * 7, 6, 6);
    }),
  );
  c.fillStyle = '#f4dc7160';
  for (const [x, y] of cached.route) c.fillRect(521 + x * 7, 19 + y * 7, 3, 3);
  for (const star of m.stars.filter((s) => s.alive))
    oval(519 + star.x * 7, 17 + star.y * 7, 2.5, 2.5, '#ffdc64');
  oval(519 + m.exit.x * 7, 17 + m.exit.y * 7, 3, 3, '#79ffd4');
  const px = 519 + m.x * 7,
    py = 17 + m.y * 7;
  oval(px, py, 3, 3, '#fff');
  c.strokeStyle = '#fff';
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(px + Math.cos(m.angle) * 7, py + Math.sin(m.angle) * 7);
  c.stroke();
  c.textAlign = 'left';
  c.font = 'bold 12px system-ui';
  c.fillStyle = '#d5eef8';
  c.fillText('Karte · gelber Weg', 520, 142);
  c.fillStyle = '#0b1d38dc';
  c.fillRect(12, 12, 265, 56);
  c.font = 'bold 18px system-ui';
  c.fillStyle = '#ffe18a';
  c.fillText(
    `★ ${m.stars.filter((s) => !s.alive).length} / 5   ·   ${Math.max(0, Math.ceil(240 - g.elapsed))} s`,
    24,
    35,
  );
  c.font = '13px system-ui';
  c.fillStyle = '#c4f7eb';
  c.fillText(
    m.stars.every((s) => !s.alive)
      ? 'Zum grünen Portal!'
      : 'Sterne suchen · Roboter einseifen',
    24,
    56,
  );
  if (g.invincible > 0) {
    c.strokeStyle = '#ffb8dc';
    c.lineWidth = 6;
    c.strokeRect(3, 3, 634, 394);
  }
}
const routes = new WeakMap<
  object,
  { key: string; route: [number, number][] }
>();
