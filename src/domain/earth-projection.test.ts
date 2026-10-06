import { describe, expect, it } from 'vitest';
import {
  buildEarthSurface,
  earthCallouts,
  earthCutFace,
  earthProbePosition,
  projectEarth,
  rotateEarth,
  type EarthPoint,
} from './earth-projection';

function facePoints(radius: number, side: 'left' | 'right', rotation = 0) {
  const coordinates = earthCutFace(radius, side, rotation)
    .match(/-?\d+\.\d+/g)!
    .map(Number);
  return Array.from({ length: coordinates.length / 2 }, (_, i) =>
    coordinates.slice(i * 2, i * 2 + 2),
  );
}
function pointDistance(point: EarthPoint, a: EarthPoint, b: EarthPoint) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const fraction = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(
    point[0] - a[0] - fraction * dx,
    point[1] - a[1] - fraction * dy,
  );
}
function cross(a: EarthPoint, b: EarthPoint, p: EarthPoint) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}
function segmentDistance(
  a: EarthPoint,
  b: EarthPoint,
  c: EarthPoint,
  d: EarthPoint,
) {
  if (
    cross(a, b, c) * cross(a, b, d) < 0 &&
    cross(c, d, a) * cross(c, d, b) < 0
  )
    return 0;
  return Math.min(
    pointDistance(a, c, d),
    pointDistance(b, c, d),
    pointDistance(c, a, b),
    pointDistance(d, a, b),
  );
}

describe('drehbarer großer Erdschnitt', () => {
  it('öffnet tatsächlich 140 Grad und behält ausgefüllte konzentrische Schnittflächen', () => {
    const equatorAngles = (['right', 'left'] as const).map((side) => {
      const [x, y] = facePoints(214, side)[32];
      const rx = (Math.sqrt(2) * (x - 320) + Math.sqrt(6) * (y - 250)) / 2;
      const ry = (-Math.sqrt(2) * (x - 320) + Math.sqrt(6) * (y - 250)) / 2;
      return (Math.atan2(ry, rx) * 180) / Math.PI;
    });
    expect(equatorAngles[1] - equatorAngles[0]).toBeCloseTo(140, 2);
    for (const rotation of [-35, -20, 0, 20, 35]) {
      for (const side of ['left', 'right'] as const) {
        const outer = facePoints(214, side, rotation);
        for (const radius of [214, 190, 110, 53]) {
          const path = earthCutFace(radius, side, rotation);
          expect(path.match(/M/g)).toHaveLength(1);
          expect(path.endsWith(' Z')).toBe(true);
          const points = facePoints(radius, side, rotation);
          expect(points).toHaveLength(65);
          points.forEach(([x, y], i) => {
            expect(x - 320).toBeCloseTo(
              ((outer[i][0] - 320) * radius) / 214,
              1,
            );
            expect(y - 250).toBeCloseTo(
              ((outer[i][1] - 250) * radius) / 214,
              1,
            );
          });
          const other = facePoints(
            radius,
            side === 'left' ? 'right' : 'left',
            rotation,
          );
          expect(points[0]).toEqual(other[0]);
          expect(points[64]).toEqual(other[64]);
          expect(Math.abs(points[32][0] - 320)).toBeGreaterThan(radius * 0.57);
        }
      }
    }
  });

  it('dreht den Körper im Raum, hält die Pole fest und sortiert sichtbare Oberflächen neu', () => {
    expect(rotateEarth(40, 20, 70, 25)[2]).toBe(70);
    expect(Math.hypot(...rotateEarth(40, 20, 70, 25))).toBeCloseTo(
      Math.hypot(40, 20, 70),
    );
    expect(projectEarth(0, 0, 214, 35)).toEqual(projectEarth(0, 0, 214, -35));
    expect(projectEarth(214, 0, 0, 35)).not.toEqual(
      projectEarth(214, 0, 0, -35),
    );
    expect(rotateEarth(40, 20, 70, 90)).toEqual(rotateEarth(40, 20, 70, 35));
    const surfaces = [-35, -20, 0, 20, 35].map(buildEarthSurface);
    expect(surfaces[0].map((piece) => piece.points)).not.toEqual(
      surfaces[4].map((piece) => piece.points),
    );
    for (const surface of surfaces) {
      expect(surface.length).toBeGreaterThan(500);
      surface.forEach((piece, i) => {
        expect(piece.depth).toBeGreaterThan(0);
        expect(piece.points).not.toMatch(/NaN|Infinity/);
        if (i) expect(piece.depth).toBeGreaterThanOrEqual(surface[i - 1].depth);
      });
    }
  });

  it('hält A–D-Leitungen, fremde Beschriftungen und alle Sondenlagen mit Abstand getrennt', () => {
    // Dense sweep also covers the continuous intermediate pointer orientations.
    for (let step = -350; step <= 350; step++) {
      const rotation = step / 10;
      const callouts = earthCallouts(rotation);
      const leaders = callouts.map(
        ({ anchor, elbow, end }) =>
          [
            [anchor, elbow],
            [elbow, end],
          ] as const,
      );
      for (let i = 0; i < 4; i++) {
        if (i)
          expect(
            callouts[i].anchor[1] - callouts[i - 1].anchor[1],
          ).toBeGreaterThan(22);
        for (let j = i + 1; j < 4; j++)
          for (const [a, b] of leaders[i])
            for (const [c, d] of leaders[j])
              expect(segmentDistance(a, b, c, d)).toBeGreaterThan(12);
        for (let j = 0; j < 4; j++) {
          const probe = earthProbePosition(j, rotation);
          for (const [a, b] of leaders[i]) {
            expect(pointDistance(probe, a, b)).toBeGreaterThan(17);
            if (i !== j)
              expect(pointDistance(callouts[j].label, a, b)).toBeGreaterThan(
                22,
              );
          }
        }
      }
    }
  });
});
