import { drawMaze } from './maze-draw';
import type { Game } from './engine';

const gems = [
  '#15223f',
  '#50e4dd',
  '#ffce57',
  '#ba8bff',
  '#97df71',
  '#ff85af',
  '#ffad65',
  '#75baff',
];
type Paint = string | CanvasGradient;

// All scenes use logical 640 × 400 coordinates, independent of display density.
function brushes(c: CanvasRenderingContext2D) {
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: Paint,
    radius = 0,
  ) => {
    c.fillStyle = fill;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    c.fill();
  };
  const oval = (x: number, y: number, rx: number, ry: number, fill: Paint) => {
    c.fillStyle = fill;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  };
  const poly = (points: number[][], fill: Paint) => {
    c.fillStyle = fill;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  };
  const line = (points: number[][], color: string, width = 2) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };
  const text = (
    value: string,
    x: number,
    y: number,
    size = 16,
    color = '#f2faff',
  ) => {
    c.fillStyle = color;
    c.font = `800 ${size}px system-ui, sans-serif`;
    c.fillText(value, x, y);
  };
  const gradient = (top: string, bottom: string, y = 0, height = 400) => {
    const fill = c.createLinearGradient(0, y, 0, y + height);
    fill.addColorStop(0, top);
    fill.addColorStop(1, bottom);
    return fill;
  };
  const glow = (x: number, y: number, radius: number, color: string) => {
    const fill = c.createRadialGradient(x, y, 0, x, y, radius);
    fill.addColorStop(0, color);
    fill.addColorStop(1, `${color.slice(0, 7)}00`);
    oval(x, y, radius, radius, fill);
  };
  const star = (x: number, y: number, radius: number, color = '#ffdd6b') => {
    poly(
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 ? radius * 0.48 : radius;
        return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
      }),
      color,
    );
  };
  return { box, oval, poly, line, text, gradient, glow, star };
}
type Brushes = ReturnType<typeof brushes>;

function cosmos(b: Brushes, time: number, blocks: boolean) {
  b.box(0, 0, 640, 400, b.gradient('#0c1635', '#33275d'));
  b.glow(505, 100, 230, '#6344ab60');
  b.glow(70, 360, 240, '#126a9660');
  for (let i = 0; i < 70; i++) {
    const x = (i * 137 + 21) % 640;
    const y = ((i * 79 + time * ((i % 3) + 1) * 2) % 440) - 20;
    b.oval(
      x,
      y,
      i % 5 ? 0.8 : 1.6,
      i % 5 ? 0.8 : 1.6,
      i % 3 ? '#9aafd080' : '#e2edff',
    );
  }
  if (blocks) {
    b.oval(101, 182, 72, 17, '#ba97e54a');
    b.oval(101, 182, 43, 43, b.gradient('#a080e0', '#4a4286', 139, 86));
    b.oval(88, 165, 10, 6, '#d1b1f045');
    b.oval(113, 194, 16, 10, '#30295c50');
    b.line(
      [
        [34, 194],
        [77, 205],
        [132, 190],
        [169, 166],
      ],
      '#d7b9ff90',
      4,
    );
  } else {
    b.oval(554, 266, 92, 92, b.gradient('#457398', '#243354', 174, 184));
    b.poly(
      [
        [499, 198],
        [536, 190],
        [551, 226],
        [524, 250],
        [492, 233],
      ],
      '#6199a55a',
    );
    b.poly(
      [
        [568, 261],
        [618, 254],
        [631, 291],
        [589, 325],
        [555, 300],
      ],
      '#6092aa50',
    );
    b.oval(542, 245, 103, 112, '#141e4738');
    b.oval(63, 274, 24, 24, '#72849d');
    b.oval(55, 269, 7, 7, '#475c7d');
    b.oval(69, 285, 5, 4, '#536684');
  }
}

