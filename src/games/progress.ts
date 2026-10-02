import type { Game } from './engine';

// Small, optional goals celebrate progress; they never end a round or award points.
export function gameProgress(g: Game) {
  if (g.id === 'blocks')
    return {
      label: 'Dein Reihen-Ziel',
      value: Math.min(5, g.lines),
      max: 5,
      detail: g.over
        ? `${g.lines} ${g.lines === 1 ? 'Reihe' : 'Reihen'} geschafft`
        : g.lines >= 5
          ? `${g.lines} Reihen! Staple weiter.`
          : `${g.lines} von 5 Reihen`,
    };
  if (g.id === 'maze') {
    const stars = g.maze?.stars ?? [];
    const found = stars.filter((star) => !star.alive).length;
    return {
      label: 'Deine Sternensammlung',
      value: found,
      max: 5,
      detail: g.won
        ? 'Alle Sterne gesammelt und das Portal gefunden!'
        : found === 5
          ? 'Alle Sterne da! Finde das grüne Portal.'
          : `${found} von 5 Sternen`,
    };
  }
  if (g.id === 'space')
    return {
      label: 'Deine Rettungsmission',
      value:
        (g.wave - 1) * 24 + g.entities.filter((robot) => !robot.alive).length,
      max: 144,
      detail: g.won
        ? 'Alle 6 Wellen geschafft!'
        : `Welle ${g.wave} von 6 · ${g.entities.filter((robot) => robot.alive).length} Roboter übrig`,
    };
  if (g.id === 'chickens') {
    const greeted = g.chickenHits.filter(Boolean).length;
    return {
      label: 'Deine Hühnerparty',
      value: greeted,
      max: 5,
      detail: g.over
        ? `${g.score / 50} Konfettitreffer · ${greeted} von 5 Hühnern begrüßt`
        : greeted === 5
          ? 'Alle 5 begrüßt! Die Party geht weiter.'
          : `${greeted} von 5 Hühnern begrüßt`,
    };
  }
  return {
    label: 'Dein Weg zur Zielfahne',
    value: Math.min(100, Math.floor((g.x / 3400) * 100)),
    max: 100,
    detail: `${Math.min(100, Math.floor((g.x / 3400) * 100))} % des Wegs geschafft`,
  };
}
