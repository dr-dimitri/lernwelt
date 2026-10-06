import { describe, expect, it } from 'vitest';
import { earthCutFace, earthSurface, projectEarth } from './earth-projection';

describe('isometrischer Viertelschnitt', () => {
  it('verkürzt alle drei Raumachsen gleich und hält ihre Winkel bei 120 Grad', () => {
    const origin = projectEarth(0, 0, 0);
    const axes = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ].map(([x, y, z]) =>
      projectEarth(x, y, z).map((value, i) => value - origin[i]),
    );
    const lengths = axes.map(([x, y]) => Math.hypot(x, y));
    expect(lengths[0]).toBeCloseTo(lengths[1]);
    expect(lengths[1]).toBeCloseTo(lengths[2]);
    for (let i = 0; i < 3; i++) {
      const a = axes[i];
      const b = axes[(i + 1) % 3];
      expect(
        (a[0] * b[0] + a[1] * b[1]) / (lengths[i] * lengths[(i + 1) % 3]),
      ).toBeCloseTo(-0.5);
    }
  });

  it('verbindet beide Schnittflächen jeder Schicht an denselben Polen', () => {
    for (const radius of [214, 190, 110, 53]) {
      const left = earthCutFace(radius, 'left')
        .match(/-?\d+\.\d+/g)!
        .map(Number);
      const right = earthCutFace(radius, 'right')
        .match(/-?\d+\.\d+/g)!
        .map(Number);
      expect(left.slice(0, 2)).toEqual(right.slice(0, 2));
      expect(left.slice(-2)).toEqual(right.slice(-2));
      expect(left[64]).toBeLessThan(320);
      expect(right[64]).toBeGreaterThan(320);
    }
    expect(earthSurface.length).toBeGreaterThan(0);
    expect(
      earthSurface.every(
        (piece) => piece.depth > 0 && !piece.points.includes('NaN'),
      ),
    ).toBe(true);
  });
});