function crystal(
  b: Brushes,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  b.box(x, y + 2, size, size - 2, '#050e25', 4);
  b.box(x + 1, y, size - 2, size - 3, color, 4);
  b.poly(
    [
      [x + 3, y + 3],
      [x + size - 4, y + 3],
      [x + size - 7, y + 6],
      [x + 6, y + 6],
    ],
    '#ffffff90',
  );
  b.poly(
    [
      [x + 3, y + 5],
      [x + 6, y + 8],
      [x + 6, y + size - 7],
      [x + 3, y + size - 4],
    ],
    '#ffffff40',
  );
  b.poly(
    [
      [x + 7, y + size - 6],
      [x + size - 4, y + size - 6],
      [x + size - 4, y + 7],
    ],
    '#16234e30',
  );
}

function blocks(b: Brushes, g: Game) {
  cosmos(b, g.elapsed, true);
  b.box(210, 10, 220, 380, '#788ac533', 13);
  b.box(215, 15, 210, 370, '#080f24', 8);
  b.line(
    [
      [214, 55],
      [214, 22],
      [247, 22],
    ],
    '#74e1ed',
    2,
  );
  b.line(
    [
      [426, 344],
      [426, 378],
      [393, 378],
    ],
    '#b894ff',
    2,
  );
  g.board.forEach((row, y) =>
    row.forEach((v, x) => {
      b.box(
        220 + x * 20,
        20 + y * 20,
        19,
        19,
        y % 2 ? '#111c33' : '#132039',
        2,
      );
      if (v) crystal(b, 220 + x * 20, 20 + y * 20, 19, gems[v]);
    }),
  );
  g.piece.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v)
        crystal(
          b,
          220 + (g.pieceX + x) * 20,
          20 + (g.pieceY + y) * 20,
          19,
          gems[g.color],
        );
    }),
  );
  b.text('MISSION', 30, 57, 12, '#9ab9de');
  b.text('REIHEN', 30, 86, 25);
  b.text('KNACKEN', 30, 116, 25, '#77ede4');
  b.star(72, 287, 16);
  b.text('100', 100, 295, 28);
  b.text('pro voller Reihe', 30, 325, 15, '#b9cee5');
  b.box(453, 36, 160, 91, '#ffffff0d', 16);
  b.text('NOCH ZEIT', 470, 61, 12, '#a6c2e3');
  b.text(
    `${Math.max(0, Math.ceil(240 - g.elapsed))} s`,
    470,
    99,
    31,
    '#ffdb79',
  );
  b.text('Lücken füllen.', 452, 187, 18);
  b.text('Reihen feiern!', 452, 214, 18);
  b.line(
    [
      [453, 241],
      [609, 241],
    ],
    '#a7bcdf40',
  );
  b.text('Mehrere Reihen', 453, 272, 15, '#b9cee5');
  b.text('auf einmal?', 453, 294, 15, '#b9cee5');
  b.text('Bonus kassieren!', 453, 323, 16, '#77ede4');
}

function cloud(b: Brushes, x: number, y: number, scale = 1) {
  b.oval(x, y + 9 * scale, 44 * scale, 12 * scale, '#85b7d91c');
  b.oval(x, y, 37 * scale, 12 * scale, '#ffffffdf');
  b.oval(x - 16 * scale, y - 9 * scale, 16 * scale, 16 * scale, '#ffffffdf');
  b.oval(x + 6 * scale, y - 14 * scale, 22 * scale, 22 * scale, '#ffffffef');
}

