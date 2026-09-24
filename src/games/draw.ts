import type { Game } from './engine';
const colors = [
  '#101e3b',
  '#66e2dd',
  '#ffdb66',
  '#b894ff',
  '#a2e378',
  '#ff97bd',
  '#ffae6a',
  '#7eb8ff',
];
export function drawGame(c: CanvasRenderingContext2D, g: Game) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  const circle = (x: number, y: number, r: number, color: string) => {
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  };
  const text = (
    value: string,
    x: number,
    y: number,
    size = 20,
    color = '#fff',
  ) => {
    c.fillStyle = color;
    c.font = `bold ${size}px system-ui`;
    c.fillText(value, x, y);
  };
  const star = (x: number, y: number, r = 10) => {
    c.fillStyle = '#ffcf45';
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 ? r * 0.45 : r;
      const px = x + Math.cos(a) * radius,
        py = y + Math.sin(a) * radius;
      if (!i) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
  };
  c.clearRect(0, 0, 640, 400);
  if (g.id === 'blocks' || g.id === 'space') {
    const gradient = c.createLinearGradient(0, 0, 640, 400);
    gradient.addColorStop(0, '#172541');
    gradient.addColorStop(1, '#392650');
    c.fillStyle = gradient;
    c.fillRect(0, 0, 640, 400);
    for (let i = 0; i < 65; i++)
      circle((i * 137) % 640, (i * 71) % 400, i % 3 ? 1 : 2, '#7681a8');
  } else {
    rect(0, 0, 640, 400, '#b7e5f8');
    circle(552, 60, 29, '#ffe28a');
    for (const x of [65, 250, 430]) {
      circle(x, 65, 20, '#fff');
      circle(x + 24, 58, 27, '#fff');
      circle(x + 48, 65, 20, '#fff');
    }
    circle(140, 450, 190, '#93d3a3');
    circle(450, 480, 230, '#74bf9c');
    rect(0, 350, 640, 50, '#6aaa72');
    rect(0, 350, 640, 7, '#d6ee8e');
  }
  if (g.id === 'blocks') {
    const block = (x: number, y: number, color: number) => {
      rect(204 + x * 20, 20 + y * 20, 19, 19, colors[color]);
      rect(206 + x * 20, 22 + y * 20, 15, 3, '#ffffff55');
    };
    g.board.forEach((row, y) =>
      row.forEach((v, x) => {
        rect(204 + x * 20, 20 + y * 20, 19, 19, '#111b31');
        if (v) block(x, y, v);
      }),
    );
    g.piece.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v) block(g.pieceX + x, g.pieceY + y, g.color);
      }),
    );
    text('REIHEN', 28, 85, 17, '#a8e4e1');
    text('KNACKEN!', 28, 112, 20);
    text(`${Math.max(0, Math.ceil(120 - g.elapsed))} s`, 460, 75, 28);
    text('Ganz voll?', 444, 155, 17);
    text('Reihe weg!', 444, 180, 17);
    text('100 pro Reihe', 439, 240, 16, '#ffdb66');
    text('Mehr auf einmal', 432, 272, 15);
    text('gibt einen Bonus.', 432, 294, 15);
  }
  if (g.id === 'runner') {
    const camera = g.x - 120;
    g.entities.forEach((e) => {
      const x = e.x - camera;
      rect(x, e.y, e.w, e.h, '#92533b');
      circle(x + 18, e.y + 17, 13, '#ca9463');
      circle(x + 18, e.y + 17, 7, '#92533b');
    });
    g.coins.forEach((e) => {
      if (e.alive) star(e.x - camera + 10, e.y + 10);
    });
    const flag = 3400 - camera;
    rect(flag, 160, 5, 190, '#496258');
    rect(flag + 5, 160, 55, 36, '#a45cef');
    text('ZIEL', flag + 9, 184, 17);
    if (g.invincible <= 0 || Math.floor(g.elapsed * 12) % 2) {
      rect(120, g.y + 15, 28, 20, '#7856cc');
      circle(134, g.y + 10, 14, '#ffe0bd');
      rect(119, g.y - 1, 30, 7, '#e5854f');
      circle(140, g.y + 9, 2, '#28334b');
      rect(120, g.y + 35, 10, 5, '#28334b');
      rect(140, g.y + 35, 10, 5, '#28334b');
    }
    text(
      `${Math.min(100, Math.floor((g.x / 3400) * 100))} % bis zum Ziel`,
      24,
      35,
      19,
      '#254857',
    );
  }
  if (g.id === 'space') {
    g.entities
      .filter((e) => e.alive)
      .forEach((e) => {
        rect(e.x + 4, e.y + 5, 22, 15, colors[g.wave + 2]);
        rect(e.x, e.y + 10, 30, 7, colors[g.wave + 2]);
        rect(e.x + 5, e.y + 20, 5, 5, '#abebe7');
        rect(e.x + 20, e.y + 20, 5, 5, '#abebe7');
        rect(e.x + 8, e.y + 9, 4, 4, '#162743');
        rect(e.x + 18, e.y + 9, 4, 4, '#162743');
      });
    if (g.invincible <= 0 || Math.floor(g.elapsed * 12) % 2) {
      c.fillStyle = '#7de6e0';
      c.beginPath();
      c.moveTo(g.x + 15, g.y);
      c.lineTo(g.x + 32, g.y + 30);
      c.lineTo(g.x - 2, g.y + 30);
      c.closePath();
      c.fill();
      rect(g.x + 11, g.y + 12, 8, 12, '#4f548f');
    }
    g.shots.forEach((s) =>
      rect(s.x - 3, s.y, 6, 12, s.enemy ? '#ffacb9' : '#ffe381'),
    );
    text(`Welle ${g.wave} / 3`, 24, 32, 19, '#c1fff8');
    rect(0, 392, 640, 8, '#758db5');
  }
  if (g.id === 'chickens') {
    rect(410, 286, 125, 64, '#d98b64');
    c.fillStyle = '#885160';
    c.beginPath();
    c.moveTo(393, 286);
    c.lineTo(472, 236);
    c.lineTo(550, 286);
    c.fill();
    rect(453, 309, 32, 41, '#77453c');
    for (let x = 10; x < 640; x += 42) {
      rect(x, 323, 8, 42, '#ffecbd');
    }
    rect(0, 337, 640, 6, '#ffecbd');
    g.entities.forEach((e, i) => {
      circle(e.x + 25, e.y + 27, 19, i % 2 ? '#fff6db' : '#e7b578');
      circle(e.x + 43, e.y + 13, 12, '#fff6db');
      circle(e.x + 41, e.y + 1, 5, '#e7696f');
      circle(e.x + 48, e.y + 11, 2, '#273147');
      rect(e.x + 51, e.y + 15, 7, 5, '#edaa35');
      circle(
        e.x + 19,
        e.y + 22 + Math.sin(g.elapsed * 12 + i) * 5,
        11,
        '#c89766',
      );
      rect(e.x + 20, e.y + 41, 4, 6, '#dd9733');
      circle(e.x + 8, e.y + 5, 12, '#61498f');
      text(String(i + 1), e.x + 3, e.y + 11, 17);
    });
    g.bursts.forEach((b) => {
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        rect(
          b.x + Math.cos(a) * (1 - b.ttl) * 60,
          b.y + Math.sin(a) * (1 - b.ttl) * 60,
          6,
          6,
          colors[1 + (i % 7)],
        );
      }
    });
    text(
      `${Math.max(0, Math.ceil(45 - g.elapsed))} Sekunden`,
      24,
      35,
      21,
      '#254857',
    );
    text(
      g.cooldown > 0 ? 'Konfetti wird nachgefüllt …' : 'Konfetti bereit!',
      24,
      385,
      16,
      '#fff',
    );
  }
}
