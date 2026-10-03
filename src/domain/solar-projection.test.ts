import { expect, it } from 'vitest';
import { solarBodies } from './solar-system';
import { orbitalPeriodDays } from './solar-orbits';
import {
  projectSolarPoint,
  solarOrbitPath,
  solarPlanetPosition,
} from './solar-projection';

it('hält den Sonnenmittelpunkt fest und stellt nahe Punkte perspektivisch größer dar', () => {
  for (const yaw of [-180, 0, 180]) {
    for (const tilt of [15, 38, 80]) {
      const center = projectSolarPoint(0, 0, yaw, tilt);
      expect(center).toMatchObject({ x: 500, y: 315 });
      expect(center.scale).toBeGreaterThan(0);
      expect(center.depth).toBeCloseTo(0);
    }
  }
  const near = projectSolarPoint(50, -200, 0, 38);
  const far = projectSolarPoint(50, 200, 0, 38);
  expect(near.depth).toBeLessThan(far.depth);
  expect(near.scale).toBeGreaterThan(far.scale);
  expect(Math.abs(near.x - 500)).toBeGreaterThan(Math.abs(far.x - 500));
  expect(projectSolarPoint(200, 0, 0, 38).x).toBeGreaterThan(500);
  expect(projectSolarPoint(200, 0, 180, 38).x).toBeLessThan(500);
});

it('zeigt acht Planeten und Pluto über den ganzen Reglerbereich innerhalb der Bildfläche', () => {
  for (let yaw = -180; yaw <= 180; yaw += 15) {
    for (let tilt = 15; tilt <= 80; tilt += 5) {
      for (const planet of solarBodies) {
        const point = solarPlanetPosition(planet, yaw, tilt);
        expect(Object.values(point).every(Number.isFinite)).toBe(true);
        expect(point.radius).toBeGreaterThan(0);
        expect(point.x - point.radius - 8).toBeGreaterThan(0);
        expect(point.x + point.radius + 8).toBeLessThan(1000);
        expect(point.y - point.radius - 17).toBeGreaterThan(0);
        expect(point.y + point.radius + 8).toBeLessThan(650);
      }
    }
  }
});

it('liefert geschlossene endliche Umlaufbahnen und ändert sie beim Drehen oder Kippen', () => {
  for (const planet of solarBodies) {
    const path = solarOrbitPath(planet.order, 0, 38);
    expect(path).toMatch(/^M[-\d., ]+(?:L[-\d., ]+)+ Z$/);
    expect(path).not.toMatch(/NaN|Infinity/);
    const coordinates = path.match(/[-\d.]+,[-\d.]+/g)!;
    expect(coordinates[0]).toBe(coordinates.at(-1));
    expect(solarOrbitPath(planet.order, 75, 38)).not.toBe(path);
    expect(solarOrbitPath(planet.order, 0, 80)).not.toBe(path);
  }
});

it('hält alle neun Welten auch während des Umlaufs bei jedem Blickwinkel in der Bildfläche', () => {
  for (const yaw of [-180, -90, 0, 90, 180]) {
    for (const tilt of [15, 38, 80]) {
      for (const planet of solarBodies) {
        for (const fraction of [
          0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875,
        ]) {
          const earthYears =
            (orbitalPeriodDays[planet.id] / orbitalPeriodDays.earth) * fraction;
          const point = solarPlanetPosition(planet, yaw, tilt, earthYears);
          expect(Object.values(point).every(Number.isFinite)).toBe(true);
          expect(point.radius).toBeGreaterThan(0);
          expect(point.x - point.radius - 8).toBeGreaterThan(0);
          expect(point.x + point.radius + 8).toBeLessThan(1000);
          expect(point.y - point.radius - 17).toBeGreaterThan(0);
          expect(point.y + point.radius + 8).toBeLessThan(650);
        }
      }
    }
  }
});