function meadow(b: Brushes, camera: number, farm: boolean) {
  b.box(0, 0, 640, 400, b.gradient(farm ? '#88d5e7' : '#80c9ee', '#e7f6d6'));
  b.glow(553, 63, 70, '#fff4c280');
  b.oval(553, 63, 29, 29, '#fff3ab');
  b.oval(545, 55, 21, 21, '#fff8c8');
  for (let i = 0; i < 4; i++)
    cloud(
      b,
      ((((i * 205 + 30 - camera * 0.12) % 830) + 830) % 830) - 80,
      64 + (i % 2) * 42,
      0.7 + (i % 2) * 0.25,
    );
  for (let i = -1; i < 4; i++) {
    const x = i * 280 - ((camera * 0.16) % 280);
    b.poly(
      [
        [x - 120, 315],
        [x + 52, 133],
        [x + 208, 315],
      ],
      '#82b9bc',
    );
    b.poly(
      [
        [x + 7, 182],
        [x + 52, 133],
        [x + 99, 188],
        [x + 59, 174],
        [x + 38, 190],
      ],
      '#e5f0dc',
    );
    b.oval(x + 170, 335, 170, 100, '#7ec6a6');
  }
  for (let i = -1; i < 5; i++) {
    const x = i * 180 - ((camera * 0.35) % 180);
    b.oval(x, 354, 148, 95, i % 2 ? '#50ac8c' : '#69bb8d');
    b.box(x + 58, 262, 7, 65, '#568775', 3);
    b.oval(x + 62, 257, 24, 33, '#3a9a82');
    b.oval(x + 56, 246, 17, 23, '#55b48c');
  }
  b.box(0, 0, 640, 400, '#ffffff05');
  b.box(0, 350, 640, 50, b.gradient('#9b684f', '#724854', 350, 50));
  b.box(0, 350, 640, 9, '#244f59');
  b.box(0, 348, 640, 7, '#c3eb88');
  b.box(0, 354, 640, 5, '#74b569');
  for (let i = 0; i < 30; i++) {
    const x = ((((i * 29 - camera) % 680) + 680) % 680) - 20;
    b.box(x, 370 + (i % 3) * 9, 5 + (i % 3) * 2, 3, '#d3a57366', 2);
    if (i % 3 === 0)
      b.line(
        [
          [x, 348],
          [x - 3, 344],
          [x, 346],
          [x + 3, 342],
        ],
        '#bde887',
        2,
      );
  }
}

function runner(b: Brushes, g: Game) {
  const camera = g.x - 120;
  meadow(b, camera, false);
  g.entities.forEach((e) => {
    const x = e.x - camera;
    if (x < -50 || x > 660) return;
    b.oval(x + 18, 349, 25, 5, '#164d4c35');
    b.box(x, e.y, e.w, e.h, '#67443d', 5);
    b.box(
      x + 2,
      e.y + 3,
      e.w - 4,
      e.h - 5,
      b.gradient('#bf8d58', '#966139', e.y, e.h),
      5,
    );
    b.line(
      [
        [x + 6, e.y + 5],
        [x + 5, e.y + 25],
      ],
      '#e8b974',
      3,
    );
    b.line(
      [
        [x + 29, e.y + 10],
        [x + 29, e.y + 26],
      ],
      '#71463c',
      2,
    );
    b.oval(x + 18, e.y + 15, 9, 11, '#e4b578');
    b.oval(x + 18, e.y + 15, 5, 7, '#ad7449');
    b.oval(x + 18, e.y + 15, 2, 3, '#74473a');
    b.box(x - 1, e.y - 1, 38, 5, '#7cbd6b', 3);
  });
  g.coins.forEach((e, i) => {
    if (!e.alive) return;
    const x = e.x - camera + 10;
    if (x < -20 || x > 660) return;
    b.glow(x, e.y + 10, 22, '#fff3a560');
    b.star(x, e.y + 11, 10, '#b97831');
    b.star(x, e.y + 9, 10);
    b.oval(x - 2, e.y + 6, 2, 2, '#fff8d7');
    if (Math.sin(g.elapsed * 3 + i) > 0.6) b.star(x + 13, e.y, 3, '#fffced');
  });
  const flag = 3400 - camera;
  if (flag < 670) {
    b.box(flag, 162, 5, 188, '#346a65', 2);
    b.oval(flag + 2, 160, 6, 6, '#ffe493');
    b.poly(
      [
        [flag + 5, 168],
        [flag + 66, 174],
        [flag + 57, 193],
        [flag + 66, 216],
        [flag + 5, 209],
      ],
      '#785ee0',
    );
    b.text('ZIEL', flag + 13, 195, 16);
  }
  const stride = g.y >= 310 ? Math.sin(g.elapsed * 20) * 3 : -2;
  b.oval(134, 349, Math.max(7, 19 - (310 - g.y) / 30), 4, '#164d4c35');
  // Solid character shapes follow the engine's 28 × 40 hitbox; scarf is decorative.
  if (g.invincible <= 0 || Math.floor(g.elapsed * 12) % 2) {
    b.poly(
      [
        [122, g.y + 20],
        [107, g.y + 17],
        [110, g.y + 23],
        [104, g.y + 27],
        [124, g.y + 25],
      ],
      '#f38e62',
    );
    b.box(123 + stride, g.y + 33, 8, 7, '#244959', 3);
    b.box(137 - stride, g.y + 33, 8, 7, '#244959', 3);
    b.box(
      124,
      g.y + 19,
      20,
      17,
      b.gradient('#c29bff', '#7358bf', g.y + 19, 17),
      5,
    );
    b.box(120, g.y + 2, 28, 20, '#e9f8f4', 7);
    b.box(122, g.y + 7, 24, 11, '#24485b', 5);
    b.oval(137, g.y + 12, 2, 2, '#81eee5');
    b.oval(143, g.y + 12, 2, 2, '#81eee5');
    b.line(
      [
        [125, g.y + 4],
        [130, g.y + 4],
      ],
      '#fff',
      2,
    );
    b.box(123, g.y + 20, 23, 4, '#ffb069', 2);
    b.star(134, g.y + 29, 4, '#ffdb84');
    b.box(144, g.y + 25, 4, 8, '#dcf0e6', 2);
  }
  b.box(18, 16, 201, 51, '#163e53e8', 13);
  b.text('DEIN WEG ZUM ZIEL', 32, 36, 11, '#bcdfdd');
  b.box(32, 47, 138, 6, '#527382', 3);
  b.box(32, 47, Math.max(2, 138 * Math.min(1, g.x / 3400)), 6, '#aee98e', 3);
  b.text(`${Math.min(100, Math.floor((g.x / 3400) * 100))}%`, 180, 54, 13);
}

