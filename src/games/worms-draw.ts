import {
  activeWorm,
  predictWormShot,
  teamEnergy,
  type Worm,
  type WormsState,
} from './worms';

const colors = { player: '#73ecdf', cpu: '#ffbc73' };

/** Own canvas art: a floating island, expressive worms and a toy energy launcher. */
export function drawWorms(
  c: CanvasRenderingContext2D,
  state: WormsState,
  reducedMotion = false,
) {
  c.save();
  const sky = c.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#202841');
  sky.addColorStop(0.72, '#4b657d');
  sky.addColorStop(1, '#9db6b6');
  c.fillStyle = sky;
  c.fillRect(0, 0, 640, 400);
  c.fillStyle = '#ffe2a459';
  c.beginPath();
  c.arc(533, 105, 39, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffe2a4';
  c.beginPath();
  c.arc(533, 105, 27, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 22; i++) {
    c.fillStyle = '#dceeff80';
    c.fillRect(
      (i * 97 + 29) % 640,
      75 + ((i * 37) % 118),
      i % 3 ? 1.5 : 2.5,
      i % 3 ? 1.5 : 2.5,
    );
  }
  // Silhouettes remain still; reduced motion removes only decorative ripples/bursts.
  for (let island = 0; island < 3; island++) {
    c.fillStyle = ['#344556', '#354b5b', '#3a5360'][island];
    c.beginPath();
    c.moveTo(island * 235 - 90, 368);
    c.lineTo(island * 235 - 8, 208 + island * 12);
    c.lineTo(island * 235 + 48, 187 + island * 9);
    c.lineTo(island * 235 + 95, 248);
    c.lineTo(island * 235 + 180, 368);
    c.fill();
  }
  c.beginPath();
  c.moveTo(0, 400);
  state.terrain.forEach((height, x) => c.lineTo(x, height));
  c.lineTo(640, 400);
  c.closePath();
  c.fillStyle = '#806351';
  c.fill();
  c.save();
  c.clip();
  for (let line = 0; line < 5; line++) {
    c.strokeStyle = line % 2 ? '#b58a6355' : '#433e4c80';
    c.lineWidth = 7;
    c.beginPath();
    for (let x = 0; x <= 640; x += 8) {
      const y = 313 + line * 25 + Math.sin(x / 48 + line) * 8;
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  for (let i = 0; i < 55; i++) {
    c.fillStyle = '#ddc39155';
    c.fillRect((i * 73 + 41) % 640, 287 + ((i * 31) % 110), 3 + (i % 4), 2);
  }
  c.restore();
  c.strokeStyle = '#b0dd93';
  c.lineWidth = 7;
  c.lineJoin = 'round';
  c.beginPath();
  state.terrain.forEach((height, x) => {
    if (x === 0) c.moveTo(x, height);
    else c.lineTo(x, height);
  });
  c.stroke();
  c.strokeStyle = '#4d886b';
  c.lineWidth = 2;
  c.stroke();

  const active = activeWorm(state);
  if (
    !state.over &&
    active &&
    (state.phase === 'aim' || state.phase === 'cpu')
  ) {
    const path = predictWormShot(state).slice(0, 15);
    c.strokeStyle = '#edfaff90';
    c.lineWidth = 2;
    c.setLineDash([3, 6]);
    c.beginPath();
    path.forEach((p, i) => {
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    });
    c.stroke();
    c.setLineDash([]);
  }
  if (state.trail.length > 1) {
    c.strokeStyle = '#fff5ba';
    c.lineWidth = 2;
    c.setLineDash([2, 5]);
    c.beginPath();
    state.trail.forEach((p, i) => {
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    });
    c.stroke();
    c.setLineDash([]);
  }
  for (const worm of state.worms)
    drawWorm(c, worm, state, worm.id === state.activeId && !state.over);
  if (state.projectile) {
    c.fillStyle = '#ffe78c';
    c.strokeStyle = '#233650';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(state.projectile.x, state.projectile.y, 5.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#fffef0';
    c.beginPath();
    c.arc(state.projectile.x - 1, state.projectile.y - 1, 2, 0, Math.PI * 2);
    c.fill();
  }
  if (state.blast) {
    const progress = 1 - state.blast.ttl / 0.65;
    const radius = reducedMotion ? 24 : 12 + progress * 42;
    c.strokeStyle = `rgba(255, 233, 156, ${Math.max(0.15, 1 - progress)})`;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(state.blast.x, state.blast.y, radius, 0, Math.PI * 2);
    c.stroke();
    if (!reducedMotion)
      for (let spark = 0; spark < 8; spark++) {
        const angle = (spark * Math.PI) / 4;
        c.fillStyle = '#fff1ad';
        c.fillRect(
          state.blast.x + Math.cos(angle) * radius - 2,
          state.blast.y + Math.sin(angle) * radius - 2,
          4,
          4,
        );
      }
  }
  const water = c.createLinearGradient(0, state.waterY, 0, 400);
  water.addColorStop(0, '#69dfecc9');
  water.addColorStop(1, '#235f8eee');
  c.fillStyle = water;
  c.fillRect(0, state.waterY, 640, 400 - state.waterY);
  c.strokeStyle = '#c0ffff';
  c.lineWidth = 2;
  c.beginPath();
  for (let x = 0; x <= 640; x += 5) {
    const y =
      state.waterY +
      Math.sin(x / 19 + (reducedMotion ? 0 : state.elapsed * 1.4)) * 1.5;
    if (x === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  drawHud(c, state);
  c.restore();
}

function drawWorm(
  c: CanvasRenderingContext2D,
  worm: Worm,
  state: WormsState,
  active: boolean,
) {
  c.save();
  c.translate(worm.x, Math.min(worm.y, state.waterY - 5));
  if (worm.energy === 0) {
    c.strokeStyle = '#cce5ed90';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, -5, 5, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#d4e6ef';
    c.font = '10px system-ui';
    c.textAlign = 'center';
    c.fillText(`${worm.name} · aus`, 0, -16);
    c.restore();
    return;
  }
  c.fillStyle = '#13273755';
  c.beginPath();
  c.ellipse(0, 10, 15, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#243649';
  c.lineWidth = 2;
  c.fillStyle = colors[worm.team];
  c.beginPath();
  c.moveTo(-10, 8);
  c.bezierCurveTo(-15, 0, -7, -4, -8, -11);
  c.bezierCurveTo(-9, -23, 9, -25, 12, -13);
  c.bezierCurveTo(18, -1, 10, 10, -10, 8);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = worm.team === 'player' ? '#277c87' : '#b1754d';
  c.lineWidth = 1;
  for (let stripe = 0; stripe < 3; stripe++) {
    c.beginPath();
    c.moveTo(-8, stripe * 4 - 2);
    c.quadraticCurveTo(0, stripe * 4 + 1, 9, stripe * 4 - 2);
    c.stroke();
  }
  c.fillStyle = '#f9ffff';
  c.beginPath();
  c.ellipse(worm.facing * 4, -14, 6, 5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#22394d';
  c.beginPath();
  c.arc(worm.facing * 6, -14, 2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#243649';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(worm.facing * 3, -6);
  c.quadraticCurveTo(worm.facing * 7, -3, worm.facing * 10, -6);
  c.stroke();
  // Team headbands and labels distinguish teams independently of body color.
  c.strokeStyle = worm.team === 'player' ? '#164b66' : '#693a56';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-6, -20);
  c.lineTo(8, -20);
  c.stroke();
  if (active && (state.phase === 'aim' || state.phase === 'cpu')) {
    const radians = (state.angle * Math.PI) / 180;
    c.strokeStyle = '#1b344c';
    c.lineWidth = 11;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(2 * worm.facing, -5);
    c.lineTo(Math.cos(radians) * worm.facing * 18, -Math.sin(radians) * 18 - 3);
    c.stroke();
    c.strokeStyle = '#bfd6e1';
    c.lineWidth = 7;
    c.stroke();
    c.strokeStyle = '#ffe78c';
    c.lineWidth = 2;
    c.stroke();
  }
  c.fillStyle = '#152941d9';
  c.fillRect(-30, -59, 60, 16);
  c.fillStyle = '#ffffff';
  c.font = 'bold 10px system-ui';
  c.textAlign = 'center';
  c.fillText(`${worm.name} · ${worm.team === 'player' ? 'DU' : 'CPU'}`, 0, -47);
  c.fillStyle = '#142d43';
  c.fillRect(-25, -39, 50, 7);
  c.fillStyle = colors[worm.team];
  c.fillRect(-24, -38, worm.energy * 0.48, 5);
  c.fillStyle = '#ffffff';
  c.font = 'bold 10px system-ui';
  c.fillText(`${worm.energy}`, 0, -25);
  if (active) {
    c.fillStyle = '#fff3bb';
    c.beginPath();
    c.moveTo(-5, -70);
    c.lineTo(5, -70);
    c.lineTo(0, -63);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function drawHud(c: CanvasRenderingContext2D, state: WormsState) {
  c.fillStyle = '#12273bde';
  c.fillRect(12, 12, 616, 47);
  c.fillStyle = '#ffffff';
  c.font = 'bold 16px system-ui';
  c.textAlign = 'left';
  c.fillText(
    `Du ${teamEnergy(state, 'player')}  :  ${teamEnergy(state, 'cpu')} CPU`,
    24,
    32,
  );
  c.font = '12px system-ui';
  c.fillStyle = '#e0eaf2';
  c.fillText(
    `Zug ${state.turn}/${state.maxTurns} · ${activeWorm(state)?.name ?? '–'} · ${state.team === 'player' ? 'dein Team' : 'Computerteam'}`,
    24,
    49,
  );
  c.textAlign = 'right';
  c.font = 'bold 14px system-ui';
  c.fillStyle = '#ffe5a5';
  c.fillText(`${state.score} Spielpunkte`, 614, 31);
  c.font = '12px system-ui';
  c.fillStyle = '#e0eaf2';
  c.fillText(
    `Wind ${state.wind < 0 ? '←' : state.wind > 0 ? '→' : '·'} ${Math.abs(state.wind)} · ${Math.round(state.angle)}° · ${Math.round(state.power)} %`,
    614,
    49,
  );
}