function space(b: Brushes, g: Game) {
  cosmos(b, g.elapsed, false);
  b.poly(
    [
      [0, 397],
      [0, 382],
      [80, 382],
      [98, 391],
      [233, 391],
      [245, 385],
      [403, 385],
      [415, 391],
      [570, 391],
      [591, 381],
      [640, 381],
      [640, 400],
    ],
    '#516281',
  );
  b.line(
    [
      [0, 383],
      [80, 383],
      [98, 392],
      [233, 392],
      [245, 386],
      [403, 386],
      [415, 392],
      [570, 392],
      [591, 382],
      [640, 382],
    ],
    '#a1cbd6',
    2,
  );
  for (let x = 12; x < 640; x += 39) b.box(x, 394, 18, 3, '#65d6d0', 1);
  g.entities.forEach((e, i) => {
    if (!e.alive) return;
    const color = ['#bba0ff', '#ffbf78', '#fb91b8'][(g.wave - 1) % 3];
    b.oval(e.x + 15, e.y + 23, 10, 2, '#adbdff30');
    b.line(
      [
        [e.x + 7, e.y + 5],
        [e.x + 5, e.y + 1],
      ],
      '#e0d3ff',
      2,
    );
    b.line(
      [
        [e.x + 23, e.y + 5],
        [e.x + 25, e.y + 1],
      ],
      '#e0d3ff',
      2,
    );
    b.box(e.x + 3, e.y + 4, 24, 18, color, 6);
    b.box(e.x, e.y + 11, 5, 9, color, 2);
    b.box(e.x + 25, e.y + 11, 5, 9, color, 2);
    b.box(e.x + 6, e.y + 8, 18, 8, '#263151', 4);
    b.oval(e.x + 11, e.y + 12, 2, 2, '#a9f9e9');
    b.oval(e.x + 19, e.y + 12, 2, 2, '#a9f9e9');
    b.line(
      [
        [e.x + 10, e.y + 19],
        [e.x + 19, e.y + 19],
      ],
      '#ffffff70',
      1,
    );
    b.box(e.x + 5, e.y + 21, 6, 4, '#9fe7e6', 2);
    b.box(e.x + 19, e.y + 21, 6, 4, '#9fe7e6', 2);
    b.oval(
      e.x + 15,
      e.y + 2,
      1.8,
      1.8,
      Math.sin(g.elapsed * 3 + i) > 0 ? '#f8e498' : '#bb9fe6',
    );
  });
  if (g.invincible <= 0 || Math.floor(g.elapsed * 12) % 2) {
    const flame = 6 + Math.sin(g.elapsed * 30) * 3;
    b.poly(
      [
        [g.x + 10, g.y + 27],
        [g.x + 15, g.y + 30 + flame],
        [g.x + 20, g.y + 27],
      ],
      '#ffac66',
    );
    b.poly(
      [
        [g.x + 12, g.y + 26],
        [g.x + 15, g.y + 31 + flame / 2],
        [g.x + 18, g.y + 26],
      ],
      '#fff1bc',
    );
    b.poly(
      [
        [g.x + 15, g.y],
        [g.x + 30, g.y + 28],
        [g.x + 21, g.y + 26],
        [g.x + 15, g.y + 21],
        [g.x + 9, g.y + 26],
        [g.x, g.y + 28],
      ],
      '#67d9dc',
    );
    b.poly(
      [
        [g.x + 15, g.y],
        [g.x + 20, g.y + 25],
        [g.x + 10, g.y + 25],
      ],
      '#e1fbf6',
    );
    b.oval(g.x + 15, g.y + 14, 4, 6, '#34547d');
    b.oval(g.x + 14, g.y + 12, 1.5, 2.5, '#8fe5e8');
    b.line(
      [
        [g.x + 4, g.y + 25],
        [g.x + 8, g.y + 19],
      ],
      '#befff2',
      2,
    );
    b.line(
      [
        [g.x + 26, g.y + 25],
        [g.x + 22, g.y + 19],
      ],
      '#befff2',
      2,
    );
  }
  g.shots.forEach((s) => {
    b.box(s.x - 5, s.y - 3, 10, 18, s.enemy ? '#ff7aaa30' : '#71f4ef30', 5);
    b.box(s.x - 3, s.y, 6, 12, s.enemy ? '#ff9fb5' : '#a5fff2', 3);
    b.box(s.x - 1, s.y + 2, 2, 7, '#fff5e6', 1);
  });
  b.box(18, 15, 202, 32, '#0b183ce8', 12);
  b.text(`WELLE ${g.wave} / 6`, 32, 36, 14, '#b9fff0');
  for (let i = 0; i < 6; i++)
    b.oval(136 + i * 13, 31, 3, 3, i < g.wave ? '#ffe28e' : '#546285');
}

function farm(b: Brushes) {
  b.box(414, 271, 134, 77, '#b05e54', 3);
  b.box(419, 277, 124, 70, '#d98565', 2);
  for (let x = 428; x < 542; x += 13)
    b.line(
      [
        [x, 282],
        [x, 346],
      ],
      '#ba6c56',
      2,
    );
  b.poly(
    [
      [401, 280],
      [481, 224],
      [561, 280],
    ],
    '#494e6f',
  );
  b.poly(
    [
      [401, 280],
      [481, 224],
      [481, 235],
      [413, 283],
    ],
    '#777794',
  );
  b.line(
    [
      [405, 282],
      [481, 231],
      [557, 282],
    ],
    '#eac293',
    4,
  );
  b.box(462, 299, 38, 49, '#5e4b59', 3);
  b.line(
    [
      [464, 301],
      [498, 346],
    ],
    '#e8b58b',
    3,
  );
  b.line(
    [
      [498, 301],
      [464, 346],
    ],
    '#e8b58b',
    3,
  );
  b.box(432, 288, 17, 20, '#b9e8df', 3);
  b.line(
    [
      [440, 289],
      [440, 307],
    ],
    '#ffddb6',
    2,
  );
  b.box(513, 288, 17, 20, '#b9e8df', 3);
  b.oval(481, 264, 12, 12, '#ffd8a2');
  b.star(481, 264, 8, '#ae6b60');
  for (let x = -8; x < 660; x += 35) {
    b.box(x + 2, 327, 9, 35, '#698e7830', 2);
    b.poly(
      [
        [x, 361],
        [x, 327],
        [x + 4, 320],
        [x + 9, 327],
        [x + 9, 361],
      ],
      '#fff0c7',
    );
  }
  b.box(0, 332, 640, 6, '#efdab0');
  b.box(0, 349, 640, 5, '#efdab0');
  for (const x of [29, 77, 208, 377, 582, 618]) {
    b.line(
      [
        [x, 348],
        [x - 1, 336],
      ],
      '#3e8b67',
      2,
    );
    b.oval(x, 335, 4, 3, '#f7c3ad');
    b.oval(x, 335, 1.5, 1.5, '#ffe892');
  }
}

function chickens(c: CanvasRenderingContext2D, b: Brushes, g: Game) {
  meadow(b, 0, true);
  farm(b);
  g.entities.forEach((e, i) => {
    c.save();
    c.translate(e.x + (i % 2 ? 56 : 0), e.y);
    if (i % 2) c.scale(-1, 1);
    b.poly(
      [
        [11, 22],
        [1, 12],
        [3, 29],
        [0, 29],
        [14, 36],
      ],
      '#697391',
    );
    b.oval(25, 27, 19, 15, '#ba8a66');
    b.oval(26, 24, 19, 15, i % 2 ? '#fbe4b5' : '#fff7dc');
    b.oval(25, 29, 13, 8, '#fffbee70');
    b.box(22, 38, 3, 6, '#df994e', 1);
    b.box(31, 38, 3, 6, '#df994e', 1);
    b.line(
      [
        [20, 44],
        [26, 44],
      ],
      '#df994e',
      2,
    );
    b.line(
      [
        [29, 44],
        [35, 44],
      ],
      '#df994e',
      2,
    );
    b.oval(42, 15, 10, 12, '#fff7df');
    b.oval(38, 3, 3, 3, '#ec777a');
    b.oval(43, 2, 3, 3, '#ec777a');
    b.oval(47, 4, 3, 3, '#ec777a');
    b.oval(47, 13, 3.5, 4, '#fff');
    b.oval(48, 13, 1.8, 2.3, '#2e3e51');
    b.oval(49, 12, 0.7, 0.7, '#fff');
    b.poly(
      [
        [50, 17],
        [56, 19],
        [50, 22],
      ],
      '#f0ac48',
    );
    b.oval(48, 24, 2.5, 3.5, '#ee8580');
    const wing = Math.sin(g.elapsed * 13 + i) * 5;
    b.oval(21, 21 + wing, 12, 7, i % 2 ? '#d7a774' : '#e6c793');
    b.line(
      [
        [13, 22 + wing],
        [22, 25 + wing],
        [28, 24 + wing],
      ],
      '#ae885f',
      1.5,
    );
    c.restore();
    b.oval(e.x + 9, e.y + 3, 11, 11, '#254568');
    b.text(String(i + 1), e.x + 4, e.y + 8, 14);
  });
  g.bursts.forEach((burst) => {
    for (let i = 0; i < 14; i++) {
      const angle = (i * Math.PI) / 7;
      const radius = (1 - burst.ttl) * 65;
      const x = burst.x + Math.cos(angle) * radius;
      const y = burst.y + Math.sin(angle) * radius + (1 - burst.ttl) * 12;
      c.save();
      c.globalAlpha = Math.min(1, burst.ttl * 2);
      c.translate(x, y);
      c.rotate(angle + g.elapsed * 2);
      b.box(-3, -2, 6, 4, gems[1 + (i % 7)], 1);
      c.restore();
    }
  });
  b.box(18, 15, 170, 36, '#214b60ed', 12);
  b.text(`${Math.max(0, Math.ceil(90 - g.elapsed))} Sekunden`, 32, 40, 19);
  b.box(158, 370, 324, 23, '#3a354de8', 11);
  b.oval(177, 381, 4, 4, g.cooldown > 0 ? '#ffbb80' : '#a4e99e');
  b.text(
    g.cooldown > 0 ? 'Konfetti wird nachgefüllt …' : 'Konfetti bereit!',
    190,
    386,
    14,
  );
}

export function drawGame(c: CanvasRenderingContext2D, g: Game) {
  c.save();
  c.clearRect(0, 0, 640, 400);
  const b = brushes(c);
  if (g.id === 'maze') drawMaze(c, g);
  else if (g.id === 'blocks') blocks(b, g);
  else if (g.id === 'runner') runner(b, g);
  else if (g.id === 'space') space(b, g);
  else chickens(c, b, g);
  c.restore();
}
